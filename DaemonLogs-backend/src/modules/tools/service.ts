import { AppError } from '../../utils/app-error.js'
import { findMyTokenByUser } from '../my-token/repository.js'
import { createUserClient, destroyUserClient } from '../../selfbot/functions/user-client.js'
import { startProcess, cancelProcess, clearProcess, hasActiveProcess } from '../../selfbot/functions/process-tracker.js'
import { PLAN_RULES } from '../../config/plan-rules.js'
import { assertPremiumOrAdmin } from '../plans/service.js'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function getValidMyToken(usuarioId: number): Promise<string> {
  const myToken = await findMyTokenByUser(usuarioId)
  if (!myToken?.is_valid) {
    throw new AppError(403, 'NO_VALID_TOKEN', 'Adicione um token válido em POST /my-token/add antes de usar automações')
  }
  return myToken.token
}

export function cancelCurrentProcessService(usuarioId: number): boolean {
  return cancelProcess(usuarioId)
}

export function getAutomationStatusService(usuarioId: number): { active: boolean } {
  return { active: hasActiveProcess(usuarioId) }
}

export async function closeDmsService(
  usuarioId: number,
  ignoredChannelIds: string[],
): Promise<void> {
  if (PLAN_RULES.tools.premium_only) await assertPremiumOrAdmin(usuarioId)
  const token = await getValidMyToken(usuarioId)
  const controller = startProcess(usuarioId)

  void (async () => {
    let client
    try {
      client = await createUserClient(token)
      const dmChannels = [...client.channels.cache.values()].filter((c) => c.type === 'DM')

      for (const channel of dmChannels) {
        if (controller.signal.aborted) break
        if (ignoredChannelIds.includes(channel.id)) continue

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (channel as any).delete()
        } catch { /* já fechado ou sem permissão */ }

        await sleep(PLAN_RULES.tools.action_delay_ms)
      }
    } catch (err) {
      console.error('[closeDmsService]', err)
    } finally {
      if (client) destroyUserClient(client)
      clearProcess(usuarioId)
    }
  })()
}

export async function leaveServersService(
  usuarioId: number,
  ignoredGuildIds: string[],
): Promise<void> {
  if (PLAN_RULES.tools.premium_only) await assertPremiumOrAdmin(usuarioId)
  const token = await getValidMyToken(usuarioId)
  const controller = startProcess(usuarioId)

  void (async () => {
    let client
    try {
      client = await createUserClient(token)
      const guilds = [...client.guilds.cache.values()]

      for (const guild of guilds) {
        if (controller.signal.aborted) break
        if (ignoredGuildIds.includes(guild.id)) continue

        try {
          await guild.leave()
        } catch { /* sem permissão ou já saiu */ }

        await sleep(PLAN_RULES.tools.action_delay_ms)
      }
    } catch (err) {
      console.error('[leaveServersService]', err)
    } finally {
      if (client) destroyUserClient(client)
      clearProcess(usuarioId)
    }
  })()
}

export async function deleteRelationshipsService(
  usuarioId: number,
  ignoredUserIds: string[],
): Promise<void> {
  if (PLAN_RULES.tools.premium_only) await assertPremiumOrAdmin(usuarioId)
  const token = await getValidMyToken(usuarioId)
  const controller = startProcess(usuarioId)

  void (async () => {
    let client
    try {
      client = await createUserClient(token)
      // relationships.cache: Map<Snowflake, RelationshipType> onde 1 = FRIEND
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const relationships = (client as any).relationships?.cache as Map<string, number> | undefined

      if (relationships) {
        for (const [userId, relType] of relationships) {
          if (controller.signal.aborted) break
          if (relType !== 1) continue // 1 = FRIEND; ignora blocked/pending
          if (ignoredUserIds.includes(userId)) continue

          try {
            // discord.js-selfbot-v13 lança erro intencional em deleteRelationship
            // ("Risky action, not finished yet."), então chamamos a API interna diretamente.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (client as any).api.users['@me'].relationships[userId].delete({
              DiscordContext: { location: 'ContextMenu' },
            })
          } catch { /* sem permissão ou já removido */ }

          await sleep(PLAN_RULES.tools.action_delay_ms)
        }
      }
    } catch (err) {
      console.error('[deleteRelationshipsService]', err)
    } finally {
      if (client) destroyUserClient(client)
      clearProcess(usuarioId)
    }
  })()
}
