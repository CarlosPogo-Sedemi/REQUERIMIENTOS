import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, sha256 } from "@/lib/security";

async function getMe(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.replace("Bearer ", "");

  const r = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  return r.json();
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);

        // ✅ FIX: extraer caseId correctamente
    const parts = url.pathname.split("/").filter(Boolean);
    // ["api","tthh","cases","<caseId>","send-link"]
    const caseId = parts[3];

    if (!caseId) return NextResponse.json({ ok: false, error: "Missing caseId" }, { status: 400 });

    const me = await getMe(req);
    if (!me?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const actor = await prisma.user.findUnique({ where: { aadObjectId: me.id } });
    if (!actor || !actor.isActive) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    if (actor.role !== "ADMIN" && actor.role !== "GESTOR_TTHH") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const caseRow = await prisma.case.findUnique({ where: { id: caseId }, include: { guest: true } });
    if (!caseRow) return NextResponse.json({ ok: false, error: "Case not found" }, { status: 404 });

    // ✅ opcional: invalida tokens anteriores no usados (más seguro)
    await prisma.magicLinkToken.updateMany({
      where: { caseId, usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    const token = generateToken();
    const tokenHash = sha256(token);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.magicLinkToken.create({
      data: {
        tokenHash,
        guestId: caseRow.guestId,
        caseId: caseRow.id,
        createdById: actor.id,
        expiresAt,
      },
    });

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const link = `${baseUrl}/guest/access?token=${encodeURIComponent(token)}`;

    // TODO (luego): llamar Flow para enviar email al guest.email con el link
    return NextResponse.json({ ok: true, link, expiresAt: expiresAt.toISOString(), emailTo: caseRow.guest.email });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
