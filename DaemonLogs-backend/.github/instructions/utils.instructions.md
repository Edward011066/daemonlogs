---
description: "Use when: criar endpoints utilitários Discord, validar token Discord com informações do usuário, buscar usuário público Discord por ID, POST /utils/validate-discord-token, GET /utils/discord-user/:id, módulo utils, utilitários sem banco, validateTokenWithUserInfo, trabalhar em src/modules/utils."
applyTo: "src/modules/utils/**"
---

# Módulo Utils — Utilitários Discord (sem banco de dados)

## Conceito

Endpoints `/utils/**` são **stateless** — não leem nem escrevem no banco. Usam funções de `src/selfbot/functions/` para chamar a API do Discord diretamente.

## Endpoints

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/utils/validate-discord-token` | Não | Valida token e retorna informações do usuário Discord |
| GET | `/utils/discord-user/:id` | Não | Retorna informações públicas de um usuário Discord por ID |

## Estrutura — sem repository.ts

```
src/modules/utils/
├── routes.ts
├── controller.ts
└── service.ts   # sem repository.ts — zero acesso ao Prisma
```

## POST /utils/validate-discord-token

Requer uma **nova função** em `src/selfbot/functions/validate-token.ts` que valida o token E retorna as informações do usuário (diferente da `validateToken()` que retorna apenas `boolean`):

```typescript
// src/selfbot/functions/validate-token.ts — adicionar função nova
export interface DiscordTokenUserInfo {
  id: string
  username: string
  discriminator: string
  global_name: string | null
  avatar: string | null
  email: string | null
  phone: string | null
  mfa_enabled: boolean
}

export async function validateTokenWithUserInfo(
  token: string
): Promise<{ valid: true; user: DiscordTokenUserInfo } | { valid: false }> {
  const cleanToken = token.trim()
  if (cleanToken.startsWith('Bot ') || cleanToken.startsWith('Bearer ')) {
    return { valid: false }
  }

  const client = new Client({
    checkUpdate: false,
    partials: ['MESSAGE', 'CHANNEL', 'USER'],
  } as ConstructorParameters<typeof Client>[0] & { checkUpdate?: boolean })

  return new Promise((resolve) => {
    const timeout = setTimeout(() => { client.destroy(); resolve({ valid: false }) }, 15_000)

    client.on('ready', () => {
      clearTimeout(timeout)
      const u = client.user!
      const info: DiscordTokenUserInfo = {
        id: u.id,
        username: u.username,
        discriminator: u.discriminator,
        global_name: (u as any).globalName ?? null,
        avatar: u.avatar,
        email: (u as any).email ?? null,
        phone: (u as any).phone ?? null,
        mfa_enabled: (u as any).mfaEnabled ?? false,
      }
      client.destroy()
      resolve({ valid: true, user: info })
    })

    client.login(cleanToken).catch(() => {
      clearTimeout(timeout)
      client.destroy()
      resolve({ valid: false })
    })
  })
}
```

> `client.user` no discord.js-selfbot-v13 expõe campos extras de conta pessoal (email, phone, mfa_enabled). Usar `as any` para campos não tipados. Verificar disponibilidade na documentação do pacote.

### Resposta

```json
// 200 — token válido
{
  "valid": true,
  "user": {
    "id": "123456789",
    "username": "exemplo",
    "discriminator": "0",
    "global_name": "Exemplo",
    "avatar": "abc123hash",
    "email": "user@email.com",
    "phone": null,
    "mfa_enabled": true
  }
}

// 200 — token inválido (nunca 401/422 — evitar vazamento de info sobre o sistema)
{ "valid": false }
```

## GET /utils/discord-user/:id

Usa a função `fetchDiscordUser()` existente em `src/selfbot/functions/fetch-discord-user.ts`, que busca via qualquer cliente de monitoramento ativo. **Requer ao menos um cliente selfbot ativo** — retornar 503 se não houver.

```typescript
// src/modules/utils/service.ts
import { fetchDiscordUser } from '../../selfbot/functions/fetch-discord-user.js'

export async function getDiscordUserService(discordUserId: string) {
  const user = await fetchDiscordUser(discordUserId)
  if (!user) {
    throw new AppError(503, 'NO_MONITORING_CLIENT',
      'Nenhuma conta de monitoramento ativa disponível para buscar informações')
  }
  return user
}
```

> **Limitação conhecida**: `fetchDiscordUser()` atualmente retorna apenas `{ username, username_global }`. Se o endpoint precisar retornar `avatar` e `id`, a função deve ser estendida para incluir `user.id` e `user.avatar`.

## Rate Limiting nas Rotas

```typescript
// POST /utils/validate-discord-token — custoso (cria cliente temporário)
config: {
  rateLimit: {
    max: 5,
    timeWindow: 10 * 60 * 1000,  // 5 por 10 min
    ban: 2,
  },
}

// GET /utils/discord-user/:id — leve
config: {
  rateLimit: {
    max: 30,
    timeWindow: 60 * 1000,  // 30 por minuto
  },
}
```

## O que a IA NUNCA deve fazer

- Criar `repository.ts` em `src/modules/utils/` — este módulo não acessa o banco
- Usar a função `validateToken()` (retorna só boolean) em vez de `validateTokenWithUserInfo()` para o endpoint de validação
- Retornar 401 ou 422 para token inválido no endpoint de validação — retornar sempre 200 com `{ valid: false }` para evitar enumeração de informação do sistema
- Exigir autenticação JWT nos endpoints `/utils/**` — eles são públicos por design
