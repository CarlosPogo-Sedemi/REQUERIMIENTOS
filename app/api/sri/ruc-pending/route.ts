import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    // RUCs distintos en facturas
    const invoiceRucs = await prisma.sriInvoice.findMany({
      distinct: ["rucEmisor"],
      select: { rucEmisor: true },
      take: 10000,
    });

    const rucs = invoiceRucs.map(x => x.rucEmisor).filter(Boolean);

    if (rucs.length === 0) {
      return NextResponse.json({ ok: true, items: [] });
    }

    // Perfiles existentes
    const existing = await prisma.sriRucProfile.findMany({
      where: { ruc: { in: rucs } },
      select: { ruc: true },
    });

    const existingSet = new Set(existing.map(x => x.ruc));
    const pending = rucs.filter(r => !existingSet.has(r)).slice(0, limit);

    return NextResponse.json({ ok: true, items: pending });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error." }, { status: 500 });
  }
}