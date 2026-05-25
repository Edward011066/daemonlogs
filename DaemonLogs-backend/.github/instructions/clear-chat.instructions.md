---
description: "Use when: criar endpoint clear-chat, excluir mensagens Discord em massa, limpar canal, limpar servidor, limpar DMs, cancelar exclusão, POST /clear-chat/channel, POST /clear-chat/server, POST /clear-chat/dms, POST /clear-chat/cancel, AdaptiveDelay, deleteMessagesInChannel, quota freemium exclusão, clear_chat_usage, DELETION_LIMIT_REACHED, trabalhar em src/modules/clear-chat."
applyTo: "src/modules/clear-chat/**"
---

# Módulo clear-chat — Exclusão em Massa de Mensagens

> Documentação do discord.js-selfbot-v13: https://www.npmjs.com/package/discord.js-selfbot-v13

## Conceito

Endpoints `/clear-chat/**` usam o **token pessoal** do usuário (`my_tokens`, `is_valid = true`) para excluir mensagens do Discord via selfbot. Diferente do `/tools`, o clear-chat **tem `repository.ts`** para rastrear a quota freemium de exclusões.

## Endpoints

| Método | Path | Rate Limit | Descrição |
|--------|------|------------|-----------|
| POST | `/clear-chat/cancel` | 20/hora | Cancela o processo em andamento |
| POST | `/clear-chat/channel` | 5/hora | Exclui mensagens em um canal específico |
| POST | `/clear-chat/server` | 3/hora | Exclui em todos os canais de texto de um servidor |
| POST | `/clear-chat/dms` | 3/hora | Exclui em todos os DMs abertos |

## Estrutura de Arquivos

```
src/modules/clear-chat/
├── routes.ts       # rotas com schema JSON Schema (handler: dentro das opções, não 3º argumento)
├── controller.ts   # extrai dados do request, chama service
├── service.ts      # lógica de negócio — chama repository e selfbot/functions
└── repository.ts   # acesso ao Prisma para clear_chat_usage

src/selfbot/functions/
├── delete-messages.ts   # AdaptiveDelay + deleteMessagesInChannel — NUNCA reimplementar inline
├── user-client.ts       # createUserClient / destroyUserClient
└── process-tracker.ts   # startProcess / cancelProcess / clearProcess
```

## Regras de Negócio Críticas

1. **Pré-condição**: usuário DEVE ter `my_token` com `is_valid = true` (403 `NO_VALID_TOKEN` se ausente)
2. **Processo único**: apenas 1 processo de exclusão por usuário — `startProcess` lança 409 se já há um ativo
3. **Quota freemium**: freemium pode excluir até `PLAN_RULES.clear_chat.freemium_max_deletions` mensagens por período de `freemium_cooldown_hours` horas. Premium e admin: sem limite.
4. **Delay adaptativo**: usar `AdaptiveDelay` de `delete-messages.ts` — NUNCA definir delay fixo ou reimplementar inline
5. **Destruir cliente**: o cliente selfbot criado via `createUserClient` DEVE ser destruído no bloco `finally`

## AdaptiveDelay — Padrão Obrigatório

```typescript
// ✅ CORRETO — importar de selfbot/functions
import { AdaptiveDelay, deleteMessagesInChannel } from '../../selfbot/functions/delete-messages.js'

// Aumenta delay monotonicamente após rate limit; decai com half-life de 30s de volta à base
const delay = new AdaptiveDelay(PLAN_RULES.clear_chat.base_delete_delay_ms)
// delay.bump(retryAfterMs) — chamado internamente por deleteMessagesInChannel
// delay.get()              — retorna delay atual com decaimento aplicado

// ❌ PROIBIDO — nunca definir AdaptiveDelay ou deleteMessagesInChannel em service.ts
class AdaptiveDelay { ... }  // ERRADO — já existe em selfbot/functions/delete-messages.ts
```

## assertPlanPermission — Verificação de Quota

