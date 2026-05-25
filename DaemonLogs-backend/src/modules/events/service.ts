import { findEventsByUser, findMessagesSentByUser } from './repository.js'

export async function listEventsService(
  usuarioId: number,
  discordUserId?: string,
  tipo?: string,
  page = 1,
  limit = 50,
  from?: string,
  to?: string,
) {
  const fromDate = from ? new Date(from) : undefined
  const toDate = to ? new Date(to) : undefined

  if (tipo === 'MESSAGE_SENT') {
    return findMessagesSentByUser(usuarioId, discordUserId, page, limit, fromDate, toDate)
  }

  return findEventsByUser(usuarioId, discordUserId, tipo, page, limit, fromDate, toDate)
}
