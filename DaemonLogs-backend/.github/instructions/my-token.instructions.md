---
description: "Use when: criar módulo my-token, gerenciar token pessoal do Discord do usuário, adicionar token próprio, rotacionar token, deletar token my-token, cooldown my-token, tabela my_tokens, POST /my-token/add, DELETE /my-token/delete, PATCH /my-token/rotate, GET /my-token, token para automações, my_token_cooldown_hours, trabalhar em src/modules/my-token."
applyTo: "src/modules/my-token/**"
---

# Módulo my-token — Token Pessoal do Usuário Discord

## Conceito Fundamental

**`my_tokens` ≠ `contas_monitoramento`** — são tabelas com propósitos completamente distintos:

| | `contas_monitoramento` | `my_tokens` |
|---|---|---|
| **O quê** | Tokens de contas que observam outros usuários | Token pessoal do próprio usuário do sistema |
| **Usado em** | Sistema de monitoramento (client-manager) | Automações e ferramentas (`/tools/**`) |
| **Limite** | Múltiplos por usuário | **Exatamente 1 por usuário** |
| **Registrado no ClientManager** | Sim | **Nunca** |

## Regras de Negócio

1. **1 token por usuário** — `usuario_id @unique` na tabela `my_tokens`
2. **Validação obrigatória** — `validateToken()` deve ser chamado antes de salvar; rejeitar com 422 se inválido
3. **Cooldown de deleção/rotação** — após `is_valid = true`, deleção e rotação só permitidas após `PLAN_RULES.my_token_cooldown_hours` horas, medido a partir de `updated_at`
4. **Token não exposto no POST/PATCH** — respostas de criação/rotação retornam apenas metadados; `GET` retorna o token (é do próprio usuário)

## Model Prisma — my_tokens

```prisma
model my_tokens {
  id         Int      @id @default(autoincrement())
  token      String   @db.Text       // plain string — SEM hash, SEM criptografia
  is_valid   Boolean  @default(false)
  usuario_id Int      @unique        // constraint: 1 token por usuário
  usuario    usuarios @relation(fields: [usuario_id], references: [id], onDelete: Cascade)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt     // source of truth para cálculo de cooldown

  @@map("my_tokens")
}
```

> Adicionar `my_tokens my_tokens?` na relação do model `usuarios` em schema.prisma.

## Endpoints

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/my-token` | JWT | Retorna o token do usuário com todos os campos |
| POST | `/my-token/add` | JWT | Valida e salva token; 409 se já existe |
| DELETE | `/my-token/delete` | JWT | Remove o token; respeita cooldown |
| PATCH | `/my-token/rotate` | JWT | Valida e substitui o token; respeita cooldown |

## Cooldown — Função Obrigatória no Service

```typescript
// src/modules/my-token/service.ts
import { PLAN_RULES } from '../../config/plan-rules.js'

function assertCooldownRespected(myToken: { is_valid: boolean; updated_at: Date }): void {
  if (!myToken.is_valid) return  // token inválido não tem cooldown

  const cooldownMs = PLAN_RULES.my_token_cooldown_hours * 60 * 60 * 1000
  const liberadoEm = new Date(myToken.updated_at.getTime() + cooldownMs)

  if (liberadoEm > new Date()) {
    throw new AppError(429, 'COOLDOWN_ACTIVE', 'Token em cooldown. Aguarde antes de alterar.', {
      liberado_em: liberadoEm.toISOString(),
    })
  }
}
```

## Fluxo de Cada Endpoint

```
POST /my-token/add  { token: string }
  1. findMyTokenByUser(usuarioId) — se existir: 409 TOKEN_ALREADY_EXISTS
  2. validateToken(token) de selfbot/functions/validate-token.ts — se inválido: 422 INVALID_TOKEN
  3. createMyToken({ token, usuario_id, is_valid: true })
  4. Retornar 201 com { id, is_valid, created_at }  ← token NÃO incluído na resposta

GET /my-token
  1. findMyTokenByUser(usuarioId) — se não existir: 404 NOT_FOUND
  2. Retornar { id, token, is_valid, created_at, updated_at }  ← token incluído (é do próprio usuário)

DELETE /my-token/delete
  1. findMyTokenByUser(usuarioId) — se não existir: 404 NOT_FOUND
  2. assertCooldownRespected(myToken)
  3. deleteMyToken(usuarioId)
  4. 204 No Content

PATCH /my-token/rotate  { token: string }
  1. findMyTokenByUser(usuarioId) — se não existir: 404 NOT_FOUND
  2. assertCooldownRespected(myToken)
  3. validateToken(newToken) — se inválido: 422 INVALID_TOKEN
  4. updateMyToken(usuarioId, { token: newToken, is_valid: true })
  5. Retornar 200 com { id, is_valid, updated_at }  ← token NÃO incluído na resposta
```

## Repository — Funções Necessárias

```typescript
// src/modules/my-token/repository.ts
import prisma from '../../plugins/prisma.js'

export async function findMyTokenByUser(usuarioId: number) {
  return prisma.my_tokens.findUnique({ where: { usuario_id: usuarioId } })
}

export async function createMyToken(data: { token: string; usuario_id: number; is_valid: boolean }) {
  return prisma.my_tokens.create({ data })
}

export async function deleteMyToken(usuarioId: number) {
  return prisma.my_tokens.delete({ where: { usuario_id: usuarioId } })
}

export async function updateMyToken(usuarioId: number, data: { token: string; is_valid: boolean }) {
  return prisma.my_tokens.update({ where: { usuario_id: usuarioId }, data })
}
```

## PLAN_RULES — Chave a Adicionar em plan-rules.ts

```typescript
// src/config/plan-rules.ts — adicionar à exportação existente (ver premium.instructions.md)
my_token_cooldown_hours: 24,  // horas de cooldown antes de deletar/rotacionar my-token válido
```

## Erros Padronizados

| Situação | HTTP | Código |
|----------|------|--------|
| Já tem um token | 409 | `TOKEN_ALREADY_EXISTS` |
| Token Discord inválido | 422 | `INVALID_TOKEN` |
| Token não encontrado | 404 | `NOT_FOUND` |
| Em cooldown | 429 | `COOLDOWN_ACTIVE` + `liberado_em` |

## O que a IA NUNCA deve fazer

- Registrar o token do `my_tokens` no `ClientManager` como conta de monitoramento
- Hashear o token — armazenar plain string (mesma regra das `contas_monitoramento`)
- Permitir mais de 1 token por usuário — a constraint `@unique` no banco garante isso, mas o service deve retornar 409 antes de tentar inserir
- Ignorar cooldown quando `is_valid = true`
- Retornar o token Discord no corpo do POST `/my-token/add` ou PATCH `/my-token/rotate`
- Iniciar monitoramento de eventos Discord com este token — ele é exclusivo para tools
