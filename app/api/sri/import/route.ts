import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function parseEcuadorNumber(s: string): Prisma.Decimal {
  const normalized = (s ?? "").trim().replace(",", ".");
  return new Prisma.Decimal(normalized || "0");
}

function parseDateTimeEC(s?: string): Date | null {
  if (!s) return null;
  const v = s.trim();
  if (!v) return null;

  const parts = v.split(" ");
  const datePart = parts[0];
  const timePart = parts[1] || "00:00:00";

  const [dd, mm, yyyy] = datePart.split("/").map((x) => parseInt(x, 10));
  const [HH, MM, SS] = timePart.split(":").map((x) => parseInt(x, 10));

  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd, HH || 0, MM || 0, SS || 0);
}

function parseTxtContent(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) throw new Error("El TXT no tiene suficientes líneas.");

  const header = lines[0].split("\t").map((h) => h.trim());

  const rows = lines.slice(1).map((line) => {
    const cols = line.split("\t");
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => (obj[h] = (cols[idx] ?? "").trim()));
    return obj;
  });

  return { header, rows };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const txtFile = form.get("txt") as File | null;

    if (!txtFile) {
      return NextResponse.json(
        { ok: false, error: "Falta archivo TXT (campo 'txt')." },
        { status: 400 }
      );
    }

    const txtName = txtFile.name;
    const txtContent = await txtFile.text();
    const txtHash = crypto.createHash("sha256").update(txtContent).digest("hex");

    const { rows } = parseTxtContent(txtContent);

    const data = rows
      .map((r) => {
        const claveAcceso = (r["CLAVE_ACCESO"] || "").trim();
        if (!claveAcceso) return null;

        return {
          claveAcceso,
          rucEmisor: r["RUC_EMISOR"] || "",
          razonSocialEmisor: r["RAZON_SOCIAL_EMISOR"] || "",
          tipoComprobante: r["TIPO_COMPROBANTE"] || "",
          serieComprobante: r["SERIE_COMPROBANTE"] || "",
          fechaAutorizacion: parseDateTimeEC(r["FECHA_AUTORIZACION"]),
          fechaEmision: parseDateTimeEC(r["FECHA_EMISION"]),
          identificacionReceptor: r["IDENTIFICACION_RECEPTOR"] || null,
          valorSinImpuestos: parseEcuadorNumber(r["VALOR_SIN_IMPUESTOS"]),
          iva: parseEcuadorNumber(r["IVA"]),
          importeTotal: parseEcuadorNumber(r["IMPORTE_TOTAL"]),
          numeroDocumentoModificado: r["NUMERO_DOCUMENTO_MODIFICADO"] || null,
          sourceTxtName: txtName,
          rawRow: r as any,
        };
      })
      .filter(Boolean) as any[];

    if (data.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No se encontraron filas válidas en el TXT." },
        { status: 400 }
      );
    }

    const result = await prisma.sriInvoice.createMany({
      data,
      skipDuplicates: true, // claveAcceso unique
    });

    const inserted = result.count;
    const duplicates = data.length - inserted;

    return NextResponse.json({
      ok: true,
      summary: {
        file: txtName,
        sha256: txtHash,
        totalRows: data.length,
        inserted,
        duplicates,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Error procesando importación." },
      { status: 500 }
    );
  }
}
