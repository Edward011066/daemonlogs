import { AppError } from '../../utils/app-error.js'
import { findAllTargetsByUser, findTargetByDiscordId, createTarget, deleteTarget, findTargetById } from './repository.js'
import { fetchDiscordUser } from '../../selfbot/functions/fetch-discord-user.js'
import { assertCanAddTarget } from '../plans/service.js'
import { updateUserLastTargetRemoved } from '../plans/repository.js'

export async function listTargetsService(usuarioId: number) {
  return findAllTargetsByUser(usuarioId)
}

export async function addTargetService(
  data: { discord_user_id: string },
  usuarioId: number
) {
  await assertCanAddTarget(usuarioId)

  const existing = await findTargetByDiscordId(data.discord_user_id, usuarioId)
  if (existing) throw new AppError(409, 'TARGET_ALREADY_EXISTS', 'Conta alvo já cadastrada')

  const discordUser = await fetchDiscordUser(data.discord_user_id)
  const username = discordUser?.username ?? data.discord_user_id
  const username_global = discordUser?.username_global ?? undefined

  return createTarget({ discord_user_id: data.discord_user_id, username, username_global, usuario_id: usuarioId })
}

export async function deleteTargetService(id: number, usuarioId: number) {
  const target = await findTargetById(id, usuarioId)
  if (!target) throw new AppError(404, 'NOT_FOUND', 'Conta alvo não encontrada')
  await deleteTarget(id, usuarioId)
  await updateUserLastTargetRemoved(usuarioId)
}
