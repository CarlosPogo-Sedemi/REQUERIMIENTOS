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

//Endpoint GET para listar usuarios con paginación, filtrado por estado (activo/inactivo) y búsqueda por nombre, email o UPN.
export async function GET(req: Request) {
  const meId = await getMeIdFromBearer(req);
  if (!meId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const meUser = await prisma.user.findUnique({ where: { aadObjectId: meId } });
  if (!meUser || meUser.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = 15;

  const status = (url.searchParams.get("status") || "active").toLowerCase(); // active|inactive|all
  const q = (url.searchParams.get("q") || "").trim();

  const where: any = {};

  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: "insensitive" } },
      { upn: { contains: q, mode: "insensitive" } },
      { mail: { contains: q, mode: "insensitive" } },
    ];
  }

  const total = await prisma.user.count({ where });

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      displayName: true,
      upn: true,
      mail: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    users,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    status,
    q,
  });
}

// Endpoint PATCH para actualizar el rol o estado (activo/inactivo) de un usuario específico.
export async function PATCH(req: Request) {
  try {
    // obtener id desde la URL 
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // .../users/{id}
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const meId = await getMeIdFromBearer(req);
    if (!meId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const meUser = await prisma.user.findUnique({ where: { aadObjectId: meId } });
    if (!meUser || meUser.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { role, isActive } = await req.json();

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: role ?? undefined,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
      },
      select: { id: true, displayName: true, upn: true, mail: true, role: true, isActive: true },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
