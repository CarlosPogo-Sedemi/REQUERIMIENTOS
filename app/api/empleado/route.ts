import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {

    const body = await req.json();

    const response = await fetch(
      "https://backstack.sedemi.com:7048/api/EvolutionEmployee/EmployeesEvolution",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parameter: body.parameter || "",
          estado: "A",
          codEmpresa: "",
          codDepartamento: ""
        }),
      }
    );

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error) {

    return NextResponse.json(
      {
        error: "Error al consultar la API",
        detail: error
      },
      { status: 500 }
    );

  }
}