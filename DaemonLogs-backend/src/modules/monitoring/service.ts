import { AppError } from '../../utils/app-error.js'
import { validateToken, validateTokenAndGetUsername } from '../../selfbot/functions/validate-token.js'
import { startMonitoringAccount, stopMonitoringAccount } from '../../selfbot/functions/client-lifecycle.js'
import {
  findAllMonitoringByUser,
  findMonitoringById,
  createMonitoring,
  deleteMonitoring,
  updateMonitoringValidity,
  countActiveMonitoring,
} from './repository.js'

export async function listMonitoringService(usuarioId: number) {
  return findAllMonitoringByUser(usuarioId)
}

export async function addMonitoringService(token: string, usuarioId: number) {
  const validation = await validateTokenAndGetUsername(token)
  if (!validation.isValid) throw new AppError(422, 'INVALID_TOKEN', 'Token Discord inválido ou expirado')

  const account = await createMonitoring({ token, usuario_id: usuarioId, is_valid: true })

  // Inicia cliente selfbot em background passando o id para sincronizar servidores
  startMonitoringAccount(token, account.id).catch((err) =>
    console.error('[monitoring] Falha ao iniciar cliente:', err)
  )

  return { id: account.id, is_valid: account.is_valid, username: validation.username, created_at: account.created_at }
}

export async function deleteMonitoringService(id: number, usuarioId: number) {
  const account = await findMonitoringById(id, usuarioId)
  if (!account) throw new AppError(404, 'NOT_FOUND', 'Conta de monitoramento não encontrada')

  await stopMonitoringAccount(account.token)
  await deleteMonitoring(id, usuarioId)
}

export async function validateMonitoringService(id: number, usuarioId: number) {
  const account = await findMonitoringById(id, usuarioId)
  if (!account) throw new AppError(404, 'NOT_FOUND', 'Conta de monitoramento não encontrada')

  const isValid = await validateToken(account.token)
  await updateMonitoringValidity(id, isValid)

  return { id, is_valid: isValid }
}

export async function getMonitoringStatsService(usuarioId: number) {
  const [userAccounts, totalActive] = await Promise.all([
    findAllMonitoringByUser(usuarioId),
    countActiveMonitoring(),
  ])
  const myActive = userAccounts.filter((a) => a.is_valid).length
  return { my_active: myActive, total_active: totalActive }
}
