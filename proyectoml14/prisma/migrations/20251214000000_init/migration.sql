-- Initial migration (SQLite)
PRAGMA foreign_keys=OFF;

CREATE TABLE "Sale" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "economicId" TEXT NOT NULL,
  "orderId" TEXT,
  "packId" TEXT,
  "date" DATETIME NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Sale_economicId_key" ON "Sale"("economicId");
CREATE INDEX "Sale_orderId_idx" ON "Sale"("orderId");
CREATE INDEX "Sale_packId_idx" ON "Sale"("packId");

CREATE TABLE "SaleItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "saleId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "title" TEXT,
  "qty" INTEGER NOT NULL,
  CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SaleItem_sku_idx" ON "SaleItem"("sku");
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "economicId" TEXT,
  "orderId" TEXT,
  "packId" TEXT,
  "mpPaymentId" TEXT,
  "netAmount" DECIMAL NOT NULL,
  "grossAmount" DECIMAL,
  "feesAmount" DECIMAL,
  "paidAt" DATETIME,
  "sourceRaw" JSON NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Payment_mpPaymentId_key" ON "Payment"("mpPaymentId");
CREATE INDEX "Payment_economicId_idx" ON "Payment"("economicId");

CREATE TABLE "SkuCost" (
  "sku" TEXT NOT NULL PRIMARY KEY,
  "unitCost" DECIMAL NOT NULL,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Supply" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "unitCost" DECIMAL NOT NULL,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Supply_name_key" ON "Supply"("name");

CREATE TABLE "SupplyRecipeLine" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "supplyId" TEXT NOT NULL,
  "qtyPerSale" DECIMAL NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupplyRecipeLine_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SupplyRecipeLine_supplyId_key" ON "SupplyRecipeLine"("supplyId");

CREATE TABLE "AppSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "mlSellerId" TEXT,
  "mlSiteId" TEXT NOT NULL DEFAULT 'MLA',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

PRAGMA foreign_keys=ON;
