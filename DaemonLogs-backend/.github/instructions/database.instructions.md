---
description: "Use when: criar model Prisma, editar schema, adicionar migration, alterar tabela, criar relação, criar índice, trabalhar em schema.prisma, prisma/migrations, repository."
applyTo: "prisma/**, **/*.prisma, src/modules/**/repository.ts"
---

# Banco de Dados — Regras Prisma + PostgreSQL

## Schema: Modelos e Convenções

### Tipos Críticos

| Dado | Tipo Prisma | Razão |
|------|-------------|-------|
| Discord User ID (ex: `1128502341000253550`) | `String @db.VarChar(20)` | Excede `Int` e `BigInt` do JavaScript — sempre String |
| Discord Guild ID | `String @db.VarChar(20)` | Mesma razão |
| Discord Channel ID | `String @db.VarChar(20)` | Mesma razão |
| Discord Message ID | `String @db.VarChar(20)` | Mesma razão |
| Token selfbot | `String` | Texto puro, **sem hash** |
| Password usuário | `String?` | Hash bcrypt antes de persistir — **nunca plain text**; `null` para usuários Discord OAuth |
| Link de mensagem | `String?` | Formato: `https://discord.com/channels/{guild}/{channel}/{message}` |

### Campos Obrigatórios em Toda Tabela com Dados

```prisma
created_at DateTime @default(now())
updated_at DateTime @updatedAt
```

## Schema de Referência

```prisma
model usuarios {
  id                     Int                    @id @default(autoincrement())
  username               String                 @unique @db.VarChar(50)
  discord_id             String?                @unique @db.VarChar(20)  // Discord User ID — null para usuários locais
  password               String?                                          // bcrypt hash ou null (Discord OAuth users)
  email                  String?                @unique @db.VarChar(255) // null se Discord não retornar email verificado
  is_premium             Boolean                @default(false)     // auxiliar; source of truth = premium_expires_at
  premium_expires_at     DateTime?              // null = freemium; data futura = premium ativo
  last_target_removed_at DateTime?              // timestamp da última remoção de alvo — controla cooldown freemium
  sessions               sessions[]
  contas_monitoramento   contas_monitoramento[]
  contas_alvos           contas_alvos[]
  pagamentos             pagamentos[]
  email_verifications    email_verifications[]
  password_resets        password_resets[]
  my_tokens              my_tokens?             // 1 token pessoal por usuário (nullable)
  clear_chat_usage       clear_chat_usage?      // quota de exclusão de mensagens por período
  created_at             DateTime               @default(now())
  updated_at             DateTime               @updatedAt

  @@map("usuarios")
}

model contas_monitoramento {
  id         Int        @id @default(autoincrement())
  token      String     @db.Text // plain string, SEM hash, SEM crypto — @db.Text evita limite de 255 chars
  is_valid   Boolean    @default(false)
  usuario_id Int
  usuario    usuarios   @relation(fields: [usuario_id], references: [id], onDelete: Cascade)
  servidores servidores[]
  created_at DateTime   @default(now())
  updated_at DateTime   @updatedAt
}

model servidores {
  id                     Int                  @id @default(autoincrement())
  guild_id               String               @db.VarChar(20)           // SEM @unique isolado
  server_name            String               @db.VarChar(200)
  conta_monitoramento_id Int
  conta_monitoramento    contas_monitoramento @relation(fields: [conta_monitoramento_id], references: [id], onDelete: Cascade)
  created_at             DateTime             @default(now())
  updated_at             DateTime             @updatedAt

  @@unique([guild_id, conta_monitoramento_id]) // múltiplas contas monitoram o mesmo servidor sem duplicação por conta
}

model contas_alvos {
  id              Int                     @id @default(autoincrement())
  discord_user_id String                  @db.VarChar(20) // Discord BigInt como String
  username        String                  @db.VarChar(100)
  username_global String?                 @db.VarChar(100)
  usuario_id      Int
  usuario         usuarios                @relation(fields: [usuario_id], references: [id], onDelete: Cascade)
  mensagens       mensagens_salvas[]
  eventos         eventos_monitoramento[]
  created_at      DateTime                @default(now())
  updated_at      DateTime                @updatedAt

  @@unique([discord_user_id, usuario_id]) // mesma conta alvo não pode ser adicionada duas vezes pelo mesmo usuário
}

model mensagens_salvas {
  id             Int          @id @default(autoincrement())
  message_id     String       @unique @db.VarChar(20) // Discord message ID — chave de deduplicação
  conteudo       String       @db.Text
  link_mensagem  String?      @db.Text // https://discord.com/channels/{guild}/{channel}/{message}
  guild_id       String?      @db.VarChar(20)
  guild_name     String?      @db.VarChar(200)
  channel_id     String?      @db.VarChar(20)
  channel_name   String?      @db.VarChar(200)
  conta_alvo_id  Int
  conta_alvo     contas_alvos @relation(fields: [conta_alvo_id], references: [id], onDelete: Cascade)
  created_at     DateTime     @default(now())
}

model eventos_monitoramento {
  id              Int          @id @default(autoincrement())
  tipo            String       @db.VarChar(50) // MESSAGE_CREATE | MESSAGE_EDIT | MESSAGE_DELETE | VOICE_JOIN | VOICE_LEAVE | VOICE_SWITCH | MENTION
  dados           Json         // estrutura varia por tipo — ver selfbot.instructions.md
  idempotency_key String       @unique @db.VarChar(100) // ex: "{message_id}:{tipo}" — evita duplicação entre contas
  conta_alvo_id   Int
  conta_alvo      contas_alvos @relation(fields: [conta_alvo_id], references: [id], onDelete: Cascade)
  created_at      DateTime     @default(now())

  @@index([conta_alvo_id, tipo])
}

model sessions {
  id         Int      @id @default(autoincrement())
  usuario_id Int
  usuario    usuarios @relation(fields: [usuario_id], references: [id], onDelete: Cascade)
  ip         String   @db.VarChar(45) // suporta IPv6
  jwt_token  String   @unique @db.Text // @db.Text evita limite de 255 chars para JWTs longos
  expires_at DateTime
  created_at DateTime @default(now())

  @@index([usuario_id])
}

model pagamentos {
  id                 Int      @id @default(autoincrement())
  correlation_id     String   @unique @db.VarChar(100)  // UUID gerado no backend — chave de idempotência
  usuario_id         Int
  usuario            usuarios @relation(fields: [usuario_id], references: [id], onDelete: Cascade)
  valor_centavos     Int                                // em centavos — nunca em reais
  status             String   @db.VarChar(20)           // ACTIVE | COMPLETED | EXPIRED | CANCELLED
  premium_expires_at DateTime?                          // preenchido ao confirmar o pagamento
  woovi_charge_id    String?  @db.VarChar(200)          // paymentLinkID retornado pela Woovi
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt

  @@map("pagamentos")
}

model email_verifications {
  id         Int      @id @default(autoincrement())
  usuario_id Int
  usuario    usuarios @relation(fields: [usuario_id], references: [id], onDelete: Cascade)
  code       String   @unique @db.VarChar(64)  // hex de 64 chars — gerado via crypto.randomBytes(32).toString('hex')
  expires_at DateTime
  used       Boolean  @default(false)
  created_at DateTime @default(now())           // sem updated_at — registro imutável após criação

  @@map("email_verifications")
}

model password_resets {
  id         Int      @id @default(autoincrement())
  usuario_id Int
  usuario    usuarios @relation(fields: [usuario_id], references: [id], onDelete: Cascade)
  code       String   @unique @db.VarChar(6)   // 6 dígitos numéricos — gerado via crypto.randomInt(100000, 1000000)
  expires_at DateTime
  used       Boolean  @default(false)
  created_at DateTime @default(now())           // sem updated_at — registro imutável após criação

  @@map("password_resets")
}

model my_tokens {
  id         Int      @id @default(autoincrement())
  token      String   @db.Text                    // plain string — SEM hash, SEM criptografia
  is_valid   Boolean  @default(false)
  usuario_id Int      @unique                     // constraint: 1 token por usuário
  usuario    usuarios @relation(fields: [usuario_id], references: [id], onDelete: Cascade)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt                  // source of truth para cálculo de cooldown

  @@map("my_tokens")
}

model clear_chat_usage {
  id               Int      @id @default(autoincrement())
  usuario_id       Int      @unique           // 1 registro por usuário
  usuario          usuarios @relation(fields: [usuario_id], references: [id], onDelete: Cascade)
  messages_deleted Int      @default(0)       // contador acumulado no período atual
  period_start_at  DateTime @default(now())   // início do período (resetado quando expira)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  @@map("clear_chat_usage")
}
```

