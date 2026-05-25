---
description: "Use when: criar função selfbot, adicionar event handler Discord, implementar monitoramento, trabalhar com discord.js-selfbot-v13, client manager, capturar mensagens Discord, eventos de voz, eventos de canal, selfbot/functions, selfbot/events."
applyTo: "src/selfbot/**"
---

# Selfbot — discord.js-selfbot-v13

> Documentação do pacote: https://www.npmjs.com/package/discord.js-selfbot-v13

## Princípio Fundamental: Zero Código Inline

**Nenhum código discord.js-selfbot-v13 pode existir fora de `src/selfbot/`.**

```typescript
// ❌ PROIBIDO — código selfbot em service, controller, etc.
// src/modules/monitoring/service.ts
import { Client } from 'discord.js-selfbot-v13'
const client = new Client() // ERRADO

// ✅ CORRETO — chamar função do selfbot
// src/modules/monitoring/service.ts
import { startMonitoringAccount } from '@/selfbot/functions/client-lifecycle'
await startMonitoringAccount(token)
```

## Estrutura de Arquivos

```
src/selfbot/
├── client-manager.ts         # Único lugar onde clientes são criados/destruídos
├── events/                   # Um arquivo por tipo de evento Discord
│   ├── guild-sync.ts         # sincroniza servidores no ready/guildCreate/guildUpdate
│   ├── index.ts              # registerAllEvents() — agrega message-*, voice-state-update
│   ├── message-create.ts
│   ├── message-update.ts
│   ├── message-delete.ts
│   └── voice-state-update.ts
└── functions/                # Funções reutilizáveis exportadas para o restante do sistema
    ├── client-lifecycle.ts   # start/stop/restart — aceita contaMonitoramentoId opcional
    ├── validate-token.ts     # validateToken() (boolean) + validateTokenWithUserInfo() (retorna dados do usuário)
    ├── save-events.ts        # saveMessage, saveEvent, saveServer
    ├── target-utils.ts       # isTargetUser, getTargetInternalId, getAllTargetIds
    ├── user-client.ts        # createUserClient(token) / destroyUserClient(client) — clientes temporários para /tools e /clear-chat
    ├── process-tracker.ts    # startProcess / cancelProcess / clearProcess — rastreia automações por usuário
    └── delete-messages.ts    # AdaptiveDelay (delay adaptativo com half-life) + deleteMessagesInChannel — usado por /clear-chat
```

## Clientes Temporários vs Clientes Persistentes

| Tipo | Arquivo | Quem usa | Eventos registrados | Destrudo após uso? |
|------|---------|----------|--------------------|--------------------|
| **Persistente (monitoramento)** | `client-manager.ts` | Sistema de monitoramento | Sim (message-*, voice-state-update) | Não — permanece ativo |
| **Temporário (my-token)** | `user-client.ts` | Módulos `/tools/**` e `/clear-chat/**` | **Nunca** | **Sempre** no `finally` |
| **Temporário (validação)** | `validate-token.ts` | Auth (add monitoring), utils | **Nunca** | Sim (após resultado) |

> **Regra**: `user-client.ts` e `validate-token.ts` criam clientes sem registrar eventos. O `client-manager.ts` é o único que registra event handlers persistentes.

## ClientManager — Padrão Obrigatório

O `client-manager.ts` gerencia um `Map<token, Client>` de clientes ativos.

```typescript
// src/selfbot/client-manager.ts
import { Client } from 'discord.js-selfbot-v13'

const clients = new Map<string, Client>()

export function getClient(token: string): Client | undefined {
  return clients.get(token)
}

export async function createClient(token: string, contaMonitoramentoId?: number): Promise<Client> {
  if (clients.has(token)) return clients.get(token)!

  // partials OBRIGATÓRIOS — sem eles, eventos de objetos não cacheados são descartados silenciosamente
  const client = new Client({
    checkUpdate: false,
    partials: ['MESSAGE', 'CHANNEL', 'GUILD_MEMBER', 'USER', 'REACTION'],
  })

  client.on('error', (err) => console.error(`[ClientManager] Erro: ${err.message}`))

  registerAllEvents(client)                          // message-*, voice-state-update
  registerGuildSyncEvents(client, contaMonitoramentoId) // salva servidores no evento ready

  await client.login(token)  // token de USUÁRIO puro — sem prefixo "Bot " ou "Bearer "
  clients.set(token, client)
  return client
}

export async function destroyClient(token: string): Promise<void> {
  const client = clients.get(token)
  if (client) {
    client.destroy()
    clients.delete(token)
  }
}

export function getAllClients(): Map<string, Client> {
  return clients
}

// ATENÇÃO: recebe { id, token }[], não string[] — o id é necessário para guild-sync
export async function startAllValidClients(tokens: { id: number; token: string }[]): Promise<void> {
  for (const { id, token } of tokens) {
    await createClient(token, id).catch((err) =>
      console.error(`[ClientManager] Falha ao conectar token ${token.slice(0, 10)}...:`, err)
    )
  }
}
```

