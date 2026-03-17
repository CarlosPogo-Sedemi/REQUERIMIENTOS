import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const targetUrl = "https://backstack.sedemi.com:7048/api/EvolutionEmployee/EmployeesEvolution";

    // 1. Array con tus múltiples API Keys de ScraperAPI
    // Puedes ir agregando más a esta lista (N cuentas)
    const scraperApiKeys = [
      "81018c7a573a7cb458ba66f081367bf5", // Tu primera cuenta (actual)
      "62a6402b516bbc7946dcb12b8c183f5d",          // Tu segunda cuenta (reemplázala)
      "AQUI_TU_TERCERA_API_KEY"           // Tu tercera cuenta (reemplázala)
    ];

    let lastError: any = null;

    // 2. Intentamos realizar la petición iterando por cada clave
    for (const apiKey of scraperApiKeys) {
      // Nos saltamos las que dicen "AQUI_..." por si acaso no las has cambiado
      if (!apiKey || apiKey.startsWith("AQUI")) continue;

      try {
        console.log(`Intentando conectar a Sedemi usando ScraperAPI Key que inicia en: ${apiKey.substring(0, 5)}...`);
        const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;

        const response = await axios.post(
          proxyUrl,
          {
            parameter: body.parameter || "",
            estado: "A",
            codEmpresa: "",
            codDepartamento: ""
          },
          {
            // Evita problemas de certificados SSL no confiables de Sedemi
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        // Si la petición fue exitosa, devolvemos los datos y SALIMOS del bucle.
        // No seguirá intentando con las demás llaves, ahorrando saldo.
        console.log("¡Petición exitosa!");
        return NextResponse.json(response.data);

      } catch (error: any) {
        // Si hay un error (ej. límite de 1000 créditos alcanzado, ScraperAPI devuelve 403), 
        // guardamos el error e intentamos con la SIGUIENTE clave.
        console.log(`Fallo con la API key ${apiKey.substring(0, 5)}... Causa: ${error.message}`);
        lastError = error;
      }
    }

    // 3. Si terminamos el bucle y llegamos aquí, significa que TODAS las llaves fallaron o se agotaron
    return NextResponse.json(
      {
        error: "Todas las cuentas de ScraperAPI han alcanzado su límite o fallaron.",
        detail: lastError?.message
      },
      { status: 500 }
    );

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        detail: error.message
      },
      { status: 500 }
    );
  }
}