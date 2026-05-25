import { createClient, destroyClient, getAllClients } from '../client-manager.js'

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
