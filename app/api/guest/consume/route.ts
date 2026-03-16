import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256 as sha256Token, verifyCedula } from "@/lib/security";
import { makeSessionToken, sha256 } from "@/lib/guestSession";

export async function POST(req: Request) {
  try {
    const { token, cedula } = await req.json();
    if (!token || !cedula) return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });

    const tokenHash = sha256Token(String(token));
    const now = new Date();

    const tokenRow = await prisma.magicLinkToken.findUnique({
      where: { tokenHash },
      include: { guest: true, case: true },
    });

    if (!tokenRow) return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 });
    if (tokenRow.usedAt) return NextResponse.json({ ok: false, error: "Token already used" }, { status: 400 });
    if (tokenRow.expiresAt <= now) return NextResponse.json({ ok: false, error: "Token expired" }, { status: 400 });
    if (!tokenRow.guest.isActive) return NextResponse.json({ ok: false, error: "Guest inactive" }, { status: 403 });

    const cedOk = await verifyCedula(String(cedula).trim(), tokenRow.guest.cedulaHash);
    if (!cedOk) return NextResponse.json({ ok: false, error: "Cedula mismatch" }, { status: 400 });

    // Marcar token como usado
    await prisma.magicLinkToken.update({
      where: { tokenHash },
      data: { usedAt: now },
    });

    // Activar caso si es primera vez (2 días exactos desde activación)
    const caseRow = tokenRow.case;
    let activatedAt = caseRow.activatedAt;
    let expiresAt = caseRow.expiresAt;

    if (!activatedAt || !expiresAt) {
      activatedAt = now;
      expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      await prisma.case.update({
        where: { id: caseRow.id },
        data: { activatedAt, expiresAt },
      });
    }

    // Crear sesión invitado hasta expiresAt del caso
    const sessionToken = makeSessionToken();
    const sessionHash = sha256(sessionToken);

    await prisma.guestSession.create({
      data: {
        sessionHash,
        guestId: tokenRow.guest.id,
        caseId: caseRow.id,
        expiresAt: expiresAt!,
      },
    });

    const res = NextResponse.json({
      ok: true,
      caseId: caseRow.id,
      activatedAt: activatedAt!.toISOString(),
      expiresAt: expiresAt!.toISOString(),
    });

    // Cookie segura (local: secure=false)
    res.cookies.set("guest_session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt!, // vence con el caso
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
