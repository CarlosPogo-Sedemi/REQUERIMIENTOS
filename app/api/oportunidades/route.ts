import { NextResponse, NextRequest } from 'next/server';
import { consultarOportunidadesZCRM } from '@/lib/zoho';

export async function GET(request: NextRequest) {
  // Obtenemos los parámetros de la URL
  const { searchParams } = new URL(request.url);
  const anio = searchParams.get('anio');
  const mes = searchParams.get('mes');

  if (!anio || !mes) {
    return NextResponse.json({ message: 'Faltan parámetros de fecha' }, { status: 400 });
  }

  // Calculamos el primer y último día del mes seleccionado
  const inicio = `${anio}-${mes}-01`;
  
  // Para el fin, calculamos el último día del mes
  const ultimoDia = new Date(Number(anio), Number(mes), 0).getDate();
  const fin = `${anio}-${mes}-${ultimoDia}`;

  const oportunidades = await consultarOportunidadesZCRM(inicio, fin);

  if (!oportunidades) {
    return NextResponse.json({ message: 'Error al conectar con Zoho' }, { status: 500 });
  }

  // Retornamos los datos formateados
  return NextResponse.json({
    total: oportunidades.length,
    datos_empresas: JSON.stringify(oportunidades.map((op: any, index: number) => ({
      id: op.id || op.Deal_Id || `op-${index}`,
      cliente: op.customerName,
      ruc: op.ruc,
      descripcion: op.opportunityDescription,
      oficina: op.saleOffice,
      estado: op.type,
      fecha: op.uploadDate
    })))
  });
}