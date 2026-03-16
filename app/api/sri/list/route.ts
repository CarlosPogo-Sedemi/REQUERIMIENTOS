export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toInt(v: string | null, def: number) {
  const n = parseInt(v || "", 10);
  return Number.isFinite(n) ? n : def;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, toInt(searchParams.get("page"), 1));
  const pageSize = Math.min(100, Math.max(5, toInt(searchParams.get("pageSize"), 20)));
  const skip = (page - 1) * pageSize;

  const sortBy = searchParams.get("sortBy") || "fechaEmision";
  const sortDir = (searchParams.get("sortDir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const fClave = (searchParams.get("claveAcceso") || "").trim();
  const fRuc = (searchParams.get("rucEmisor") || "").trim();
  const fRazon = (searchParams.get("razonSocialEmisor") || "").trim();
  const fSerie = (searchParams.get("serieComprobante") || "").trim();
  const fTipo = (searchParams.get("tipoComprobante") || "").trim();
  const fReceptor = (searchParams.get("identificacionReceptor") || "").trim();


  // fechas en formato YYYY-MM-DD
  const from = (searchParams.get("from") || "").trim();
  const to = (searchParams.get("to") || "").trim();

  const where: any = {};

  if (fClave) where.claveAcceso = { contains: fClave, mode: "insensitive" };
  if (fRuc) where.rucEmisor = { contains: fRuc, mode: "insensitive" };
  if (fRazon) where.razonSocialEmisor = { contains: fRazon, mode: "insensitive" };
  if (fSerie) where.serieComprobante = { contains: fSerie, mode: "insensitive" };
  if (fTipo) where.tipoComprobante = { contains: fTipo, mode: "insensitive" };
  if (fReceptor) where.identificacionReceptor = { contains: fReceptor, mode: "insensitive" };

  if (from || to) {
    where.fechaEmision = {};
    if (from) where.fechaEmision.gte = new Date(from + "T00:00:00");
    if (to) where.fechaEmision.lte = new Date(to + "T23:59:59");
  }

  // allowlist de campos para sort
  const allowedSort = new Set([
    "fechaEmision",
    "fechaAutorizacion",
    "rucEmisor",
    "razonSocialEmisor",
    "importeTotal",
    "serieComprobante",
    "tipoComprobante",
  ]);

  const orderBy: any = allowedSort.has(sortBy) ? { [sortBy]: sortDir } : { fechaEmision: "desc" };

  const [total, items] = await Promise.all([
    prisma.sriInvoice.count({ where }),
    prisma.sriInvoice.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        claveAcceso: true,
        rucEmisor: true,
        razonSocialEmisor: true,
        tipoComprobante: true,
        serieComprobante: true,
        fechaEmision: true,
        fechaAutorizacion: true,
        identificacionReceptor: true,
        valorSinImpuestos: true,
        iva: true,
        importeTotal: true,

        // AGREGA ESTO: (Verifica si el nombre en tu schema es 'files')
        files: {
          select: {
            kind: true,
            storagePath: true,
          }
        },
      },
    }),
  ]);


  const rucs = Array.from(new Set(items.map(i => i.rucEmisor).filter(Boolean)));

  const profiles = await prisma.sriRucProfile.findMany({
    where: { ruc: { in: rucs } },
    select: {
      ruc: true,
      tipoContribuyente: true,
      regimen: true,
      actividadEconomicaPrincipal: true,
    },
  });

  const profileMap = new Map(profiles.map(p => [p.ruc, p]));

  const itemsWithProfile = items.map(it => ({
    ...it,
    rucProfile: profileMap.get(it.rucEmisor) || null,
  }));


  return NextResponse.json({
    ok: true,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    items: itemsWithProfile,
  });
}
