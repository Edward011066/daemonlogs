-- Adiciona colunas novas com suporte a linhas existentes

-- 1. Adicionar colunas que têm DEFAULT (sem problemas)
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "is_admin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "is_activated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "referral_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "referred_by_id" INTEGER;

-- 2. Adicionar colunas obrigatórias como nullable primeiro
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "email" VARCHAR(255);
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "referral_code" VARCHAR(20);

-- 3. Preencher linhas existentes com valores placeholder
UPDATE "usuarios"
SET "email" = 'user_' || id::text || '@migrated.local'
WHERE "email" IS NULL;

UPDATE "usuarios"
SET "referral_code" = left(upper(md5(now()::text || id::text || random()::text)), 8)
WHERE "referral_code" IS NULL;

-- 4. Adicionar NOT NULL e UNIQUE após os dados estarem preenchidos
ALTER TABLE "usuarios" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "usuarios" ALTER COLUMN "referral_code" SET NOT NULL;

ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_email_key" UNIQUE ("email");
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_referral_code_key" UNIQUE ("referral_code");

-- 5. Foreign key self-referencial (indicações)
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_referred_by_id_fkey"
  FOREIGN KEY ("referred_by_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Criar tabela email_verifications
CREATE TABLE "email_verifications" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- 7. Índices
CREATE UNIQUE INDEX "email_verifications_code_key" ON "email_verifications"("code");

-- 8. Foreign key email_verifications → usuarios
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
