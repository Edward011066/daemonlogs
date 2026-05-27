---
description: "Use when: implementar Discord OAuth2, criar rota /auth/discord, criar rota /auth/discord/callback, AUTH_MODE=discord, login com Discord, OAuth2, autenticação Discord, callback Discord, state CSRF, trocar code por token, discord_id, upsert usuário Discord, redirecionar frontend com JWT, desativar login local, src/modules/auth/discord-oauth."
---

# Discord OAuth2 — Regras de Implementação

## Pré-requisito: verificar AUTH_MODE

Importe `AUTH_CONFIG` de `src/config/auth-config.ts` para verificar o modo ativo:

```typescript
import { AUTH_CONFIG } from '../../config/auth-config.js'

// Em auth/routes.ts — registrar rotas condicionalmente:
if (AUTH_CONFIG.mode === 'discord') {
  fastify.get('/auth/discord', { ... }, discordOAuthController)
  fastify.get('/auth/discord/callback', { ... }, discordCallbackController)
}
if (AUTH_CONFIG.mode === 'local') {
  // rotas locais existentes (register, login, activate, etc.)
}
```

**Nunca registrar as duas famílias de rotas ao mesmo tempo.**

## Fluxo Completo Discord OAuth2

```
1. GET  /auth/discord
   → Gerar state aleatório (CSRF) → salvar em cookie HttpOnly por 10min
   → Montar URL de autorização Discord
   → Retornar 302 para https://discord.com/oauth2/authorize?...

2. GET  /auth/discord/callback?code=CODE&state=STATE
   → Validar state contra cookie (400 INVALID_STATE se divergir)
   → POST https://discord.com/api/oauth2/token  (trocar code por access_token)
   → GET  https://discord.com/api/users/@me     (buscar perfil do usuário)
   → Upsert usuário por discord_id (ver regras abaixo)
   → Criar sessão JWT (mesmo fluxo do login local)
   → Limpar cookie de state
   → 302 para DISCORD_OAUTH_FRONTEND_REDIRECT?token=JWT
```

## Rota GET /auth/discord — Geração do State CSRF

```typescript
// controller
export async function discordOAuthController(request: FastifyRequest, reply: FastifyReply) {
  const state = crypto.randomBytes(16).toString('hex') // NUNCA Math.random()

  reply.setCookie('discord_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_CONFIG.discord.state_ttl_ms / 1000, // em segundos
    path: '/',
  })

  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.discord.client_id,
    redirect_uri: AUTH_CONFIG.discord.redirect_uri,
    response_type: 'code',
    scope: AUTH_CONFIG.discord.scopes.join(' '),
    state,
  })

  return reply.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`)
}
```

## Rota GET /auth/discord/callback — Validação e Upsert

```typescript
// service — discordCallbackService(code, state, cookieState, fastify)
export async function discordCallbackService(
  code: string,
  state: string,
  cookieState: string | undefined,
  fastify: FastifyInstance
) {
  // 1. Validar state CSRF
  if (!cookieState || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(cookieState))) {
    throw new AppError(400, 'INVALID_STATE', 'State OAuth2 inválido ou expirado')
  }

  // 2. Trocar code por access_token
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: AUTH_CONFIG.discord.client_id,
      client_secret: process.env.DISCORD_CLIENT_SECRET!, // crítico — acesso direto ao env
      grant_type: 'authorization_code',
      code,
      redirect_uri: AUTH_CONFIG.discord.redirect_uri,
    }),
  })
  if (!tokenRes.ok) throw new AppError(502, 'DISCORD_TOKEN_EXCHANGE_FAILED', 'Falha na troca de código Discord')
  const { access_token } = await tokenRes.json() as { access_token: string }

  // 3. Buscar perfil do usuário no Discord
  const meRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (!meRes.ok) throw new AppError(502, 'DISCORD_PROFILE_FETCH_FAILED', 'Falha ao buscar perfil Discord')
  const profile = await meRes.json() as {
    id: string           // Discord User ID — armazenar como String
    username: string
    global_name?: string
    email?: string       // pode ser null se não verificado
  }

  // 4. Upsert do usuário por discord_id (ver regras de upsert abaixo)
  const user = await upsertUsuarioByDiscordId(profile)

  // 5. Criar sessão JWT (mesmo padrão do login local)
  const expiresAt = new Date(Date.now() + AUTH_CONFIG.session_ttl_ms)
  const jwtToken = fastify.jwt.sign({ sub: user.id, ip: 'discord_oauth' }, { expiresIn: '24h' })
  await createSession({ usuario_id: user.id, ip: 'discord_oauth', jwt_token: jwtToken, expires_at: expiresAt })

  return { token: jwtToken, frontend_redirect: AUTH_CONFIG.discord.frontend_redirect }
}
```

> **Nota sobre IP:** usuários Discord OAuth não têm IP no login — armazenar `'discord_oauth'` como sentinel fixo. O middleware `auth.ts` deve pular a verificação de IP quando `ip === 'discord_oauth'`.

## Regras de Upsert por discord_id

```typescript
// repository — upsertUsuarioByDiscordId
export async function upsertUsuarioByDiscordId(profile: {
  id: string
  username: string
  global_name?: string
  email?: string
}) {
  return prisma.usuarios.upsert({
    where: { discord_id: profile.id },
    update: {
      // Atualizar apenas campos que mudam no Discord — NÃO sobrescrever is_premium, etc.
      username: profile.username,
    },
    create: {
      discord_id: profile.id,                             // String — ID do Discord
      username: profile.username,
      email: profile.email ?? null,                       // pode ser null
      password: null,                                     // Discord OAuth users não têm senha
      is_activated: true,                                 // sempre ativo — sem etapa de verificação
      referral_code: await createUniqueReferralCode(),    // gerado automaticamente
    },
  })
}
```

## Schema Prisma — Campos Adicionados em `usuarios`

```prisma
model usuarios {
  // ... campos existentes ...
  discord_id  String?  @unique @db.VarChar(20)  // Discord User ID — null para usuários locais
  password    String?                             // null para Discord OAuth users (sem senha)
  email       String?  @unique @db.VarChar(255)  // opcional — Discord pode não retornar email verificado

  @@map("usuarios")
}
```

> **Migration necessária:** `password` e `email` passam de obrigatórios para opcionais (`?`).  
> Rodar: `npx prisma migrate dev --name add_discord_oauth_fields`

## Comportamento por AUTH_MODE

| Rota | AUTH_MODE=local | AUTH_MODE=discord |
|------|-----------------|-------------------|
| `POST /auth/register` | ✅ disponível | 400 `AUTH_MODE_DISCORD` |
| `POST /auth/login` | ✅ disponível | 400 `AUTH_MODE_DISCORD` |
| `POST /auth/activate` | ✅ disponível | 400 `AUTH_MODE_DISCORD` |
| `POST /auth/forgot-password` | ✅ disponível | 400 `AUTH_MODE_DISCORD` |
| `GET /auth/discord` | não registrada | ✅ disponível |
| `GET /auth/discord/callback` | não registrada | ✅ disponível |

```typescript
// Resposta padrão quando rota local é chamada no modo discord:
return reply.code(400).send({
  error: 'AUTH_MODE_DISCORD',
  message: 'Esta instância usa autenticação Discord OAuth2. Use GET /auth/discord para entrar.',
})
```

## Atualização do middleware auth.ts (src/plugins/auth.ts)

Quando `ip === 'discord_oauth'` (sentinel), pular verificação de IP:

```typescript
// Em fastify.decorate('authenticate', ...)
const { sub, ip } = request.user
const clientIp = request.ip

