import { createClient, destroyClient, getAllClients, getClient } from '../client-manager.js'

/**
 * Retorna o Discord user ID do cliente ativo associado ao token, ou null se não estiver conectado.
 */
export function getDiscordUserIdFromToken(token: string): string | null {
  return getClient(token)?.user?.id ?? null
}

export async function startMonitoringAccount(token: string, contaMonitoramentoId?: number): Promise<void> {
  await createClient(token, contaMonitoramentoId)
}

export async function stopMonitoringAccount(token: string): Promise<void> {
  await destroyClient(token)
}

export async function restartMonitoringAccount(token: string, contaMonitoramentoId?: number): Promise<void> {
  await destroyClient(token)
  await createClient(token, contaMonitoramentoId)
}

export function getActiveClientCount(): number {
  return getAllClients().size
}
