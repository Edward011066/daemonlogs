---
description: "Use when: criar endpoint de automação Discord, fechar DMs do usuário, sair de servidores, deletar relações, cancelar processo automação, POST /tools/close-dm, POST /tools/leave-server, POST /tools/delete-relationships, POST /tools/cancel-current-process, process tracker, user-client temporário, usar token my-token para automações, rate limit Discord simulação humana, trabalhar em src/modules/tools."
applyTo: "src/modules/tools/**"
---

# Módulo Tools — Automações com Token Pessoal

> Documentação do discord.js-selfbot-v13: https://www.npmjs.com/package/discord.js-selfbot-v13
> **Sempre verificar a documentação antes de implementar métodos específicos** — a API do selfbot difere do discord.js oficial.

## Conceito Fundamental

Endpoints `/tools/**` usam o **token pessoal** do usuário (tabela `my_tokens`, `is_valid = true`) para realizar ações no Discord dele. **Nenhuma ação é persistida no banco de dados.**

## Regras de Negócio Críticas

1. **Pré-condição obrigatória**: usuário DEVE ter `my_token` com `is_valid = true` — verificar ANTES de qualquer ação (403 `NO_VALID_TOKEN` se ausente ou inválido)
2. **Processo único por usuário**: apenas um processo de automação por vez — usar `process-tracker.ts`
3. **Sem persistência**: `src/modules/tools/` NÃO tem `repository.ts` — zero acesso ao Prisma
4. **Rate limit Discord**: delay obrigatório entre ações para simular comportamento humano
5. **Cliente temporário**: o cliente selfbot criado para tools é destruído após o uso — nunca reutilizar

## Estrutura de Arquivos

```
src/modules/tools/
├── routes.ts       # rotas com rate limit estrito (ver rate-limit.instructions.md)
├── controller.ts   # extrai dados do request, chama service
└── service.ts      # lógica de automação — sem repository.ts

src/selfbot/functions/
├── user-client.ts      # cria/destrói cliente temporário para token pessoal
└── process-tracker.ts  # rastreia processo ativo por usuário (in-memory Map)
```

## Process Tracker — Padrão Obrigatório

```typescript
// src/selfbot/functions/process-tracker.ts
import { AppError } from '../../utils/app-error.js'

const activeProcesses = new Map<number, AbortController>()

export function startProcess(usuarioId: number): AbortController {
  if (activeProcesses.has(usuarioId)) {
    throw new AppError(409, 'PROCESS_ALREADY_RUNNING',
      'Já existe um processo em execução. Cancele-o antes de iniciar outro.')
  }
  const controller = new AbortController()
  activeProcesses.set(usuarioId, controller)
  return controller
}

export function cancelProcess(usuarioId: number): boolean {
  const controller = activeProcesses.get(usuarioId)
  if (!controller) return false
  controller.abort()
  activeProcesses.delete(usuarioId)
  return true
}

export function clearProcess(usuarioId: number): void {
  activeProcesses.delete(usuarioId)
}

export function hasActiveProcess(usuarioId: number): boolean {
  return activeProcesses.has(usuarioId)
}
```

## User Client — Cliente Temporário

```typescript
// src/selfbot/functions/user-client.ts
import { Client } from 'discord.js-selfbot-v13'

// Cria cliente temporário para o token pessoal do usuário.
// NÃO registra eventos. Destruir SEMPRE após uso.
export async function createUserClient(token: string): Promise<Client> {
  const client = new Client({
    checkUpdate: false,
    partials: ['MESSAGE', 'CHANNEL', 'USER'],
  } as ConstructorParameters<typeof Client>[0] & { checkUpdate?: boolean })

  await client.login(token)
  return client
}

export function destroyUserClient(client: Client): void {
  client.destroy()
}
```

## Padrão de Service para Tools (template obrigatório)

