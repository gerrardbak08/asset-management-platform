-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "use" TEXT NOT NULL,
    "areaSqm" DOUBLE PRECISION NOT NULL,
    "areaPyeong" DOUBLE PRECISION NOT NULL,
    "floors" TEXT NOT NULL,
    "approvalDate" TIMESTAMP(3),
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "acquisitionPrice" BIGINT NOT NULL,
    "rentalArea" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rentalRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vacancy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tenant" TEXT NOT NULL DEFAULT '-',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT,
    "detailPhotoUrl" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentItem" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentSnapshot" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,
    "purchaseAmount" BIGINT NOT NULL DEFAULT 0,
    "transferAmount" BIGINT NOT NULL DEFAULT 0,
    "disposalAmount" BIGINT NOT NULL DEFAULT 0,
    "inventoryAmount" BIGINT NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siteType" TEXT,
    "period" TEXT NOT NULL,
    "assetValue" BIGINT NOT NULL,
    "assetCount" INTEGER NOT NULL,
    "supplyValue" BIGINT NOT NULL,
    "assetByTypeJson" TEXT NOT NULL,
    "supplyByCategoryJson" TEXT NOT NULL,
    "supplyByCategoryCountJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlySnapshot" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingMemo" (
    "buildingId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingMemo_pkey" PRIMARY KEY ("buildingId")
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

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentSnapshot" ADD CONSTRAINT "EquipmentSnapshot_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "EquipmentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentSnapshot" ADD CONSTRAINT "EquipmentSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingMemo" ADD CONSTRAINT "BuildingMemo_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingMemo" ADD CONSTRAINT "BuildingMemo_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
