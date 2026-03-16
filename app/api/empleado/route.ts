import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Clave de ScraperAPI y la URL de Sedemi
    const scraperApiKey = "81018c7a573a7cb458ba66f081367bf5";
    const targetUrl = "https://backstack.sedemi.com:7048/api/EvolutionEmployee/EmployeesEvolution";

    // Armamos la URL del proxy para disfrazar la IP de Netlify
    const proxyUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`;

    const response = await axios.post(
      proxyUrl,
      {
        parameter: body.parameter || "",
        estado: "A",
        codEmpresa: "",
        codDepartamento: ""
      },
      {
        // Esto ignora el error de SSL
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
        error: "Error al consultar la API a traves del proxy",
        detail: error.message
      },
      { status: 500 }
    );
  }
}