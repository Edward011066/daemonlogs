import { findAllServers } from './repository.js'

export async function listServersService() {
  return findAllServers()
}
