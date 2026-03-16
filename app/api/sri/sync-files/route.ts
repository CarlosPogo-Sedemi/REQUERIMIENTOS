import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET: Obtener facturas que NO tienen archivos asociados
export async function GET() {
  try {
    const pendientes = await prisma.sriInvoice.findMany({
      where: {
        files: {
          none: {} // Filtra facturas que tienen 0 registros en SriInvoiceFile
        }
      },
      select: {
        id: true,
        claveAcceso: true,
        fechaEmision: true
      }
    });

    return NextResponse.json({ ok: true, count: pendientes.length, pendientes });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// 2. POST: Crear el registro del archivo asociado a la factura
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { claveAcceso, storagePath, kind, fileName } = body;

    // Buscamos la factura por clave de acceso para obtener su ID interno
    const invoice = await prisma.sriInvoice.findUnique({
      where: { claveAcceso }
    });

    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Factura no encontrada" }, { status: 404 });
    }

    // Creamos el registro en la tabla de archivos
    const newFile = await prisma.sriInvoiceFile.create({
      data: {
        invoiceId: invoice.id,
        kind: kind || "PDF", // Por defecto PDF si no se envía
        fileName: fileName || `${claveAcceso}.pdf`,
        mimeType: kind === "XML" ? "application/xml" : "application/pdf",
        storagePath: storagePath, // Aquí va la URL de SharePoint
      }
    });

    return NextResponse.json({ ok: true, fileId: newFile.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}