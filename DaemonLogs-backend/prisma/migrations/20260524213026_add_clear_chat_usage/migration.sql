-- CreateTable
CREATE TABLE "clear_chat_usage" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "messages_deleted" INTEGER NOT NULL DEFAULT 0,
    "period_start_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clear_chat_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clear_chat_usage_usuario_id_key" ON "clear_chat_usage"("usuario_id");

-- AddForeignKey
ALTER TABLE "clear_chat_usage" ADD CONSTRAINT "clear_chat_usage_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
