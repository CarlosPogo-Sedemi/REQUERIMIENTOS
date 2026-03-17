/*
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
  */


import { NextResponse } from "next/server";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Obtenemos un proxy gratuito al azar usando una API publica
    // Proxyscrape devuelve proxies en formato texto plano (ejemplo: 198.51.100.1:8080)
    const proxyListResponse = await axios.get("https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all");
    
    // Tomamos el primer proxy de la lista devuelta
    const proxyList = proxyListResponse.data.split('\r\n');
    const proxyElegido = proxyList[0]; 

    if (!proxyElegido) {
        throw new Error("No se encontraron proxies gratuitos disponibles");
    }

    const [proxyHost, proxyPort] = proxyElegido.split(':');

    console.log(`Intentando conectar a Sedemi usando el proxy gratis: ${proxyHost}:${proxyPort}`);

    // 2. Configuramos el tunel pasando la URL completa como texto
    // y las opciones de seguridad en el segundo parametro
    const proxyUrlCompleta = `http://${proxyHost}:${proxyPort}`;

    const agent = new HttpsProxyAgent(proxyUrlCompleta, {
      rejectUnauthorized: false
    });

    // 3. Hacemos la llamada a Sedemi disfrazados
    const response = await axios.post(
      "https://backstack.sedemi.com:7048/api/EvolutionEmployee/EmployeesEvolution",
      {
        parameter: body.parameter || "",
        estado: "A",
        codEmpresa: "",
        codDepartamento: ""
      },
      {
        httpsAgent: agent,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    return NextResponse.json(response.data);

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Fallo la conexion con el proxy gratuito",
        detail: error.message
      },
      { status: 500 }
    );
  }
}