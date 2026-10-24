-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('MANUAL', 'DEPOSIT', 'PROGRESS', 'FINAL');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'VOID');

-- CreateTable
CREATE TABLE "document_sequences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "documentType" VARCHAR(40) NOT NULL,
    "fiscalPeriod" VARCHAR(20) NOT NULL,
    "prefix" VARCHAR(12) NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "document_sequences_nextNumber_check" CHECK ("nextNumber" > 0)
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "invoiceNumber" VARCHAR(60),
    "type" "InvoiceType" NOT NULL DEFAULT 'MANUAL',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "customerName" VARCHAR(180) NOT NULL,
    "customerPhone" VARCHAR(40),
    "customerEmail" VARCHAR(320),
    "billingAddress" TEXT,
    "eventType" VARCHAR(120),
    "eventDate" DATE,
    "venue" VARCHAR(240),
    "guestCount" INTEGER,
    "menuPackage" VARCHAR(160),
    "currency" CHAR(3) NOT NULL DEFAULT 'PKR',
    "issueDate" DATE,
    "dueDate" DATE,
    "serviceChargeRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "serviceChargeAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "issuedAt" TIMESTAMPTZ(6),
    "createdById" UUID NOT NULL,
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoices_guestCount_check" CHECK ("guestCount" IS NULL OR "guestCount" >= 0),
    CONSTRAINT "invoices_serviceChargeRate_check" CHECK ("serviceChargeRate" >= 0 AND "serviceChargeRate" <= 100),
    CONSTRAINT "invoices_taxRate_check" CHECK ("taxRate" >= 0 AND "taxRate" <= 100),
    CONSTRAINT "invoices_amounts_check" CHECK (
        "serviceChargeAmount" >= 0 AND
        "taxAmount" >= 0 AND
        "subtotalAmount" >= 0 AND
        "totalAmount" >= 0 AND
        "paidAmount" >= 0 AND
        "balanceAmount" >= 0
    ),
    CONSTRAINT "invoices_version_check" CHECK ("version" > 0),
    CONSTRAINT "invoices_dates_check" CHECK ("dueDate" IS NULL OR "issueDate" IS NULL OR "dueDate" >= "issueDate")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "category" VARCHAR(120),
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" VARCHAR(40),
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "lineTotal" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoice_line_items_lineNumber_check" CHECK ("lineNumber" > 0),
    CONSTRAINT "invoice_line_items_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "invoice_line_items_unitPrice_check" CHECK ("unitPrice" >= 0),
    CONSTRAINT "invoice_line_items_lineTotal_check" CHECK ("lineTotal" >= 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "document_sequences_businessId_documentType_fiscalPeriod_key" ON "document_sequences"("businessId", "documentType", "fiscalPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_businessId_invoiceNumber_key" ON "invoices"("businessId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_businessId_id_key" ON "invoices"("businessId", "id");

-- CreateIndex
CREATE INDEX "invoices_businessId_status_createdAt_idx" ON "invoices"("businessId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "invoices_businessId_customerName_createdAt_idx" ON "invoices"("businessId", "customerName", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "invoices_businessId_dueDate_status_idx" ON "invoices"("businessId", "dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_line_items_invoiceId_lineNumber_key" ON "invoice_line_items"("invoiceId", "lineNumber");

-- CreateIndex
CREATE INDEX "invoice_line_items_businessId_invoiceId_idx" ON "invoice_line_items"("businessId", "invoiceId");

-- AddForeignKey
ALTER TABLE "document_sequences" ADD CONSTRAINT "document_sequences_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_businessId_invoiceId_fkey" FOREIGN KEY ("businessId", "invoiceId") REFERENCES "invoices"("businessId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
