import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const ruc = (body?.ruc || "").toString().trim();
    if (!ruc) {
      return NextResponse.json({ ok: false, error: "Falta ruc" }, { status: 400 });
    }

    const data = {
      ruc,
      razonSocial: body?.razonSocial?.toString()?.trim() || null,
      actividadEconomicaPrincipal: body?.actividadEconomicaPrincipal?.toString()?.trim() || null,
      tipoContribuyente: body?.tipoContribuyente?.toString()?.trim() || null,
      regimen: body?.regimen?.toString()?.trim() || null,
      extraJson: body?.extra ?? null,
    };

    const saved = await prisma.sriRucProfile.upsert({
      where: { ruc },
      create: data,
      update: data,
      select: { ruc: true, updatedAt: true },
    });

    return NextResponse.json({ ok: true, saved });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error." }, { status: 500 });
  }
}