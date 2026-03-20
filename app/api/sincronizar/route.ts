import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import { prisma } from "@/lib/prisma"; // Asegúrate de que esta ruta apunte a tu cliente Prisma

// Agente HTTPS que ignora certificados SSL auto-firmados (necesario para Sedemi)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function POST(req: Request) {
  try {
    console.log("Iniciando sincronización masiva de empleados...");

    // URL directa de la API de Sedemi — Next.js SÍ puede llamarla (es el puente)
    const targetUrl = "https://backstack.sedemi.com:7048/api/EvolutionEmployee/EmployeesEvolution";

    console.log("Llamando directamente a la API de Sedemi...");

    const response = await axios.post(
      targetUrl,
      {
        parameter: "",
        estado: "",
        codEmpresa: "",
        codDepartamento: ""
      },
      {
        httpsAgent,
        headers: { "Content-Type": "application/json" },
        timeout: 60000 // 60 segundos
      }
    );

    // Validar que la respuesta tenga datos
    const empleadosData = response.data?.result;

    if (!empleadosData || empleadosData.length === 0) {
      throw new Error("La API de Sedemi no devolvió registros. Verifica que el endpoint esté disponible.");
    }

    console.log(`Se encontraron ${empleadosData.length} empleados. Comenzando actualización en Prisma...`);

    // 3. Procesamiento seguro con Prisma (Upsert fila por fila)
    let procesadosConExito = 0;
    let erroresEnFila = 0;

    for (const emp of empleadosData) {
      if (!emp.cedula) continue;

      const parseDate = (dateString: string | null) => dateString ? new Date(dateString) : null;

      const dataFormateada = {
        nombrecompleto: emp.nombrecompleto,
        apellidos: emp.apellidos,
        nombres: emp.nombres,
        codEmpresa: emp.codEmpresa,
        empresa: emp.empresa,
        codPersona: emp.codPersona,
        mailEmpresa: emp.mailEmpresa,
        telefono: emp.telefono,
        mailPersonal: emp.mailPersonal,
        provincia: emp.provincia,
        canton: emp.canton,
        codPosicion: emp.codPosicion,
        posicion: emp.posicion,
        codPerfil: emp.codPerfil,
        codPuesto: emp.codPuesto,
        puesto: emp.puesto,
        codDepartamento: emp.codDepartamento,
        departamento: emp.departamento,
        codPosicionJefe: emp.codPosicionJefe,
        nombresReportaA: emp.nombresReportaA,
        cedulaReportaA: emp.cedulaReportaA,
        reportaA: emp.reportaA,
        codFamilia: emp.codFamilia,
        familiaPuesto: emp.familiaPuesto,
        codSeccion: emp.codSeccion,
        seccion: emp.seccion,
        codArea: emp.codArea,
        area: emp.area,
        codUnidad: emp.codUnidad,
        unidad: emp.unidad,
        fechaAntiguedad: parseDate(emp.fechaAntiguedad),
        fechaIngreso: parseDate(emp.fechaIngreso),
        barrio: emp.barrio,
        callePrincipal: emp.callePrincipal,
        calleSecundaria: emp.calleSecundaria,
        numeroCasa: emp.numeroCasa,
        fechaIniContrato: parseDate(emp.fechaIniContrato),
        fechaFinContrato: parseDate(emp.fechaFinContrato),
        tipoContrato: emp.tipoContrato,
        codNivelDir: emp.codNivelDir,
        nivelDireccion: emp.nivelDireccion,
        codCargoTipo: emp.codCargoTipo,
        cargoTipo: emp.cargoTipo,
        salario: emp.salario ? parseFloat(emp.salario) : null,
        sexo: emp.sexo,
        estado: emp.estado
      };

      // Manejo de errores por registro individual
      try {
        await prisma.empleado.upsert({
          where: { cedula: emp.cedula }, // CRÍTICO: 'cedula' debe ser @unique en schema.prisma
          update: dataFormateada,
          create: {
            cedula: emp.cedula,
            ...dataFormateada
          }
        });
        procesadosConExito++;
      } catch (dbError: any) {
        console.error(`Error al procesar la cédula ${emp.cedula}:`, dbError.message);
        erroresEnFila++;
      }
    }

    return NextResponse.json({
      mensaje: "Sincronización finalizada con éxito",
      estadisticas: {
        totalObtenidos: empleadosData.length,
        procesadosConExito,
        erroresEnFila
      }
    });

  } catch (error: any) {
    console.error("Error crítico en la ruta:", error);
    return NextResponse.json(
      { error: "Falló la sincronización", detalle: error.message },
      { status: 500 }
    );
  }
}