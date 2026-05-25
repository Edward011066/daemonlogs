import { AppError } from '../../utils/app-error.js'
import { PLAN_RULES } from '../../config/plan-rules.js'
import {
  findUserPlanInfo,
  countUserTargets,
  hasActiveMonitoring,
  findUsersWithUniqueServerCount,
  activateUserPremium,
} from './repository.js'

export function isPremiumActive(user: { is_premium: boolean; premium_expires_at: Date | null }): boolean {
  if (!user.is_premium || !user.premium_expires_at) return false
  return user.premium_expires_at > new Date()
}

/**
 * Garante que o usuário é premium ativo ou admin.
 * Admin sempre possui as mesmas permissões que premium.
 * Usar quando PLAN_RULES.<modulo>.premium_only === true.
 */
export async function assertPremiumOrAdmin(usuarioId: number): Promise<void> {
  const user = await findUserPlanInfo(usuarioId)
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado')
  if (user.is_admin || isPremiumActive(user)) return
  throw new AppError(403, 'PREMIUM_REQUIRED', 'Este recurso é exclusivo para usuários premium')
}

export async function assertCanAddTarget(usuarioId: number): Promise<void> {
  const user = await findUserPlanInfo(usuarioId)
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado')

  // Admin tem acesso irrestrito
  if (user.is_admin) return

  const premium = isPremiumActive(user)
  const rules = premium ? PLAN_RULES.premium : PLAN_RULES.freemium

  // Verificar cooldown de remoção (apenas freemium)
  if (!premium && user.last_target_removed_at && rules.cooldown_hours > 0) {
    const cooldownMs = rules.cooldown_hours * 60 * 60 * 1000
    const availableAt = new Date(user.last_target_removed_at.getTime() + cooldownMs)
    if (availableAt > new Date()) {
      throw new AppError(429, 'COOLDOWN_ACTIVE', `Aguarde até ${availableAt.toISOString()} para adicionar outra conta alvo`, {
        available_at: availableAt.toISOString(),
      })
    }
  }

  // Verificar limite de targets
  if (rules.max_targets !== Infinity) {
    const count = await countUserTargets(usuarioId)
    if (count >= rules.max_targets) {
      const availableAt = user.last_target_removed_at
        ? new Date(user.last_target_removed_at.getTime() + rules.cooldown_hours * 60 * 60 * 1000)
        : null
      throw new AppError(403, 'TARGET_LIMIT_REACHED', `Limite de ${rules.max_targets} contas alvo atingido para o plano freemium`, {
        available_at: availableAt?.toISOString() ?? null,
      })
    }
  }

  // Verificar conta de monitoramento ativa (apenas freemium)
  if (rules.requires_active_monitoring) {
    const active = await hasActiveMonitoring(usuarioId)
    if (!active) {
      throw new AppError(403, 'NO_ACTIVE_MONITORING', 'É necessário ter ao menos uma conta de monitoramento ativa para adicionar contas alvo')
    }
  }
}

export async function checkAllUsersServerCountPremium(): Promise<void> {
  if (!PLAN_RULES.server_count_premium.enabled) return

  const { min_unique_servers, premium_days } = PLAN_RULES.server_count_premium
  const users = await findUsersWithUniqueServerCount(min_unique_servers)

  for (const { usuario_id } of users) {
    const user = await findUserPlanInfo(usuario_id)
    if (!user) continue
    if (isPremiumActive(user)) continue

    const newExpires = new Date()
    newExpires.setDate(newExpires.getDate() + premium_days)
    await activateUserPremium(usuario_id, newExpires)
  }
}
