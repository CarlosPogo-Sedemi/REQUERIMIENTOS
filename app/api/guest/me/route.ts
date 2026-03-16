import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/guestSession";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/guest_session=([^;]+)/);
    const sessionToken = match?.[1];

    if (!sessionToken) {
      return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });
    }

    const sessionHash = sha256(sessionToken);
    const now = new Date();

    const sess = await prisma.guestSession.findUnique({
      where: { sessionHash },
      include: { case: true, guest: true },
    });

    if (!sess) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
    if (sess.expiresAt <= now) return NextResponse.json({ ok: false, error: "Session expired" }, { status: 401 });

    // Si el caso expiró, bloquear
    if (sess.case.expiresAt && sess.case.expiresAt <= now) {
      return NextResponse.json({ ok: false, error: "Case expired" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      case: {
        id: sess.case.id,
        status: sess.case.status,
        activatedAt: sess.case.activatedAt,
        expiresAt: sess.case.expiresAt,
        folderUrl: sess.case.folderUrl,
      },
      guest: {
        email: sess.guest.email,
        isActive: sess.guest.isActive,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
