import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Obtenemos la clave de los parámetros de la URL (?clave=...)
    const { searchParams } = new URL(req.url);
    const claveAcceso = searchParams.get("clave")?.trim();

    if (!claveAcceso) {
      return NextResponse.json({ ok: false, error: "Falta claveAcceso" }, { status: 400 });
    }

    // Buscamos en la tabla production usando Prisma
    // Ajusta 'production' al nombre real de tu modelo en schema.prisma
    const invoice = await prisma.sriInvoice.findUnique({
      where: {
        claveAcceso: claveAcceso,
      },
      select: { claveAcceso: true } // Solo pedimos el ID para que sea ultra rápido
    });

    return NextResponse.json({
      ok: true,
      exists: !!invoice, // Retorna true si existe, false si no
    });

  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Error consultando DB." },
      { status: 500 }
    );
  }
}