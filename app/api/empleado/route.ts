// app/api/empleado/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cedula } = body;

        // Usamos la variable de entorno aquí
        const apiUrl = process.env.SEDEMI_API_URL;

        if (!apiUrl) {
            throw new Error("La variable SEDEMI_API_URL no está configurada.");
        }

        const response = await axios.post(apiUrl, {
            parameter: cedula,
            estado: "A",
            codEmpresa: "",
            codDepartamento: ""
        }, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}