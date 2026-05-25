---
description: "Use when: criar rota Fastify, adicionar endpoint, criar controller, criar service, criar repository, implementar módulo API, adicionar schema de validação, documentação Swagger, SWAGGER_ENABLED, swagger condicional, módulo sem repository, trabalhar em src/modules."
applyTo: "src/modules/**"
---

# API Fastify — Regras de Implementação

## Arquitetura de Módulo (obrigatória)

```
Routes (fastify plugin) → Controller → Service → Repository → Prisma
```

Cada módulo em `src/modules/<nome>/` deve ter:
```
<nome>/
├── routes.ts       # Fastify plugin com schemas JSON Schema
├── controller.ts   # Extrai dados do request, chama service, monta response
├── service.ts      # Lógica de negócio, chama repository
└── repository.ts   # Único acesso ao Prisma
```

## Template de Route com Schema (obrigatório para Swagger)

```typescript
// src/modules/targets/routes.ts
import { FastifyInstance } from 'fastify'
import { addTargetController } from './controller'

export async function targetRoutes(fastify: FastifyInstance) {
  fastify.post('/targets', {
    onRequest: [fastify.authenticate], // JWT middleware
    schema: {
      tags: ['Contas Alvo'],
      summary: 'Adicionar conta alvo',
      body: {
        type: 'object',
        required: ['discord_user_id'],
        properties: {
          discord_user_id: { type: 'string', pattern: '^[0-9]{17,20}$' },
          username: { type: 'string' },
          username_global: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            discord_user_id: { type: 'string' },
            username: { type: 'string' },
          },
        },
        422: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: addTargetController,
  })
}
```

## Template de Controller

```typescript
// src/modules/targets/controller.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { addTargetService } from './service'

export async function addTargetController(
  request: FastifyRequest<{ Body: { discord_user_id: string; username?: string } }>,
  reply: FastifyReply
) {
  const { discord_user_id, username } = request.body
  const usuarioId = request.user.sub // extraído do JWT pelo middleware

  const target = await addTargetService({ discord_user_id, username, usuarioId })
  return reply.code(201).send(target)
}
```

## Template de Service

```typescript
// src/modules/targets/service.ts
import { findTargetByDiscordId, createTarget } from './repository'

interface AddTargetInput {
  discord_user_id: string
  username?: string
  usuarioId: number
}

export async function addTargetService(input: AddTargetInput) {
  const existing = await findTargetByDiscordId(input.discord_user_id, input.usuarioId)
  if (existing) throw new AppError(409, 'TARGET_ALREADY_EXISTS', 'Conta alvo já cadastrada')

  return createTarget(input)
}
```

## Erros — Padrão AppError

```typescript
// src/utils/app-error.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public message: string,
    public meta?: unknown
  ) {
    super(message)
  }
}

// No errorHandler global do Fastify:
if (error instanceof AppError) {
  return reply.code(error.statusCode).send({ error: error.code, message: error.message, meta: error.meta })
}
```

## Swagger Condicional

O Swagger é controlado pela variável de ambiente `SWAGGER_ENABLED`. Em `src/app.ts`:

```typescript
// Registrar swagger apenas se habilitado (default: true em dev, false em prod)
if (process.env.SWAGGER_ENABLED !== 'false') {
  await fastify.register(swaggerPlugin)
}
```

> Adicionar `SWAGGER_ENABLED=true` ao `.env.example` com comentário sobre produção (ver docker.instructions.md).

## Configuração do Swagger

```typescript
// src/plugins/swagger.ts
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

export async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      info: { title: 'DaemonLogs', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })
  await fastify.register(swaggerUi, { routePrefix: '/api-docs' })
}
```

## Endpoints por Módulo (referência)

| Módulo | Método | Path | Auth |
|--------|--------|------|------|
| auth | POST | `/auth/register` | Não |
| auth | POST | `/auth/login` | Não |
| auth | POST | `/auth/logout` | Sim |
| auth | POST | `/auth/activate` | Não |
| auth | POST | `/auth/resend-activation` | Não |
| auth | POST | `/auth/forgot-password` | Não |
| auth | POST | `/auth/verify-reset-code` | Não |
| auth | POST | `/auth/reset-password` | Não |
| monitoring | GET | `/monitoring` | Sim |
| monitoring | POST | `/monitoring` | Sim |
| monitoring | DELETE | `/monitoring/:id` | Sim |
| monitoring | POST | `/monitoring/:id/validate` | Sim |
| targets | GET | `/targets` | Sim |
| targets | POST | `/targets` | Sim |
| targets | DELETE | `/targets/:id` | Sim |
| events | GET | `/events?targetId=&tipo=&page=` | Sim |
| messages | GET | `/messages?targetId=&page=` | Sim |
| servers | GET | `/servers` | Não (público) |
| payments | POST | `/payments/initiate` | Sim |
| payments | GET | `/payments/status/:correlationId` | Sim |
| webhooks | POST | `/webhooks/woovi` | Não (assinatura Woovi) |
| my-token | GET | `/my-token` | Sim |
| my-token | POST | `/my-token/add` | Sim |
| my-token | DELETE | `/my-token/delete` | Sim |
| my-token | PATCH | `/my-token/rotate` | Sim |
| utils | POST | `/utils/validate-discord-token` | Não (público) |
| utils | GET | `/utils/discord-user/:id` | Não (público) |
| tools | POST | `/tools/cancel-current-process` | Sim |
| tools | POST | `/tools/close-dm` | Sim |
| tools | POST | `/tools/leave-server` | Sim |
| tools | POST | `/tools/delete-relationships` | Sim |

## Módulos sem repository.ts (stateless)

Os módulos `utils` e `tools` não têm `repository.ts` pois não acessam o banco diretamente:

```
src/modules/utils/
├── routes.ts
├── controller.ts
└── service.ts    # sem repository.ts

src/modules/tools/
├── routes.ts
├── controller.ts
└── service.ts    # sem repository.ts (acessa my-token/repository.ts indiretamente)
```

Ver `utils.instructions.md` e `tools.instructions.md` para detalhes.

## Padrão de Guard de Plano (Freemium/Premium)

Verificações de plano são feitas no **service**, nunca no controller.
Ver `premium.instructions.md` para a implementação completa do guard.

```typescript
// src/modules/targets/service.ts
import { assertCanAddTarget } from '../plans/service.js'

export async function addTargetService(data: { discord_user_id: string }, usuarioId: number) {
  await assertCanAddTarget(usuarioId)  // SEMPRE PRIMEIRA LINHA — antes de qualquer operação de banco
  // ...restante da lógica
}
```

## O que a IA NUNCA deve fazer

- Acessar `prisma` diretamente no controller ou service
- Criar rota sem schema JSON Schema (quebra o Swagger)
- Lançar erros genéricos — sempre usar `AppError` com código semântico
- Omitir `onRequest: [fastify.authenticate]` em rotas protegidas
- Colocar lógica de negócio no controller (apenas extração de dados e call ao service)
- Criar funções utilitárias inline — usar `src/utils/`
