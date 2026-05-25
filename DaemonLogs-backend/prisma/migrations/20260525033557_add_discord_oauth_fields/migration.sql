/*
  Warnings:

  - A unique constraint covering the columns `[discord_id]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "discord_id" VARCHAR(20),
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_discord_id_key" ON "usuarios"("discord_id");
