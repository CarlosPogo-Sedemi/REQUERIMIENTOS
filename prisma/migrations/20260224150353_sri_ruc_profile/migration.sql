-- CreateTable
CREATE TABLE "SriRucProfile" (
    "id" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "razonSocial" TEXT,
    "actividadEconomicaPrincipal" TEXT,
    "tipoContribuyente" TEXT,
    "regimen" TEXT,
    "extraJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SriRucProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SriRucProfile_ruc_key" ON "SriRucProfile"("ruc");

-- CreateIndex
CREATE INDEX "SriInvoice_rucEmisor_idx" ON "SriInvoice"("rucEmisor");
