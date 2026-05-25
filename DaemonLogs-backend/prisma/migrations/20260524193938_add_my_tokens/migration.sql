-- CreateTable
CREATE TABLE "my_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "is_valid" BOOLEAN NOT NULL DEFAULT false,
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "my_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "my_tokens_usuario_id_key" ON "my_tokens"("usuario_id");

-- AddForeignKey
ALTER TABLE "my_tokens" ADD CONSTRAINT "my_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
