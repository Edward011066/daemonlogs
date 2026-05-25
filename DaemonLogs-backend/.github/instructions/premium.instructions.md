---
description: "Use when: implementar freemium, premium, plano de usuário, PLAN_RULES, limite de contas alvo, cooldown de remoção, verificar permissão de adicionar target, assertCanAddTarget, is_premium, premium_expires_at, last_target_removed_at, server_count_premium, verificar servidores únicos, premium automático, checkAllUsersServerCountPremium, my_token_cooldown_hours, cooldown my-token, clear_chat, quota de exclusão, freemium_max_deletions, DELETION_LIMIT_REACHED, exclusão de mensagens, assertPlanPermission, trabalhar em src/modules/plans, src/modules/targets, src/modules/monitoring, src/config, src/modules/clear-chat."
applyTo: "src/modules/targets/**, src/modules/monitoring/**, src/modules/plans/**, src/config/**"
---

# Sistema de Planos — Freemium / Premium

## Configuração Central — PLAN_RULES

Todos os limites e regras de plano ficam em `src/config/plan-rules.ts`. **Nunca hardcode limites fora deste arquivo.**

```typescript
// src/config/plan-rules.ts
export const PLAN_RULES = {
  freemium: {
    max_targets: 3,              // limite de contas alvo
    cooldown_hours: 24,          // horas de cooldown após remover alvo
    requires_active_monitoring: true,  // precisa de conta is_valid=true para adicionar alvos
  },
  premium: {
    max_targets: Infinity,
    cooldown_hours: 0,
    requires_active_monitoring: false,
  },
  // Premia automaticamente usuários que monitoram muitos servidores únicos
  server_count_premium: {
    enabled: true,              // false = desativa a regra sem precisar mexer na lógica
    min_unique_servers: 10,     // mínimo de servidores únicos (guild_id distinct) para ganhar premium
    premium_days: 30,           // dias de premium concedidos automaticamente
  },
  // Cooldown do token pessoal do usuário (my-token)
  my_token_cooldown_hours: 24,  // horas antes de poder deletar ou rotacionar my-token válido
  // Configuração do módulo clear-chat (exclusão em massa de mensagens)
  clear_chat: {
    premium_only: false,          // freemium também pode usar
    freemium_max_deletions: 500,  // mensagens excluídas por período
    freemium_cooldown_hours: 24,  // janela do período (horas)
    base_delete_delay_ms: 600,    // delay base entre exclusões (simula comportamento humano)
    search_delay_ms: 1000,        // delay entre buscas de batch
  },
} as const
```

## Módulo Plans — Estrutura

```
src/modules/plans/
├── repository.ts   # Queries de verificação de plano (findUserPlanInfo, countUserTargets, etc.)
└── service.ts      # assertCanAddTarget, isPremiumActive
```

> Não tem `routes.ts` — é um módulo interno chamado pelos services de outros módulos.

## Verificação de Premium — Regra Obrigatória

**Nunca usar `is_premium` sozinho.** O campo `is_premium` é auxiliar; o source of truth é `premium_expires_at`:

```typescript
// src/modules/plans/service.ts
export function isPremiumActive(user: {
  is_premium: boolean
  premium_expires_at: Date | null
}): boolean {
  return user.is_premium && user.premium_expires_at != null && user.premium_expires_at > new Date()
}
```

## Guard Principal: assertCanAddTarget

Chamar **sempre como primeira linha** de `addTargetService`:

```typescript
// src/modules/plans/service.ts
import { PLAN_RULES } from '../../config/plan-rules.js'
import { findUserPlanInfo, countUserTargets, hasActiveMonitoring } from './repository.js'
import { AppError } from '../../utils/app-error.js'

export async function assertCanAddTarget(usuarioId: number): Promise<void> {
  const user = await findUserPlanInfo(usuarioId)
  const rules = isPremiumActive(user) ? PLAN_RULES.premium : PLAN_RULES.freemium

  // 1. Cooldown pós-remoção (freemium: 24h)
  if (rules.cooldown_hours > 0 && user.last_target_removed_at) {
    const cooldownMs = rules.cooldown_hours * 60 * 60 * 1000
    const cooldownEnd = new Date(user.last_target_removed_at.getTime() + cooldownMs)
    if (cooldownEnd > new Date()) {
      throw new AppError(429, 'COOLDOWN_ACTIVE', 'Aguarde antes de adicionar outra conta alvo', {
        liberado_em: cooldownEnd.toISOString(),
      })
    }
  }

  // 2. Limite máximo de contas alvo
  if (rules.max_targets !== Infinity) {
    const count = await countUserTargets(usuarioId)
    if (count >= rules.max_targets) {
      throw new AppError(403, 'TARGET_LIMIT_REACHED',
        `Plano freemium: limite de ${rules.max_targets} contas alvo atingido`)
    }
  }

  // 3. Conta de monitoramento ativa obrigatória (apenas freemium)
  if (rules.requires_active_monitoring) {
    const hasActive = await hasActiveMonitoring(usuarioId)
    if (!hasActive) {
      throw new AppError(403, 'NO_ACTIVE_MONITORING',
        'Adicione uma conta de monitoramento válida antes de monitorar alvos')
    }
  }
}
```

