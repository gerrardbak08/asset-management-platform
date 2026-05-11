-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('active', 'expired', 'terminated', 'pending');

-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('regular_inspection', 'emergency_repair', 'facility_upgrade', 'safety_diagnosis');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('open', 'in_progress', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('low', 'normal', 'high', 'critical');

-- CreateEnum
CREATE TYPE "LedgerTxType" AS ENUM ('purchase', 'transfer', 'disposal', 'adjustment');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('hq', 'store', 'logistics');

-- CreateEnum
CREATE TYPE "DepAssetType" AS ENUM ('building', 'equipment');

-- CreateEnum
CREATE TYPE "DepMethod" AS ENUM ('straight_line', 'declining_balance');

-- CreateTable
CREATE TABLE "LeaseContract" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "tenantContact" TEXT,
    "contractStart" TIMESTAMP(3) NOT NULL,
    "contractEnd" TIMESTAMP(3) NOT NULL,
    "rentArea" DOUBLE PRECISION NOT NULL,
    "monthlyRent" BIGINT NOT NULL,
    "deposit" BIGINT NOT NULL,
    "renewalOption" BOOLEAN NOT NULL DEFAULT false,
    "renewedFromId" TEXT,
    "status" "LeaseStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "category" "MaintenanceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'open',
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'normal',
    "assigneeId" TEXT,
    "vendorName" TEXT,
    "startedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "cost" BIGINT,
    "attachmentUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentLedger" (
    "id" TEXT NOT NULL,
    "equipmentItemId" TEXT NOT NULL,
    "legacyAssetNo" TEXT,
    "txType" "LedgerTxType" NOT NULL,
    "txDate" TIMESTAMP(3) NOT NULL,
    "fromLocation" "LocationType",
    "toLocation" "LocationType",
    "storeId" TEXT,
    "amount" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT,
    "documentUrl" TEXT,
    "period" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepreciationSchedule" (
    "id" TEXT NOT NULL,
    "assetType" "DepAssetType" NOT NULL,
    "buildingId" TEXT,
    "equipmentItemId" TEXT,
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "acquisitionPrice" BIGINT NOT NULL,
    "usefulLifeYears" INTEGER NOT NULL,
    "method" "DepMethod" NOT NULL DEFAULT 'straight_line',
    "salvageRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "DepreciationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepEntry" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "expense" BIGINT NOT NULL,
    "accumulated" BIGINT NOT NULL,
    "bookValue" BIGINT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaseContract_buildingId_status_idx" ON "LeaseContract"("buildingId", "status");

-- CreateIndex
CREATE INDEX "LeaseContract_contractEnd_idx" ON "LeaseContract"("contractEnd");

-- CreateIndex
CREATE INDEX "MaintenanceLog_buildingId_status_startedAt_idx" ON "MaintenanceLog"("buildingId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "MaintenanceLog_category_idx" ON "MaintenanceLog"("category");

-- CreateIndex
CREATE INDEX "EquipmentLedger_equipmentItemId_txDate_idx" ON "EquipmentLedger"("equipmentItemId", "txDate");

-- CreateIndex
CREATE INDEX "EquipmentLedger_period_txType_idx" ON "EquipmentLedger"("period", "txType");

-- CreateIndex
CREATE INDEX "EquipmentLedger_storeId_period_idx" ON "EquipmentLedger"("storeId", "period");

-- CreateIndex
CREATE INDEX "DepreciationSchedule_assetType_buildingId_idx" ON "DepreciationSchedule"("assetType", "buildingId");

-- CreateIndex
CREATE INDEX "DepreciationSchedule_assetType_equipmentItemId_idx" ON "DepreciationSchedule"("assetType", "equipmentItemId");

-- CreateIndex
CREATE INDEX "DepEntry_period_idx" ON "DepEntry"("period");

-- CreateIndex
CREATE UNIQUE INDEX "DepEntry_scheduleId_period_key" ON "DepEntry"("scheduleId", "period");

-- AddForeignKey
ALTER TABLE "LeaseContract" ADD CONSTRAINT "LeaseContract_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseContract" ADD CONSTRAINT "LeaseContract_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentLedger" ADD CONSTRAINT "EquipmentLedger_equipmentItemId_fkey" FOREIGN KEY ("equipmentItemId") REFERENCES "EquipmentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentLedger" ADD CONSTRAINT "EquipmentLedger_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepreciationSchedule" ADD CONSTRAINT "DepreciationSchedule_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepreciationSchedule" ADD CONSTRAINT "DepreciationSchedule_equipmentItemId_fkey" FOREIGN KEY ("equipmentItemId") REFERENCES "EquipmentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepEntry" ADD CONSTRAINT "DepEntry_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "DepreciationSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
