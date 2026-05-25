import { AppError } from '../../utils/app-error.js'
import { PLAN_RULES } from '../../config/plan-rules.js'
import { findMyTokenByUser } from '../my-token/repository.js'
import { createUserClient, destroyUserClient } from '../../selfbot/functions/user-client.js'
import { startProcess, cancelProcess, clearProcess } from '../../selfbot/functions/process-tracker.js'
import { AdaptiveDelay, deleteMessagesInChannel } from '../../selfbot/functions/delete-messages.js'
import { isPremiumActive } from '../plans/service.js'
import { findUserPlanInfo } from '../plans/repository.js'
import { findClearChatUsage, upsertClearChatUsage, incrementMessageCount } from './repository.js'

// ─── Verificação de permissão de plano ───────────────────────────────────────
interface PlanAccess {
  isPremium: boolean
  isAdmin: boolean
  remainingQuota: number | null // null = ilimitado
}

async function assertPlanPermission(usuarioId: number): Promise<PlanAccess> {
  const userPlan = await findUserPlanInfo(usuarioId)
  if (!userPlan) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado')

  const premium = isPremiumActive(userPlan)

  if (PLAN_RULES.clear_chat.premium_only && !premium && !userPlan.is_admin) {
    throw new AppError(403, 'PREMIUM_REQUIRED', 'Este recurso é exclusivo para usuários premium')
  }

  if (premium || userPlan.is_admin) {
    return { isPremium: premium, isAdmin: userPlan.is_admin, remainingQuota: null }
  }

  // Freemium: verificar quota do período atual
  const cooldownMs = PLAN_RULES.clear_chat.freemium_cooldown_hours * 60 * 60 * 1000
  const now = new Date()
  const usage = await findClearChatUsage(usuarioId)

  if (usage && new Date(usage.period_start_at.getTime() + cooldownMs) > now) {
    const remaining = PLAN_RULES.clear_chat.freemium_max_deletions - usage.messages_deleted
    if (remaining <= 0) {
      const periodEnd = new Date(usage.period_start_at.getTime() + cooldownMs)
      throw new AppError(
        429,
        'DELETION_LIMIT_REACHED',
        `Limite de ${PLAN_RULES.clear_chat.freemium_max_deletions} mensagens atingido. Aguarde até ${periodEnd.toISOString()}.`,
        { liberado_em: periodEnd.toISOString() },
      )
    }
    return { isPremium: false, isAdmin: false, remainingQuota: remaining }
  }

  // Período expirado ou sem registro — iniciar novo período
  await upsertClearChatUsage(usuarioId, { messages_deleted: 0, period_start_at: now })
  return { isPremium: false, isAdmin: false, remainingQuota: PLAN_RULES.clear_chat.freemium_max_deletions }
}

// ─── Helpers internos ────────────────────────────────────────────────────────
async function getValidToken(usuarioId: number): Promise<string> {
  const myToken = await findMyTokenByUser(usuarioId)
  if (!myToken?.is_valid) {
    throw new AppError(
      403,
      'NO_VALID_TOKEN',
      'Adicione um token válido em POST /my-token/add antes de usar automações',
    )
  }
  return myToken.token
}

async function trackDeletions(usuarioId: number, access: PlanAccess, deleted: number): Promise<void> {
  if (!access.isPremium && !access.isAdmin && deleted > 0) {
    await incrementMessageCount(usuarioId, deleted).catch(() => {})
  }
}

const TEXT_CHANNEL_TYPES = new Set(['GUILD_TEXT', 'GUILD_NEWS', 'GUILD_ANNOUNCEMENT', 'GUILD_FORUM'])

// ─── Tipos públicos ───────────────────────────────────────────────────────────
interface CommonParams {
  author_ids?: string[]
  min_id?: string
  max_id?: string
}

export interface ClearResult {
  deleted: number
  cancelled: boolean
}

// ─── Serviços públicos ────────────────────────────────────────────────────────
export function cancelClearChatService(usuarioId: number): boolean {
  return cancelProcess(usuarioId)
}

