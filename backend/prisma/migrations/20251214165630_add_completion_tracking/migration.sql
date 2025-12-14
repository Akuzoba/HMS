-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "vitalsCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consultationCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prescriptionCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "labOrderCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "visits_vitalsCompleted_idx" ON "visits"("vitalsCompleted");

-- CreateIndex
CREATE INDEX "visits_consultationCompleted_idx" ON "visits"("consultationCompleted");
