import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await axios.post(
      "https://backstack.sedemi.com:7048/api/EvolutionEmployee/EmployeesEvolution",
      {
        parameter: body.parameter || "",
        estado: "A",
        codEmpresa: "",
        codDepartamento: ""
      },
      {
        // Esto es vital para saltar el error del certificado en el puerto 7048
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    return NextResponse.json(response.data);

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Error al consultar la API",
        detail: error.message
      },
      { status: 500 }
    );
  }
}