import { findEventsByUser } from './repository.js'

export async function listEventsService(
  usuarioId: number,
  discordUserId?: string,
  tipo?: string,
  page = 1,
  limit = 50,
  from?: string,
  to?: string,
) {
  return findEventsByUser(usuarioId, discordUserId, tipo, page, limit, from ? new Date(from) : undefined, to ? new Date(to) : undefined)
}
