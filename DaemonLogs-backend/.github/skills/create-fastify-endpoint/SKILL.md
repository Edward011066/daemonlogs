---
name: create-fastify-endpoint
description: "Use when: criar endpoint Fastify, adicionar rota, criar controller e service, implementar GET POST DELETE PATCH, adicionar endpoint autenticado, endpoint público, endpoint com body, endpoint com params, endpoint com querystring, rota com rate limit, rota com schema JSON Schema, rota protegida JWT, rota pública, novo endpoint no módulo existente."
argument-hint: "Descreva o endpoint: método HTTP, path, se precisa de JWT, body/params esperado e o que deve retornar."
user-invocable: true
---

# Skill: Criar Endpoint Fastify

Adiciona um endpoint completo (route + controller + service) seguindo o padrão obrigatório do DaemonLogs.

## Checklist de execução

1. Identificar o módulo alvo em `src/modules/<nome>/`
2. Adicionar rota em `routes.ts` com schema completo
3. Adicionar controller em `controller.ts`
4. Adicionar lógica no `service.ts`
5. Se precisar de banco: adicionar função no `repository.ts`

---

## Template de Route

```typescript
// src/modules/<nome>/routes.ts
fastify.post('/caminho', {
  onRequest: [fastify.authenticate],  // remover se rota pública
  config: {
    rateLimit: { max: 10, timeWindow: 60_000, ban: 2 }, // ajustar conforme risco
  },
  schema: {
    tags: ['NomeTag'],
    summary: 'Descrição curta da rota',
    security: [{ bearerAuth: [] }],  // remover se rota pública
    body: {                           // ou params/querystring — sempre incluir o que se aplica
      type: 'object',
      required: ['campo'],
      properties: {
        campo: { type: 'string', minLength: 1 },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          campo: { type: 'string' },
          created_at: { type: 'string' },
        },
      },
      // Adicionar códigos de erro esperados:
      404: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
    },
  },
  handler: nomeController,
})
```

## Template de Controller

```typescript
// src/modules/<nome>/controller.ts
export async function nomeController(request: FastifyRequest, reply: FastifyReply) {
  // Extrair SOMENTE dados do request — sem lógica aqui
  const { campo } = request.body as { campo: string }
  const usuarioId = request.user.sub  // disponível após fastify.authenticate

  const resultado = await nomeService(campo, usuarioId)
  return reply.code(200).send(resultado)
  // Códigos comuns: 200 (ok), 201 (criado), 204 (sem corpo), 202 (aceito, async)
}
```

## Template de Service

```typescript
// src/modules/<nome>/service.ts
import { AppError } from '../../utils/app-error.js'
import { findAlgo, createAlgo } from './repository.js'

export async function nomeService(campo: string, usuarioId: number) {
  // Guard de plano (se aplicável) — SEMPRE primeira linha
  // await assertCanAddTarget(usuarioId)

  const existing = await findAlgo(campo, usuarioId)
  if (existing) throw new AppError(409, 'ALREADY_EXISTS', 'Recurso já existe')

  return createAlgo({ campo, usuario_id: usuarioId })
}
```

## Template de Repository (se precisar de banco)

```typescript
// src/modules/<nome>/repository.ts
import prisma from '../../plugins/prisma.js'

export async function findAlgo(campo: string, usuarioId: number) {
  return prisma.tabela.findFirst({ where: { campo, usuario_id: usuarioId } })
}

export async function createAlgo(data: { campo: string; usuario_id: number }) {
  return prisma.tabela.create({ data })
}
```

---

## Decisões rápidas

| Situação | Ação |
|----------|------|
| Rota protegida | `onRequest: [fastify.authenticate]` + `security: [{ bearerAuth: [] }]` |
| Rota pública | Omitir `onRequest` e `security` |
| Webhook externo | Omitir `fastify.authenticate` + `schema: { hide: true }` |
| Retorna lista | `reply.code(200).send({ total, items })` |
| Cria recurso | `reply.code(201).send(resultado)` |
| Deleta | `reply.code(204).send()` |
| Operação async (background) | `reply.code(202).send({ message: 'Processo iniciado' })` |
| Rate limit alto risco (auth) | `max: 5-10, timeWindow: 5*60_000, ban: 2-3` |
| Rate limit operação custosa | `max: 3-5, timeWindow: 60*60_000, ban: 2` |

## Regras que nunca podem ser violadas

- `handler:` sempre dentro das opções — nunca como 3º argumento
- Toda rota com schema → Swagger funciona; sem schema → Swagger quebra
- `prisma` nunca importado fora de `repository.ts`
- Erros: sempre `AppError` com código semântico — nunca `new Error()`
- Lógica de negócio: sempre no `service` — nunca no `controller`
