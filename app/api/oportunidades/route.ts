import { NextResponse } from 'next/server';
import { consultarOportunidadesZCRM } from '@/lib/zoho';

export async function GET() {
  // Rango de fechas para la consulta (puedes dinamizar esto luego)
  const inicio = '2025-03-09';
  const fin = '2026-03-28';

  const oportunidades = await consultarOportunidadesZCRM(inicio, fin);

  if (!oportunidades) {
    return NextResponse.json({ message: 'Error al conectar con Zoho' }, { status: 500 });
  }

  return NextResponse.json({
    total: oportunidades.length,
    oportunidades: oportunidades.map((op: any, index: number) => ({
      id: op.id || op.Deal_Id || `op-${index}`,
      cliente: op.customerName,
      ruc: op.ruc,
      descripcion: op.opportunityDescription,
      oficina: op.saleOffice,
      estado: op.type,
      fecha: op.uploadDate
    }))
  });
}