```typescript
// src/modules/clear-chat/service.ts
interface PlanAccess {
  isPremium: boolean
  isAdmin: boolean
  remainingQuota: number | null // null = ilimitado (premium/admin)
}

async function assertPlanPermission(usuarioId: number): Promise<PlanAccess> {
  const userPlan = await findUserPlanInfo(usuarioId)
  if (!userPlan) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado')

  const premium = isPremiumActive(userPlan)

  if (PLAN_RULES.clear_chat.premium_only && !premium && !userPlan.is_admin) {
    throw new AppError(403, 'PREMIUM_REQUIRED', 'Este recurso é exclusivo para usuários premium')
  }

  if (premium || userPlan.is_admin) {
    return { isPremium: premium, isAdmin: userPlan.is_admin, remainingQuota: null }
  }

  // Freemium: verificar quota do período atual
  const cooldownMs = PLAN_RULES.clear_chat.freemium_cooldown_hours * 60 * 60 * 1000
  const now = new Date()
  const usage = await findClearChatUsage(usuarioId)

  if (usage && new Date(usage.period_start_at.getTime() + cooldownMs) > now) {
    const remaining = PLAN_RULES.clear_chat.freemium_max_deletions - usage.messages_deleted
    if (remaining <= 0) {
      const periodEnd = new Date(usage.period_start_at.getTime() + cooldownMs)
      throw new AppError(429, 'DELETION_LIMIT_REACHED',
        `Limite de ${PLAN_RULES.clear_chat.freemium_max_deletions} mensagens atingido. Aguarde até ${periodEnd.toISOString()}.`,
        { liberado_em: periodEnd.toISOString() })
    }
    return { isPremium: false, isAdmin: false, remainingQuota: remaining }
  }

  // Período expirado ou sem registro — iniciar novo período
  await upsertClearChatUsage(usuarioId, { messages_deleted: 0, period_start_at: now })
  return { isPremium: false, isAdmin: false, remainingQuota: PLAN_RULES.clear_chat.freemium_max_deletions }
}
```

## trackDeletions — Incremento de Quota

```typescript
// Só incrementa para freemium (premium/admin não têm limite)
async function trackDeletions(usuarioId: number, access: PlanAccess, deleted: number): Promise<void> {
  if (!access.isPremium && !access.isAdmin && deleted > 0) {
    await incrementMessageCount(usuarioId, deleted).catch(() => {})
  }
}
```

## Padrão de Service — clearChannelService (template)

```typescript
export async function clearChannelService(
  usuarioId: number,
  params: { channel_id: string; author_ids?: string[]; min_id?: string; max_id?: string },
): Promise<ClearResult> {
  const token = await getValidToken(usuarioId)      // 403 se my_token ausente/inválido
  const access = await assertPlanPermission(usuarioId) // 429 se quota esgotada
  const controller = startProcess(usuarioId)           // 409 se já há processo ativo
  let client: any

  try {
    client = await createUserClient(token)
    const selfId = client.user!.id
    const channel = await client.channels.fetch(params.channel_id).catch(() => null)
    if (!channel) throw new AppError(404, 'CHANNEL_NOT_FOUND', 'Canal não encontrado ou sem acesso')

    const delay = new AdaptiveDelay(PLAN_RULES.clear_chat.base_delete_delay_ms)
    const remaining = { value: access.remainingQuota }  // referência mutável compartilhada

    const deleted = await deleteMessagesInChannel(channel, {
      selfId, controller, delay, remaining,
      authorIds: params.author_ids ?? [],
      minId: params.min_id,
      maxId: params.max_id,
    })

    await trackDeletions(usuarioId, access, deleted)
    return { deleted, cancelled: controller.signal.aborted }
  } finally {
    if (client) destroyUserClient(client)  // SEMPRE destruir no finally
    clearProcess(usuarioId)                 // SEMPRE limpar o processo no finally
  }
}
```

## Repository — Funções Disponíveis

```typescript
// src/modules/clear-chat/repository.ts
findClearChatUsage(usuarioId: number)           // busca registro de uso atual
upsertClearChatUsage(usuarioId, { messages_deleted, period_start_at })  // cria ou reseta período
incrementMessageCount(usuarioId, count)          // incrementa contador após exclusões
```

## Model Prisma — clear_chat_usage

```prisma
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

## Padrão de Routes

```typescript
// ✅ CORRETO — handler: dentro das opções (Fastify v5)
app.post('/clear-chat/channel', {
  onRequest: [app.authenticate],
  config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  schema: { ... },
  handler: clearChannelController,
})

// ❌ PROIBIDO — 3º argumento causa erro de tipagem no Fastify v5
app.post('/clear-chat/channel', { schema: { ... } }, clearChannelController)
```

## O que a IA NUNCA deve fazer

- Reimplementar `AdaptiveDelay` ou `deleteMessagesInChannel` diretamente em `service.ts` — já existem em `src/selfbot/functions/delete-messages.ts`
- Acessar `prisma` diretamente em `service.ts` — usar apenas `repository.ts`
- Esquecer de chamar `destroyUserClient` e `clearProcess` no bloco `finally`
- Omitir `assertPlanPermission` antes de iniciar o processo (permite bypassar a quota)
- Usar `preHandler:` em vez de `onRequest:` para o middleware de auth nas rotas
- Passar o controller como 3º argumento do `app.post` — usar `handler:` dentro das opções
