import axios from 'axios'; // <--- ESTO QUITA EL ERROR DE 'axios'

/**
 * Esta función DEBE estar aquí para que buscarEmpresaGeneral pueda usarla.
 * Quita el error: Cannot find name 'getAccessToken'
 */
async function getAccessToken() {
  try {
    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token'
      }
    });
    return response.data.access_token;
  } catch (error: any) {
    console.error('Error obteniendo token:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Busca una sola empresa por RUC (Account_Number)
 */
export async function buscarEmpresaGeneral(valor: string) {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await axios.get(`${process.env.ZOHO_API_DOMAIN}/crm/v3/Accounts/search`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
      params: {
        criteria: `(Account_Number:equals:${valor})`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error en búsqueda:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Trae TODAS las cuentas (Sin filtros)
 */
export async function listarTodasLasCuentas() {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await axios.get(`${process.env.ZOHO_API_DOMAIN}/crm/v3/Accounts`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
      params: {
        // Añadimos más campos aquí (Industry, Annual_Revenue, Phone, Website, etc.)
        fields: 'Account_Name,Account_Number,Rating,id,Industry,Annual_Revenue,Phone,Website,Created_Time', 
        per_page: 200,
        page: 2
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error listando cuentas:', error.response?.data || error.message);
    return null;
  }
}

export async function verTodosLosModulos() {
  const token = await getAccessToken();
  if (!token) return [];

  const response = await axios.get(`${process.env.ZOHO_API_DOMAIN}/crm/v3/settings/modules`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` }
  });

  return response.data.modules.map((m: any) => ({
    nombre_en_web: m.display_label, // <--- Esto es lo que te falta
    nombre_api: m.api_name,
    es_personalizado: m.custom
  }));
}


export async function obtenerCamposModulo(modulo: string) {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await axios.get(`${process.env.ZOHO_API_DOMAIN}/crm/v3/settings/fields`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
      params: { module: modulo }
    });

    // Retornamos la etiqueta amigable y el nombre técnico
    return response.data.fields.map((f: any) => ({
      etiqueta_visible: f.field_label,
      nombre_para_api: f.api_name,
      tipo_dato: f.data_type
    }));
  } catch (error: any) {
    console.error(`Error obteniendo campos de ${modulo}:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * Consulta oportunidades adjudicadas y perdidas mediante API Key
 */
export async function consultarOportunidadesZCRM(fechaInicio: string, fechaFin: string) {
  const url = "https://www.zohoapis.com/crm/v7/functions/consultaoportunidadesadjudicadas/actions/execute";
  
  try {
    const response = await axios.post(url, null, {
      params: {
        auth_type: "apikey",
        zapikey: "1003.8e781393b284d5bfa4d8c0a2c00bae05.d18b3287f12b202b07c468aaa87f51a5",
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      }
    });

    if (response.data.code === "success") {
      // DOBLE PARSEO: El campo output viene como string JSON
      const dataInterna = JSON.parse(response.data.details.output);
      return dataInterna.Deals || [];
    }
    return [];
  } catch (error: any) {
    console.error('Error consultando oportunidades Zoho:', error.message);
    return [];
  }
}