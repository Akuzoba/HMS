-- CreateTable
CREATE TABLE "hospital_services" (
    "id" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_charges" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "chargedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chargedById" TEXT,

    CONSTRAINT "visit_charges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospital_services_serviceCode_key" ON "hospital_services"("serviceCode");

-- CreateIndex
CREATE INDEX "hospital_services_category_idx" ON "hospital_services"("category");

-- CreateIndex
CREATE INDEX "hospital_services_serviceCode_idx" ON "hospital_services"("serviceCode");

-- CreateIndex
CREATE INDEX "visit_charges_visitId_idx" ON "visit_charges"("visitId");

-- CreateIndex
CREATE INDEX "visit_charges_serviceId_idx" ON "visit_charges"("serviceId");

-- AddForeignKey
ALTER TABLE "visit_charges" ADD CONSTRAINT "visit_charges_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_charges" ADD CONSTRAINT "visit_charges_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "hospital_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
