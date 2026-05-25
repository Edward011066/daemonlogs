-- AlterTable
ALTER TABLE "pagamentos" ADD COLUMN "brcode" TEXT;
ALTER TABLE "pagamentos" ADD COLUMN "qrcode_image" TEXT;
ALTER TABLE "pagamentos" ADD COLUMN "charge_expires_at" TIMESTAMP(3);
