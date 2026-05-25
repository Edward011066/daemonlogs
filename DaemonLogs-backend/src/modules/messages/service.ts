import { findMessagesByUserTarget } from './repository.js'

export async function listMessagesService(
  usuarioId: number,
  discordUserId?: string,
  page = 1
) {
  return findMessagesByUserTarget(usuarioId, discordUserId, page)
}
