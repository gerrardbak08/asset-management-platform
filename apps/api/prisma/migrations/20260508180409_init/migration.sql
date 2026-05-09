-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "use" TEXT NOT NULL,
    "areaSqm" REAL NOT NULL,
    "areaPyeong" REAL NOT NULL,
    "floors" TEXT NOT NULL,
    "approvalDate" DATETIME,
    "acquisitionDate" DATETIME NOT NULL,
    "acquisitionPrice" BIGINT NOT NULL,
    "rentalArea" REAL NOT NULL DEFAULT 0,
    "rentalRate" REAL NOT NULL DEFAULT 0,
    "vacancy" REAL NOT NULL DEFAULT 0,
    "tenant" TEXT NOT NULL DEFAULT '-',
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "photoUrl" TEXT,
    "detailPhotoUrl" TEXT,
    "updatedById" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Building_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EquipmentSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,
    "purchaseAmount" BIGINT NOT NULL DEFAULT 0,
    "transferAmount" BIGINT NOT NULL DEFAULT 0,
    "disposalAmount" BIGINT NOT NULL DEFAULT 0,
    "inventoryAmount" BIGINT NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquipmentSnapshot_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "EquipmentItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EquipmentSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "siteType" TEXT,
    "period" TEXT NOT NULL,
    "assetValue" BIGINT NOT NULL,
    "assetCount" INTEGER NOT NULL,
    "supplyValue" BIGINT NOT NULL,
    "assetByTypeJson" TEXT NOT NULL,
    "supplyByCategoryJson" TEXT NOT NULL,
    "supplyByCategoryCountJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MonthlySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "totalAsset" BIGINT NOT NULL,
    "tangible" BIGINT NOT NULL,
    "intangible" BIGINT NOT NULL,
    "equipment" BIGINT NOT NULL,
    "hq" BIGINT NOT NULL,
    "store" BIGINT NOT NULL,
    "logistics" BIGINT NOT NULL,
    "kpiJson" TEXT NOT NULL,
    "rawJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BuildingMemo" (
    "buildingId" TEXT NOT NULL PRIMARY KEY,
    "body" TEXT NOT NULL,
    "updatedById" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuildingMemo_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuildingMemo_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Building_legacyId_key" ON "Building"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentItem_legacyId_key" ON "EquipmentItem"("legacyId");

-- CreateIndex
CREATE INDEX "EquipmentSnapshot_period_idx" ON "EquipmentSnapshot"("period");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentSnapshot_equipmentId_period_locationType_key" ON "EquipmentSnapshot"("equipmentId", "period", "locationType");

-- CreateIndex
CREATE INDEX "Store_period_idx" ON "Store"("period");

-- CreateIndex
CREATE INDEX "Store_name_idx" ON "Store"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Store_name_period_key" ON "Store"("name", "period");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySnapshot_period_key" ON "MonthlySnapshot"("period");
