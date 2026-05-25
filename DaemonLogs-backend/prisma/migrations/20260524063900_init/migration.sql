-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_monitoramento" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "is_valid" BOOLEAN NOT NULL DEFAULT false,
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_monitoramento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servidores" (
    "id" SERIAL NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "server_name" VARCHAR(200) NOT NULL,
    "conta_monitoramento_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servidores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_alvos" (
    "id" SERIAL NOT NULL,
    "discord_user_id" VARCHAR(20) NOT NULL,
    "username" VARCHAR(200) NOT NULL,
    "username_global" VARCHAR(200),
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_alvos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens_salvas" (
    "id" SERIAL NOT NULL,
    "message_id" VARCHAR(20) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "link_mensagem" TEXT,
    "guild_id" VARCHAR(20),
    "guild_name" VARCHAR(200),
    "channel_id" VARCHAR(20),
    "channel_name" VARCHAR(200),
    "conta_alvo_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_salvas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_monitoramento" (
    "id" SERIAL NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "dados" JSONB NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "conta_alvo_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_monitoramento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "jwt_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "servidores_guild_id_conta_monitoramento_id_key" ON "servidores"("guild_id", "conta_monitoramento_id");

-- CreateIndex
CREATE UNIQUE INDEX "contas_alvos_discord_user_id_usuario_id_key" ON "contas_alvos"("discord_user_id", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "mensagens_salvas_message_id_key" ON "mensagens_salvas"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_monitoramento_idempotency_key_key" ON "eventos_monitoramento"("idempotency_key");

-- CreateIndex
CREATE INDEX "eventos_monitoramento_conta_alvo_id_tipo_idx" ON "eventos_monitoramento"("conta_alvo_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_jwt_token_key" ON "sessions"("jwt_token");

-- CreateIndex
CREATE INDEX "sessions_usuario_id_idx" ON "sessions"("usuario_id");

-- AddForeignKey
ALTER TABLE "contas_monitoramento" ADD CONSTRAINT "contas_monitoramento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servidores" ADD CONSTRAINT "servidores_conta_monitoramento_id_fkey" FOREIGN KEY ("conta_monitoramento_id") REFERENCES "contas_monitoramento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_alvos" ADD CONSTRAINT "contas_alvos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_salvas" ADD CONSTRAINT "mensagens_salvas_conta_alvo_id_fkey" FOREIGN KEY ("conta_alvo_id") REFERENCES "contas_alvos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_monitoramento" ADD CONSTRAINT "eventos_monitoramento_conta_alvo_id_fkey" FOREIGN KEY ("conta_alvo_id") REFERENCES "contas_alvos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