// Pular checagem de IP para sessões OAuth2 Discord
if (ip !== 'discord_oauth' && ip !== clientIp) {
  return reply.code(401).send({ error: 'IP_MISMATCH', message: 'Sessão inválida para este IP' })
}
```

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `AUTH_MODE` | `local` | `local` ou `discord` — define qual sistema de auth está ativo |
| `DISCORD_CLIENT_ID` | — | App ID do Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | — | Secret do Discord Developer Portal (**crítico — não logar**) |
| `DISCORD_REDIRECT_URI` | `http://localhost:3000/auth/discord/callback` | Deve bater com o configurado no Discord Developer Portal |
| `DISCORD_OAUTH_FRONTEND_REDIRECT` | `http://localhost:5173` | URL do frontend que recebe `?token=JWT` |

## Erros Padronizados

| Situação | HTTP | Código |
|----------|------|--------|
| State CSRF inválido/expirado | 400 | `INVALID_STATE` |
| Rota local acessada no modo discord | 400 | `AUTH_MODE_DISCORD` |
| Falha na troca de código com Discord | 502 | `DISCORD_TOKEN_EXCHANGE_FAILED` |
| Falha ao buscar perfil no Discord | 502 | `DISCORD_PROFILE_FETCH_FAILED` |

## O que a IA NUNCA deve fazer

- Registrar rotas locais E OAuth2 simultaneamente — sempre condicional por `AUTH_CONFIG.mode`
- Armazenar o `access_token` do Discord no banco — é temporário e não deve persistir
- Usar `Math.random()` para gerar o state CSRF — sempre `crypto.randomBytes(16).toString('hex')`
- Pedir scopes além de `identify` e `email` — mínimo necessário apenas
- Logar ou expor `DISCORD_CLIENT_SECRET` em logs, erros ou respostas
- Comparar o state CSRF com `===` — usar `crypto.timingSafeEqual()`
- Criar senha automática para usuários Discord OAuth — `password` deve ser `null`
- Tornar `discord_id` obrigatório no schema — usuários locais não têm (`?`)
- Armazenar `discord_id` como `Int` ou `BigInt` — sempre `String @db.VarChar(20)`
- Usar `@fastify/cookie` sem configurar `httpOnly: true` no cookie de state
