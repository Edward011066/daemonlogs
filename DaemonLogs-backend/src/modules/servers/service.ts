import { AppError } from '../../utils/app-error.js'
import { findAllServers, findServerByGuildId } from './repository.js'

export async function listServersService() {
  return findAllServers()
}

export async function checkServerService(guildId: string) {
  const server = await findServerByGuildId(guildId)
  if (!server) throw new AppError(404, 'NOT_FOUND', 'Servidor não encontrado na base de monitoramento')
  return { monitored: true, server }
}
