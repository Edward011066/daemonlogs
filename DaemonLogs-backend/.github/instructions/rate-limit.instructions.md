---
description: "Use when: implementar rate limiting, adicionar limite de requisições, configurar rate limit, proteger endpoints contra abuso, configurar ban progressivo, instalar @fastify/rate-limit, criar src/plugins/rate-limit.ts, configurar limites por rota, rate limit progressivo, evitar abuso de API, brute force, credential stuffing."
applyTo: "src/plugins/**"
---

# Rate Limiting — Proteção contra Abuso

> Pacote oficial: `@fastify/rate-limit` — instalar via `npm install @fastify/rate-limit`  
> Compatível com Fastify v5. Não usar alternativas (express-rate-limit, limiter, etc.).

## Plugin — src/plugins/rate-limit.ts

```typescript
// src/plugins/rate-limit.ts
import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

export default fp(async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    global: true,
    max: Number(process.env.RATE_LIMIT_GLOBAL_MAX ?? 120),
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000), // 1 minuto
    ban: 3,         // após 3 violações no janela → ban com timeWindow dobrado
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    errorResponseBuilder(_request, context) {
      const retryAfter = Math.ceil(context.ttl / 1000)
      return {
        error: context.ban ? 'RATE_LIMIT_BANNED' : 'RATE_LIMIT_EXCEEDED',
        message: context.ban
          ? `IP banido por excesso de violações. Tente novamente em ${retryAfter} segundos.`
          : `Muitas requisições. Tente novamente em ${retryAfter} segundos.`,
        meta: { retryAfter },
      }
    },
  })
})
```

## Registro em app.ts (obrigatório)

```typescript
// src/app.ts — registrar APÓS authPlugin, ANTES de qualquer rota
import rateLimitPlugin from './plugins/rate-limit.js'

await fastify.register(rateLimitPlugin)
// depois: await fastify.register(authRoutes) etc.
```

## Limites por Rota (config.rateLimit)

Rotas sensíveis sobrescrevem o global via `config.rateLimit` diretamente na definição da rota — sem criar middleware separado:

```typescript
// src/modules/auth/routes.ts
fastify.post('/auth/login', {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: 5 * 60 * 1000,  // 5 minutos
      ban: 3,                      // ban após 3 violações (credential stuffing)
    },
  },
  schema: { /* ... */ },
  handler: loginController,
})

fastify.post('/auth/register', {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: 10 * 60 * 1000, // 10 minutos
      ban: 2,
    },
  },
  // ...
})

fastify.post('/auth/forgot-password', {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: 15 * 60 * 1000, // 15 minutos — previne abuso de envio de email
      ban: 2,
    },
  },
  // ...
})

fastify.post('/auth/verify-reset-code', {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: 5 * 60 * 1000,
      ban: 3,
    },
  },
  // ...
})
```

## Tabela de Limites Configurados

| Rota | Máx reqs | Janela | Ban após |
|------|----------|--------|----------|
| Global (todas) | 120 | 1 min | 3 violações |
| `POST /auth/login` | 10 | 5 min | 3 violações |
| `POST /auth/register` | 5 | 10 min | 2 violações |
| `POST /auth/forgot-password` | 5 | 15 min | 2 violações |
| `POST /auth/verify-reset-code` | 10 | 5 min | 3 violações |

> O ban usa `timeWindow` dobrado como duração. Para janelas maiores em rotas críticas (ex: login), isso resulta em bans proporcionalmente mais longos.

## Formato de Erro (consistente com AppError)

```json
// Rate limit excedido (HTTP 429)
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Muitas requisições. Tente novamente em 60 segundos.",
  "meta": { "retryAfter": 60 }
}

// IP banido (HTTP 403)
{
  "error": "RATE_LIMIT_BANNED",
  "message": "IP banido por excesso de violações. Tente novamente em 600 segundos.",
  "meta": { "retryAfter": 600 }
}
```

Headers automáticos em toda resposta:
- `X-RateLimit-Limit`: limite configurado para a rota
- `X-RateLimit-Remaining`: requisições restantes no janela atual
- `X-RateLimit-Reset`: timestamp Unix do próximo reset
- `Retry-After`: segundos até poder tentar novamente (presente quando limitado/banido)

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `RATE_LIMIT_GLOBAL_MAX` | `120` | Máx requisições por janela (global) |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Janela de tempo em ms para o limite global |

## O que a IA NUNCA deve fazer

- Implementar rate limiting manualmente com `Map` ou contador em memória — usar exclusivamente `@fastify/rate-limit`
- Omitir `errorResponseBuilder` — o padrão do plugin não segue o formato `{ error, message, meta }` do projeto
- Aplicar rate limit no webhook Woovi (`/webhooks/woovi`) — ele usa validação de assinatura HMAC própria e o IP pode ser da Woovi
- Instalar alternativas (`express-rate-limit`, `rate-limiter-flexible`) — incompatíveis com a arquitetura Fastify do projeto
- Omitir `addHeaders` — o frontend precisa dos headers `X-RateLimit-*` para feedback ao usuário
- Registrar o plugin depois das rotas em `app.ts` — o plugin deve ser registrado antes de qualquer rota para ser aplicado
