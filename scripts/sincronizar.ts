import axios from "axios";
import https from "https";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Función auxiliar para pausar la ejecución (dormir)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  try {
    console.log("Iniciando conexión DIRECTA a Sedemi (sin ScraperAPI)...");

    const targetUrl = "https://backstack.sedemi.com:7048/api/EvolutionEmployee/EmployeesEvolution";
    
    const response = await axios.post(
      targetUrl,
      { parameter: "", estado: "", codEmpresa: "", codDepartamento: "" },
      {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        headers: { "Content-Type": "application/json" },
        timeout: 60000 
      }
    );

    const empleadosData = response.data?.result;

    if (!empleadosData || empleadosData.length === 0) {
      throw new Error("La API de Sedemi respondió, pero no devolvió registros.");
    }

    console.log(`¡Éxito! Se encontraron ${empleadosData.length} empleados. Guardando en Neon Postgres con reintentos...`);

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

      // SISTEMA DE REINTENTOS PARA EVITAR CAÍDAS DE NEON
      let guardado = false;
      let intentos = 0;
      const maxIntentos = 3;

      while (!guardado && intentos < maxIntentos) {
        try {
          await prisma.empleado.upsert({
            where: { cedula: emp.cedula }, 
            update: dataFormateada,
            create: { cedula: emp.cedula, ...dataFormateada }
          });
          guardado = true;
          procesadosConExito++;
        } catch (dbError: any) {
          intentos++;
          if (intentos >= maxIntentos) {
            console.error(`Error definitivo en cédula ${emp.cedula} tras 3 intentos:`, dbError.message);
            erroresEnFila++;
          } else {
            // Si falla por desconexión, espera 2 segundos y vuelve a intentar
            await sleep(2000); 
          }
        }
      }
    }

    console.log(`✅ Sincronización completada. Procesados: ${procesadosConExito}. Errores: ${erroresEnFila}.`);
    process.exit(0); 

  } catch (error: any) {
    console.error("❌ Error crítico en el script:");
    if (error.response?.data) {
       console.error("Respuesta del servidor:", error.response.data);
    } else {
       console.error(error.message);
    }
    process.exit(1); 
  } finally {
    await prisma.$disconnect();
  }
}

main();