import { AppError } from '../../utils/app-error.js'
import { validateTokenWithUserInfo } from '../../selfbot/functions/validate-token.js'
import { fetchDiscordUser } from '../../selfbot/functions/fetch-discord-user.js'
import { findMyTokenByUser } from '../my-token/repository.js'
import { createUserClient, destroyUserClient } from '../../selfbot/functions/user-client.js'

async function getValidMyToken(usuarioId: number): Promise<string> {
  const myToken = await findMyTokenByUser(usuarioId)
  if (!myToken?.is_valid) {
    throw new AppError(403, 'NO_VALID_TOKEN', 'Adicione um token válido em POST /my-token/add antes de usar este recurso')
  }
  return myToken.token
}

export async function validateDiscordTokenService(token: string) {
  return validateTokenWithUserInfo(token)
}

export async function getDiscordUserService(discordUserId: string) {
  const user = await fetchDiscordUser(discordUserId)
  if (!user) {
    throw new AppError(503, 'NO_MONITORING_CLIENT', 'Nenhuma conta de monitoramento ativa disponível para buscar informações')
  }
  return user
}

export async function getGuildChannelsService(usuarioId: number, guildId: string) {
  const token = await getValidMyToken(usuarioId)
  const client = await createUserClient(token)
  try {
    const guild = client.guilds.cache.get(guildId)
    if (!guild) throw new AppError(404, 'GUILD_NOT_FOUND', 'Servidor não encontrado ou você não está nele')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channels = [...guild.channels.cache.values()].map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      position: c.rawPosition ?? 0,
      parent_id: c.parentId ?? null,
    }))

    return { guild_id: guild.id, guild_name: guild.name, channels }
  } finally {
    destroyUserClient(client)
  }
}

export async function getDmChannelsService(usuarioId: number) {
  const token = await getValidMyToken(usuarioId)
  const client = await createUserClient(token)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channels = [...client.channels.cache.values()]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => c.type === 'DM')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => ({
        id: c.id,
        recipient_id: c.recipient?.id ?? null,
        recipient_username: c.recipient?.username ?? null,
        recipient_global_name: c.recipient?.globalName ?? null,
        recipient_avatar: c.recipient?.avatar ?? null,
      }))

    return { channels }
  } finally {
    destroyUserClient(client)
  }
}