## Integração nos Services Existentes

### targets/service.ts — guard no início de addTargetService

```typescript
import { assertCanAddTarget } from '../plans/service.js'

export async function addTargetService(data: { discord_user_id: string }, usuarioId: number) {
  await assertCanAddTarget(usuarioId)  // SEMPRE PRIMEIRO — antes de qualquer outra operação
  // ...lógica de criar target
}
```

### targets/service.ts — atualizar cooldown após deletar

```typescript
import { updateUserLastTargetRemoved } from '../plans/repository.js'

export async function deleteTargetService(id: number, usuarioId: number) {
  // ...lógica existente de delete...
  await updateUserLastTargetRemoved(usuarioId) // registra timestamp para cooldown freemium
}
```

## Repository Plans — Queries Necessárias

```typescript
// src/modules/plans/repository.ts
import prisma from '../../plugins/prisma.js'

export async function findUserPlanInfo(usuarioId: number) {
  return prisma.usuarios.findUniqueOrThrow({
    where: { id: usuarioId },
    select: { is_premium: true, is_admin: true, premium_expires_at: true, last_target_removed_at: true },
  })
}

export async function countUserTargets(usuarioId: number): Promise<number> {
  return prisma.contas_alvos.count({ where: { usuario_id: usuarioId } })
}

export async function hasActiveMonitoring(usuarioId: number): Promise<boolean> {
  const count = await prisma.contas_monitoramento.count({
    where: { usuario_id: usuarioId, is_valid: true },
  })
  return count > 0
}

export async function updateUserLastTargetRemoved(usuarioId: number): Promise<void> {
  await prisma.usuarios.update({
    where: { id: usuarioId },
    data: { last_target_removed_at: new Date() },
  })
}

export async function activateUserPremium(usuarioId: number, expiresAt: Date): Promise<void> {
  await prisma.usuarios.update({
    where: { id: usuarioId },
    data: { is_premium: true, premium_expires_at: expiresAt },
  })
}

export async function deactivateUserPremium(usuarioId: number): Promise<void> {
  await prisma.usuarios.update({
    where: { id: usuarioId },
    data: { is_premium: false, premium_expires_at: null },
  })
}
```

## Regra Automática: server_count_premium

Usurios com muitos servidores únicos monitorados ganham premium automaticamente. A lógica fica em `src/modules/plans/service.ts` e é executada no startup do servidor e diariamente.

### Query de contagem de servidores únicos

```typescript
// src/modules/plans/repository.ts
export async function findUsersWithUniqueServerCount(minServers: number) {
  // Contar servidores únicos por guild_id em TODAS as contas de monitoramento do usuário
  const result = await prisma.$queryRaw<{ usuario_id: number; unique_servers: bigint }[]>`
    SELECT cm.usuario_id, COUNT(DISTINCT s.guild_id) as unique_servers
    FROM servidores s
    JOIN contas_monitoramento cm ON s.conta_monitoramento_id = cm.id
    GROUP BY cm.usuario_id
    HAVING COUNT(DISTINCT s.guild_id) >= ${minServers}
  `
  return result.map(r => ({ usuario_id: r.usuario_id, unique_servers: Number(r.unique_servers) }))
}
```

### Função de verificação periódica

```typescript
// src/modules/plans/service.ts
export async function checkAllUsersServerCountPremium(): Promise<void> {
  if (!PLAN_RULES.server_count_premium.enabled) return

  const { min_unique_servers, premium_days } = PLAN_RULES.server_count_premium
  const users = await findUsersWithUniqueServerCount(min_unique_servers)

  for (const { usuario_id } of users) {
    const user = await findUserPlanInfo(usuario_id)
    if (!user) continue

    // Não sobrescrever premium pago (premium_expires_at mais longe no futuro)
    if (isPremiumActive(user)) continue

    const newExpires = new Date()
    newExpires.setDate(newExpires.getDate() + premium_days)
    await activateUserPremium(usuario_id, newExpires)
  }
}
```

### Registro no servidor (src/server.ts)

```typescript
import { checkAllUsersServerCountPremium } from './modules/plans/service.js'

// Rodar no startup e diariamente
void checkAllUsersServerCountPremium()
setInterval(() => void checkAllUsersServerCountPremium(), 24 * 60 * 60 * 1000)
```

- Colocar verificações de limite no controller — sempre no service via `assertCanAddTarget`
- Usar `is_premium` como única verificação — sempre checar `premium_expires_at > new Date()`
- Hardcodar limites (ex: `3`, `24`) fora de `src/config/plan-rules.ts`
- Importar `prisma` diretamente em `plans/service.ts` — usar `plans/repository.ts`
- Esquecer de chamar `updateUserLastTargetRemoved` após deletar um target (freemium perde o cooldown)
- Chamar `assertCanAddTarget` após criar o registro — deve ser antes de qualquer operação de banco
