import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cedula } = body;

        const response = await axios.post('https://backstack.sedemi.com:7048/api/EvolutionEmployee/EmployeesEvolution', {
            parameter: cedula,
            estado: "A",
            codEmpresa: "",
            codDepartamento: ""
        }, {
            // Esto es CLAVE: permite la conexión aunque el certificado 
            // del puerto 7048 tenga problemas o no sea reconocido
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error en el Proxy:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}