```typescript
// src/modules/tools/service.ts
import { createUserClient, destroyUserClient } from '../../selfbot/functions/user-client.js'
import { startProcess, clearProcess } from '../../selfbot/functions/process-tracker.js'
import { findMyTokenByUser } from '../my-token/repository.js'
import { assertPremiumOrAdmin } from '../plans/service.js'
import { PLAN_RULES } from '../../config/plan-rules.js'
import { AppError } from '../../utils/app-error.js'

// Delay e regras de acesso lidos de plan-rules — NUNCA hardcodar
const ACTION_DELAY_MS = PLAN_RULES.tools.action_delay_ms  // ms entre ações para simular comportamento humano
// PLAN_RULES.tools.premium_only — se true, somente premium/admin pode usar tools

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function closeDmsService(
  usuarioId: number,
  ignoredChannelIds: string[]
): Promise<{ processed: number; cancelled: boolean }> {
  // 0. Guard de plano (se PLAN_RULES.tools.premium_only = true)
  if (PLAN_RULES.tools.premium_only) {
    await assertPremiumOrAdmin(usuarioId)
  }

  // 1. Verificar my-token válido
  const myToken = await findMyTokenByUser(usuarioId)
  if (!myToken?.is_valid) {
    throw new AppError(403, 'NO_VALID_TOKEN',
      'Adicione um token válido em POST /my-token/add antes de usar automações')
  }

  // 2. Registrar processo (lança 409 se já há um)
  const controller = startProcess(usuarioId)
  const client = await createUserClient(myToken.token)
  let processed = 0

  try {
    const dmChannels = client.channels.cache.filter(c => c.type === 'DM')

    for (const [, channel] of dmChannels) {
      if (controller.signal.aborted) break  // checar cancelamento ANTES de cada ação
      if (ignoredChannelIds.includes(channel.id)) continue

      try {
        await (channel as any).delete()  // verificar método correto na doc do selfbot
        processed++
      } catch { /* canal já fechado ou sem permissão */ }

      await sleep(ACTION_DELAY_MS)
    }
  } finally {
    destroyUserClient(client)  // SEMPRE destruir o cliente
    clearProcess(usuarioId)    // SEMPRE limpar o processo
  }

  return { processed, cancelled: controller.signal.aborted }
}
```

> Os outros services (`leaveServersService`, `deleteRelationshipsService`) seguem o mesmo padrão:
> pré-verificação → startProcess → createUserClient → loop com abort check + sleep → finally destroyUserClient + clearProcess.

## Fluxo de Cada Endpoint

```
POST /tools/cancel-current-process
  1. cancelProcess(usuarioId) — retorna false se não há processo ativo
  2. 200 { message, cancelled: boolean }

POST /tools/close-dm  { ignored_channel_ids?: string[] }
  1. Verificar my-token válido (403 NO_VALID_TOKEN)
  2. startProcess(usuarioId) — 409 PROCESS_ALREADY_RUNNING se já há um
  3. createUserClient(myToken.token)
  4. Para cada DM canal (exceto ignored_channel_ids):
     a. Checar controller.signal.aborted → break
     b. Fechar o canal
     c. await sleep(ACTION_DELAY_MS)
  5. finally: destroyUserClient + clearProcess
  6. Retornar { processed: N, cancelled: boolean }

POST /tools/leave-server  { ignored_guild_ids?: string[] }
  Mesmo padrão — para cada guild exceto ignorados: guild.leave()

POST /tools/delete-relationships  { ignored_user_ids?: string[] }
  Mesmo padrão — para cada relationship exceto ignorados: deletar
  ⚠️ Verificar API do discord.js-selfbot-v13 para o método correto de listar e remover relationships
```

## Rate Limiting nas Rotas (obrigatório)

```typescript
// src/modules/tools/routes.ts
fastify.post('/tools/close-dm', {
  config: {
    rateLimit: {
      max: 3,
      timeWindow: 60 * 60 * 1000,  // 3 por hora por IP
      ban: 2,
    },
  },
  // ...
})
// Mesmo config para leave-server e delete-relationships
// cancel-current-process: limite mais generoso (20 por hora)
```

## APIs do discord.js-selfbot-v13 para Tools

> **Verificar a documentação do pacote antes de usar** — métodos podem não existir ou ter nomes diferentes.

| Ação | API sugerida a verificar |
|------|--------------------------|
| Listar DMs | `client.channels.cache.filter(c => c.type === 'DM')` |
| Fechar canal DM | `channel.delete()` (confirmar disponibilidade) |
| Listar guilds | `client.guilds.cache` |
| Sair de guild | `guild.leave()` |
| Listar relationships | `client.relationships` (específico do selfbot) |
| Remover relationship | Verificar doc — pode ser `user.deleteRelationship()` ou similar |

## O que a IA NUNCA deve fazer

- Criar `repository.ts` em `src/modules/tools/` — este módulo não acessa o banco
- Registrar o token do `my_tokens` no `ClientManager` — o cliente de tools é temporário
- Esquecer `destroyUserClient()` no bloco `finally` — vazamento de cliente
- Esquecer `clearProcess()` no bloco `finally` — usuário fica preso sem poder iniciar novo processo
- Executar iterações sem verificar `controller.signal.aborted` — impede cancelamento
- Omitir o `sleep()` entre ações — provoca rate limit no Discord
- Usar `Promise.all()` para ações paralelas no Discord — simular ações humanas sequencialmente
- Salvar qualquer resultado no banco — tools são stateless em relação ao banco
