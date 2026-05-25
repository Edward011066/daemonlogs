-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "is_premium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_target_removed_at" TIMESTAMP(3),
ADD COLUMN     "premium_expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" SERIAL NOT NULL,
    "correlation_id" VARCHAR(100) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "premium_expires_at" TIMESTAMP(3),
    "woovi_charge_id" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_correlation_id_key" ON "pagamentos"("correlation_id");

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