## Validação de Token

```typescript
// src/selfbot/functions/validate-token.ts
import { Client } from 'discord.js-selfbot-v13'

// Valida token de CONTA DE USUÁRIO Discord (selfbot) — rejeita tokens de bots oficiais
export async function validateToken(token: string): Promise<boolean> {
  // Tokens de bot oficial começam com "Bot " — não são aceitos neste sistema
  if (token.startsWith('Bot ') || token.startsWith('Bearer ')) return false

  const client = new Client({ checkUpdate: false, partials: ['MESSAGE', 'CHANNEL', 'USER'] })
  return new Promise((resolve) => {
    const timeout = setTimeout(() => { client.destroy(); resolve(false) }, 15_000)
    client.once('ready', () => { clearTimeout(timeout); client.destroy(); resolve(true) })
    client.login(token).catch(() => { clearTimeout(timeout); client.destroy(); resolve(false) })
  })
}
```

## Estrutura de Eventos — Padrão por Arquivo

```typescript
// src/selfbot/events/message-create.ts
import { Client, Message } from 'discord.js-selfbot-v13'
import { salvarMensagem } from '@/selfbot/functions/save-events'
import { isTargetUser } from '@/selfbot/functions/target-utils'

export function registerMessageCreateEvent(client: Client): void {
  client.on('messageCreate', async (message: Message) => {
    if (!isTargetUser(message.author.id)) return
    await salvarMensagem(message)
  })
}
```

## Tipos de Eventos a Monitorar

| Evento Discord | Handler | Dados a Salvar |
|---------------|---------|----------------|
| `messageCreate` | `message-create.ts` | conteúdo, channel_id, guild_id, message_id, timestamp |
| `messageUpdate` | `message-update.ts` | conteúdo anterior, conteúdo novo, channel_id, guild_id, timestamp |
| `messageDelete` | `message-delete.ts` | conteúdo (se em cache), channel_id, guild_id, message_id, timestamp |
| `voiceStateUpdate` | `voice-state-update.ts` | canal de origem, canal de destino, usuários presentes em cada canal, timestamp |
| `messageCreate` (mention) | `message-create.ts` | quem mencionou, em qual canal, conteúdo, timestamp |

## Estrutura JSON de Eventos por Tipo

```typescript
// MESSAGE_EDIT
{
  tipo: 'MESSAGE_EDIT',
  dados: {
    message_id: string,
    channel_id: string,
    guild_id: string,
    conteudo_anterior: string,
    conteudo_novo: string,
    timestamp: string // ISO 8601
  }
}

// VOICE_JOIN / VOICE_LEAVE / VOICE_SWITCH
{
  tipo: 'VOICE_SWITCH',
  dados: {
    canal_anterior_id: string | null,
    canal_anterior_nome: string | null,
    canal_novo_id: string | null,
    canal_novo_nome: string | null,
    guild_id: string,
    usuarios_canal_anterior: Array<{ username: string, discord_user_id: string }>,
    usuarios_canal_novo: Array<{ username: string, discord_user_id: string }>,
    timestamp: string
  }
}
```

## Deduplicação de Eventos

Quando múltiplas contas de monitoramento capturam o mesmo evento, usar `idempotency_key`:

```typescript
const idempotencyKey = `${messageId}:MESSAGE_CREATE`
// upsert ou verificar existência antes de salvar — nunca inserir duplicado
```

## O que a IA NUNCA deve fazer

- Criar `new Client()` fora de `src/selfbot/client-manager.ts`
- Criar `new Client()` **sem** `partials` — causa descarte silencioso de eventos de objetos não cacheados
- Registrar eventos (`.on('messageCreate', ...)`) fora de `src/selfbot/events/`
- Escrever lógica de salvar no banco diretamente nos event handlers — chamar funções de `functions/`
- Deixar clientes selfbot sem o handler de erro (`client.on('error', ...)`)
- Usar `client.login()` fora de `client-manager.ts` e `validate-token.ts`
- Passar `string[]` para `startAllValidClients` — a assinatura é `{ id: number; token: string }[]`
- Ignorar deduplicação ao salvar eventos capturados por múltiplos clientes
