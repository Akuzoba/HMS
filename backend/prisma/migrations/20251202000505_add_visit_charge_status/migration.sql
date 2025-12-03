-- AlterTable
ALTER TABLE "visit_charges" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "visit_charges_status_idx" ON "visit_charges"("status");
