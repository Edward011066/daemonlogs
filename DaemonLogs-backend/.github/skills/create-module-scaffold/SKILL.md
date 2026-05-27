---
name: create-module-scaffold
description: "Use when: criar módulo completo, criar novo módulo API, scaffold de módulo, novo módulo Fastify, criar routes controller service repository, criar estrutura de módulo, novo recurso de domínio, criar módulo stateless, criar módulo com banco, criar módulo sem repository."
argument-hint: "Nome do módulo (ex: 'subscriptions'), se tem banco ou é stateless, e quais endpoints iniciais."
user-invocable: true
---

# Skill: Criar Scaffold de Módulo

Cria a estrutura completa de um novo módulo seguindo a arquitetura obrigatória do DaemonLogs.

## Decisão inicial: com ou sem banco?

| Tipo | Quando | Arquivos |
|------|--------|----------|
| **Completo** | Lê/escreve no banco | `routes.ts`, `controller.ts`, `service.ts`, `repository.ts` |
| **Stateless** | Sem acesso a banco (`utils`, `tools`) | `routes.ts`, `controller.ts`, `service.ts` |

---

## Passo a passo

### 1. Criar pasta do módulo

```
src/modules/<nome>/
├── routes.ts
├── controller.ts
├── service.ts
└── repository.ts   # omitir se stateless
```

### 2. routes.ts — Plugin Fastify

```typescript
// src/modules/<nome>/routes.ts
import { FastifyInstance } from 'fastify'
import { listarNomeController, criarNomeController } from './controller.js'

export async function nomeRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }
  const security = [{ bearerAuth: [] }]

  fastify.get('/<nome>', {
    ...auth,
    schema: {
      tags: ['Nome'],
      summary: 'Listar itens',
      security,
    },
    handler: listarNomeController,
  })

  fastify.post('/<nome>', {
    ...auth,
    config: { rateLimit: { max: 10, timeWindow: 60_000 } },
    schema: {
      tags: ['Nome'],
      summary: 'Criar item',
      security,
      body: {
        type: 'object',
        required: ['campo'],
        properties: {
          campo: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            campo: { type: 'string' },
            created_at: { type: 'string' },
          },
        },
      },
    },
    handler: criarNomeController,
  })
}
```

### 3. controller.ts

```typescript
// src/modules/<nome>/controller.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { listarNomeService, criarNomeService } from './service.js'

export async function listarNomeController(request: FastifyRequest, reply: FastifyReply) {
  const itens = await listarNomeService(request.user.sub)
  return reply.send(itens)
}

export async function criarNomeController(request: FastifyRequest, reply: FastifyReply) {
  const { campo } = request.body as { campo: string }
  const item = await criarNomeService(campo, request.user.sub)
  return reply.code(201).send(item)
}
```

### 4. service.ts

```typescript
// src/modules/<nome>/service.ts
import { AppError } from '../../utils/app-error.js'
import { findTodosNome, createNome } from './repository.js'

export async function listarNomeService(usuarioId: number) {
  return findTodosNome(usuarioId)
}

export async function criarNomeService(campo: string, usuarioId: number) {
  // Exemplo de validação de negócio:
  // const existing = await findNomePorCampo(campo, usuarioId)
  // if (existing) throw new AppError(409, 'ALREADY_EXISTS', 'Item já existe')

  return createNome({ campo, usuario_id: usuarioId })
}
```

### 5. repository.ts (apenas módulos com banco)

```typescript
// src/modules/<nome>/repository.ts
import prisma from '../../plugins/prisma.js'

export async function findTodosNome(usuarioId: number) {
  return prisma.<tabela>.findMany({ where: { usuario_id: usuarioId } })
}

export async function createNome(data: { campo: string; usuario_id: number }) {
  return prisma.<tabela>.create({ data })
}
```

### 6. Registrar em app.ts

```typescript
// src/app.ts — adicionar junto aos outros imports e registers
import { nomeRoutes } from './modules/<nome>/routes.js'

// Na função buildApp(), após os outros registers:
await fastify.register(nomeRoutes)
```

---

## Checklist final

- [ ] Pasta criada em `src/modules/<nome>/`
- [ ] Plugin exportado com nome padrão `<nome>Routes`
- [ ] Todas as rotas têm `schema:` com pelo menos `tags` e `summary`
- [ ] Rotas protegidas têm `onRequest: [fastify.authenticate]` e `security`
- [ ] `prisma` importado **apenas** no `repository.ts`
- [ ] Erros usando `AppError` — nunca `new Error()`
- [ ] Módulo registrado em `src/app.ts`
- [ ] Se tiver model Prisma novo: criar migration com `npx prisma migrate dev --name <nome>`