export async function clearChannelService(
  usuarioId: number,
  params: CommonParams & { channel_id: string },
): Promise<void> {
  const token = await getValidToken(usuarioId)
  const access = await assertPlanPermission(usuarioId)
  const controller = startProcess(usuarioId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any

  void (async () => {
    try {
      client = await createUserClient(token)
      const selfId = client.user!.id
      const channel = await client.channels.fetch(params.channel_id).catch(() => null)
      if (!channel) {
        console.error('[clearChannelService] Canal não encontrado:', params.channel_id)
        return
      }

      const delay = new AdaptiveDelay(PLAN_RULES.clear_chat.base_delete_delay_ms)
      const remaining = { value: access.remainingQuota }

      const deleted = await deleteMessagesInChannel(channel, {
        selfId,
        controller,
        delay,
        remaining,
        authorIds: params.author_ids ?? [],
        minId: params.min_id,
        maxId: params.max_id,
      })

      await trackDeletions(usuarioId, access, deleted)
    } catch (err) {
      console.error('[clearChannelService]', err)
    } finally {
      if (client) destroyUserClient(client)
      clearProcess(usuarioId)
    }
  })()
}

export async function clearServerService(
  usuarioId: number,
  params: CommonParams & { guild_id: string; ignored_channel_ids?: string[] },
): Promise<void> {
  const token = await getValidToken(usuarioId)
  const access = await assertPlanPermission(usuarioId)
  const controller = startProcess(usuarioId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any

  void (async () => {
    let totalDeleted = 0
    try {
      client = await createUserClient(token)
      const selfId = client.user!.id
      const guild = client.guilds.cache.get(params.guild_id)
      if (!guild) {
        console.error('[clearServerService] Servidor não encontrado:', params.guild_id)
        return
      }

      const ignoredIds = new Set(params.ignored_channel_ids ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const channels = [...guild.channels.cache.values()].filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => TEXT_CHANNEL_TYPES.has(c.type) && !ignoredIds.has(c.id),
      )

      const delay = new AdaptiveDelay(PLAN_RULES.clear_chat.base_delete_delay_ms)
      const remaining = { value: access.remainingQuota }

      for (const channel of channels) {
        if (controller.signal.aborted) break
        if (remaining.value !== null && remaining.value <= 0) break

        const deleted = await deleteMessagesInChannel(channel, {
          selfId,
          controller,
          delay,
          remaining,
          authorIds: params.author_ids ?? [],
          minId: params.min_id,
          maxId: params.max_id,
        })
        totalDeleted += deleted
      }

      await trackDeletions(usuarioId, access, totalDeleted)
    } catch (err) {
      console.error('[clearServerService]', err)
    } finally {
      if (client) destroyUserClient(client)
      clearProcess(usuarioId)
    }
  })()
}

export async function clearDmMessagesService(
  usuarioId: number,
  params: CommonParams & { ignored_channel_ids?: string[] },
): Promise<void> {
  const token = await getValidToken(usuarioId)
  const access = await assertPlanPermission(usuarioId)
  const controller = startProcess(usuarioId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any

  void (async () => {
    let totalDeleted = 0
    try {
      client = await createUserClient(token)
      const selfId = client.user!.id
      const ignoredIds = new Set(params.ignored_channel_ids ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dmChannels = [...client.channels.cache.values()].filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.type === 'DM' && !ignoredIds.has(c.id),
      )

      const delay = new AdaptiveDelay(PLAN_RULES.clear_chat.base_delete_delay_ms)
      const remaining = { value: access.remainingQuota }

      for (const channel of dmChannels) {
        if (controller.signal.aborted) break
        if (remaining.value !== null && remaining.value <= 0) break

        const deleted = await deleteMessagesInChannel(channel, {
          selfId,
          controller,
          delay,
          remaining,
          authorIds: params.author_ids ?? [],
          minId: params.min_id,
          maxId: params.max_id,
        })
        totalDeleted += deleted
      }

      await trackDeletions(usuarioId, access, totalDeleted)
    } catch (err) {
      console.error('[clearDmMessagesService]', err)
    } finally {
      if (client) destroyUserClient(client)
      clearProcess(usuarioId)
    }
  })()
}
