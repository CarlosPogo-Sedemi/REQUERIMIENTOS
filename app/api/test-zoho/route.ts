import { NextResponse } from 'next/server';
import { listarTodasLasCuentas } from '@/lib/zoho';

export async function GET() {
  const resultado = await listarTodasLasCuentas();

  if (!resultado || !resultado.data) {
    return NextResponse.json({ message: 'No hay datos o error de conexión' }, { status: 500 });
  }

  // Esto te devolverá un Array con todas las empresas
  // ... dentro de tu mapeo .map((e: any) => ({ ... }))
  return NextResponse.json({
    total: resultado.data.length,
    empresas: resultado.data.map((e: any) => ({
      nombre: e.Account_Name,
      ruc: e.Account_Number,
      calificacion: e.Rating,
      id: e.id,
      // NUEVOS CAMPOS:
      sector: e.Industry || 'No definido',
      ingresos: e.Annual_Revenue || 0,
      telefono: e.Phone || 'S/N',
      web: e.Website || 'No disponible',
      creado: new Date(e.Created_Time).toLocaleDateString()
    }))
  });
}