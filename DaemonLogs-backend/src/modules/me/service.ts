import bcrypt from 'bcrypt'
import { AppError } from '../../utils/app-error.js'
import { PLAN_RULES } from '../../config/plan-rules.js'
import { isPremiumActive } from '../plans/service.js'
import { findMeProfile, findReferrals, findPasswordById, updatePassword } from './repository.js'

export async function getMeService(usuarioId: number) {
  const user = await findMeProfile(usuarioId)
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado')

  const premium = isPremiumActive(user)
  const plan = user.is_admin ? 'admin' : premium ? 'premium' : 'freemium'

  type ClearChatStatus = {
    messages_deleted: number | null
    messages_remaining: number | null
    period_start_at: string | null
    period_resets_at: string | null
  }

  let clearChat: ClearChatStatus

  if (premium || user.is_admin) {
    clearChat = { messages_deleted: null, messages_remaining: null, period_start_at: null, period_resets_at: null }
  } else {
    const cooldownMs = PLAN_RULES.clear_chat.freemium_cooldown_hours * 60 * 60 * 1000
    const now = new Date()
    const usage = user.clear_chat_usage

    if (usage && new Date(usage.period_start_at.getTime() + cooldownMs) > now) {
      const remaining = Math.max(0, PLAN_RULES.clear_chat.freemium_max_deletions - usage.messages_deleted)
      const periodResetsAt = new Date(usage.period_start_at.getTime() + cooldownMs)
      clearChat = {
        messages_deleted: usage.messages_deleted,
        messages_remaining: remaining,
        period_start_at: usage.period_start_at.toISOString(),
        period_resets_at: periodResetsAt.toISOString(),
      }
    } else {
      clearChat = {
        messages_deleted: 0,
        messages_remaining: PLAN_RULES.clear_chat.freemium_max_deletions,
        period_start_at: null,
        period_resets_at: null,
      }
    }
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    plan,
    is_admin: user.is_admin,
    premium_expires_at: user.premium_expires_at?.toISOString() ?? null,
    referral_code: user.referral_code,
    referral_count: user.referral_count,
    created_at: user.created_at.toISOString(),
    my_token: {
      has_token: user.my_token !== null,
      is_valid: user.my_token?.is_valid ?? false,
    },
    clear_chat: clearChat,
    discord_login: user.discord_id !== null,
  }
}

export async function getReferralsService(usuarioId: number) {
  const items = await findReferrals(usuarioId)
  return { items, total: items.length }
}

export async function changePasswordService(
  usuarioId: number,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await findPasswordById(usuarioId)
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado')

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) throw new AppError(401, 'INVALID_PASSWORD', 'Senha atual incorreta')

  const hash = await bcrypt.hash(newPassword, 12)
  await updatePassword(usuarioId, hash)
}
