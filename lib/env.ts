export const env = {
  clientId: process.env.NEXT_PUBLIC_AAD_CLIENT_ID || "",
  tenantId: process.env.NEXT_PUBLIC_AAD_TENANT_ID || "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};
