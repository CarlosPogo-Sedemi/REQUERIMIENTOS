import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCedula } from "@/lib/security";

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
    const me = await getMe(req);
    if (!me?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const actor = await prisma.user.findUnique({ where: { aadObjectId: me.id } });
    if (!actor || !actor.isActive) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    if (actor.role !== "ADMIN" && actor.role !== "GESTOR_TTHH") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { email, cedula } = await req.json();
    if (!email || !cedula) return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });

    const emailNorm = String(email).toLowerCase().trim();
    const cedulaStr = String(cedula).trim();

    // Crea guest + case (1:1)
    const guest = await prisma.guest.create({
      data: {
        email: emailNorm,
        cedulaHash: await hashCedula(cedulaStr),
      },
    });

    const caseRow = await prisma.case.create({
      data: {
        guestId: guest.id,
        createdById: actor.id,
        status: "PENDIENTE_DOCS",
        activatedAt: null,
        expiresAt: null,
      },
    });

    return NextResponse.json({ ok: true, guest, case: caseRow });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
