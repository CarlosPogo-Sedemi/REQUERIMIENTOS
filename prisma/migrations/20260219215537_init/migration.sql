-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COLABORADOR', 'ADMIN', 'GESTOR_TTHH', 'INVITADO_POSTULANTE');

-- CreateEnum
CREATE TYPE "SriFileKind" AS ENUM ('TXT', 'XML', 'PDF');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "aadObjectId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COLABORADOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "upn" TEXT NOT NULL,
    "mail" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cedulaHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE_DOCS',
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "folderUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLinkToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestSession" (
    "id" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SriInvoice" (
    "id" TEXT NOT NULL,
    "claveAcceso" TEXT NOT NULL,
    "rucEmisor" TEXT NOT NULL,
    "razonSocialEmisor" TEXT NOT NULL,
    "tipoComprobante" TEXT NOT NULL,
    "serieComprobante" TEXT NOT NULL,
    "fechaAutorizacion" TIMESTAMP(3),
    "fechaEmision" TIMESTAMP(3),
    "identificacionReceptor" TEXT,
    "valorSinImpuestos" DECIMAL(14,2) NOT NULL,
    "iva" DECIMAL(14,2) NOT NULL,
    "importeTotal" DECIMAL(14,2) NOT NULL,
    "numeroDocumentoModificado" TEXT,
    "sourceTxtName" TEXT,
    "rawRow" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SriInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SriInvoiceFile" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "kind" "SriFileKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "sha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SriInvoiceFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_aadObjectId_key" ON "User"("aadObjectId");

-- CreateIndex
CREATE UNIQUE INDEX "User_upn_key" ON "User"("upn");

-- CreateIndex
CREATE UNIQUE INDEX "Case_guestId_key" ON "Case"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLinkToken_tokenHash_key" ON "MagicLinkToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "GuestSession_sessionHash_key" ON "GuestSession"("sessionHash");

-- CreateIndex
CREATE UNIQUE INDEX "SriInvoice_claveAcceso_key" ON "SriInvoice"("claveAcceso");

-- CreateIndex
CREATE INDEX "SriInvoiceFile_invoiceId_idx" ON "SriInvoiceFile"("invoiceId");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLinkToken" ADD CONSTRAINT "MagicLinkToken_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLinkToken" ADD CONSTRAINT "MagicLinkToken_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestSession" ADD CONSTRAINT "GuestSession_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestSession" ADD CONSTRAINT "GuestSession_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SriInvoiceFile" ADD CONSTRAINT "SriInvoiceFile_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SriInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
