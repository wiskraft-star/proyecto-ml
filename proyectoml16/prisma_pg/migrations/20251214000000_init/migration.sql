-- Initial migration (PostgreSQL)
-- Requires pgcrypto for gen_random_uuid(). On Vercel Postgres/Neon it is typically available; if not, enable:
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "Sale" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "economicId" text NOT NULL,
  "orderId" text,
  "packId" text,
  "date" timestamptz NOT NULL,
  "status" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL
);

CREATE UNIQUE INDEX "Sale_economicId_key" ON "Sale"("economicId");
CREATE INDEX "Sale_orderId_idx" ON "Sale"("orderId");
CREATE INDEX "Sale_packId_idx" ON "Sale"("packId");

CREATE TABLE "SaleItem" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "saleId" uuid NOT NULL,
  "sku" text NOT NULL,
  "title" text,
  "qty" integer NOT NULL,
  CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE
);

CREATE INDEX "SaleItem_sku_idx" ON "SaleItem"("sku");
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

CREATE TABLE "Payment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "economicId" text,
  "orderId" text,
  "packId" text,
  "mpPaymentId" text UNIQUE,
  "netAmount" numeric(18,4) NOT NULL,
  "grossAmount" numeric(18,4),
  "feesAmount" numeric(18,4),
  "paidAt" timestamptz,
  "sourceRaw" jsonb NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL
);

CREATE INDEX "Payment_economicId_idx" ON "Payment"("economicId");

CREATE TABLE "SkuCost" (
  "sku" text PRIMARY KEY,
  "unitCost" numeric(18,4) NOT NULL,
  "updatedAt" timestamptz NOT NULL
);

CREATE TABLE "Supply" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL UNIQUE,
  "unitCost" numeric(18,4) NOT NULL,
  "updatedAt" timestamptz NOT NULL
);

CREATE TABLE "SupplyRecipeLine" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplyId" uuid NOT NULL UNIQUE,
  "qtyPerSale" numeric(18,6) NOT NULL,
  "updatedAt" timestamptz NOT NULL,
  CONSTRAINT "SupplyRecipeLine_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply"("id") ON DELETE CASCADE
);

CREATE TABLE "AppSetting" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "mlSellerId" text,
  "mlSiteId" text NOT NULL DEFAULT 'MLA',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL
);
