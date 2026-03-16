import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(req: Request) {
  const me = await getMe(req);
  if (!me?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const actor = await prisma.user.findUnique({ where: { aadObjectId: me.id } });
  if (!actor || !actor.isActive) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  if (actor.role !== "ADMIN" && actor.role !== "GESTOR_TTHH") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const where: any = actor.role === "ADMIN" ? {} : { createdById: actor.id };

  const cases = await prisma.case.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { guest: true },
    take: 50,
  });

  return NextResponse.json({ ok: true, cases });
}
