/*
import { NextResponse } from 'next/server';
import axios from 'axios';
import { verTodosLosModulos } from '@/lib/zoho';
import { obtenerCamposModulo } from '@/lib/zoho';

// Copiamos la lógica del token para este debug rápido
async function getAccessToken() {
  const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
    params: {
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token'
    }
  });
  return response.data.access_token;
}

export async function GET(request: Request) {
  // Extraemos el parámetro 'module' de la URL (ej: ?module=Deals)
  const { searchParams } = new URL(request.url);
  const modulo = searchParams.get('module') || 'Accounts'; // 'Accounts' por defecto

  try {
    const campos = await obtenerCamposModulo(modulo);
    
    if (!campos) {
      return NextResponse.json({ error: 'No se pudieron obtener los campos' }, { status: 500 });
    }

    return NextResponse.json({
      modulo_consultado: modulo,
      total_campos: campos.length,
      campos: campos
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
*/


import { NextResponse } from 'next/server';
import { verTodosLosModulos } from '@/lib/zoho';

export async function GET() {
  try {
    // Aquí llamamos a la función que ya tiene el 'nombre_en_web'
    const modulos = await verTodosLosModulos();
    return NextResponse.json(modulos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