> Adicionar `my_tokens my_tokens?` e `clear_chat_usage clear_chat_usage?` na relação do model `usuarios` em schema.prisma.

## Regras de Migration

- **Sempre** usar `npx prisma migrate dev --name <descricao_clara>` — nunca `prisma db push` (não gera migration)
- Em produção: `npx prisma migrate deploy`
- Nunca editar arquivos dentro de `prisma/migrations/` já aplicados
- Antes de criar migration: rodar `npx prisma validate` para checar o schema

## Acesso ao Banco — Repository Pattern

```typescript
// ✅ CORRETO — acesso ao banco APENAS no repository
// src/modules/messages/repository.ts
import { prisma } from '@/plugins/prisma'

export async function findMessageById(messageId: string) {
  return prisma.mensagens_salvas.findUnique({ where: { message_id: messageId } })
}

// ❌ ERRADO — nunca importar prisma em service ou controller
import { prisma } from '@/plugins/prisma' // em service.ts → PROIBIDO
```

## O que a IA NUNCA deve fazer

- Armazenar Discord IDs como `Int` ou `BigInt` no schema Prisma
- Hashear tokens de contas de monitoramento
- Usar `prisma db push` em vez de `prisma migrate dev`
- Importar `prisma` fora de arquivos `repository.ts`
- Editar arquivos de migration já aplicados
- Omitir `created_at`/`updated_at` em novos models
- Omitir `@unique` no `idempotency_key` de eventos (causa duplicações)
