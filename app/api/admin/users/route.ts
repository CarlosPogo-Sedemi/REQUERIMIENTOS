import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getMeIdFromBearer(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.replace("Bearer ", "");

  const r = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const me = await r.json();
  return me.id as string;
}

export async function GET(req: Request) {
  const meId = await getMeIdFromBearer(req);
  if (!meId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const meUser = await prisma.user.findUnique({ where: { aadObjectId: meId } });
  if (!meUser || meUser.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, displayName: true, upn: true, mail: true, role: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, users });
}
