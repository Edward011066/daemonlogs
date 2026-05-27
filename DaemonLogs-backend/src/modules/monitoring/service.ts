import { AppError } from '../../utils/app-error.js'
import { validateTokenAndGetUsername } from '../../selfbot/functions/validate-token.js'
import { startMonitoringAccount, stopMonitoringAccount } from '../../selfbot/functions/client-lifecycle.js'
import {
  findAllMonitoringByUser,
  findMonitoringById,
  createMonitoring,
  deleteMonitoring,
  updateMonitoringValidity,
  updateMonitoringUsername,
  countActiveMonitoring,
} from './repository.js'

export async function listMonitoringService(usuarioId: number) {
  const accounts = await findAllMonitoringByUser(usuarioId)

  return Promise.all(
    accounts.map(async (account) => {
      if (account.username) {
        return {
          id: account.id,
          is_valid: account.is_valid,
          username: account.username,
          created_at: account.created_at,
        }
      }

      const validation = await validateTokenAndGetUsername(account.token)
      if (validation.isValid) {
        await updateMonitoringUsername(account.id, validation.username)
      }

      return {
        id: account.id,
        is_valid: account.is_valid,
        username: validation.isValid ? validation.username : null,
        created_at: account.created_at,
      }
    }),
  )
}

export async function addMonitoringService(token: string, usuarioId: number) {
  const validation = await validateTokenAndGetUsername(token)
  if (!validation.isValid) throw new AppError(422, 'INVALID_TOKEN', 'Token Discord inválido ou expirado')

  const account = await createMonitoring({
    token,
    username: validation.username,
    usuario_id: usuarioId,
    is_valid: true,
  })

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

  const validation = await validateTokenAndGetUsername(account.token)
  await updateMonitoringValidity(id, validation.isValid)

  if (validation.isValid) {
    await updateMonitoringUsername(id, validation.username)
  }

  return { id, is_valid: validation.isValid }
}

export async function getMonitoringStatsService(usuarioId: number) {
  const [userAccounts, totalActive] = await Promise.all([
    findAllMonitoringByUser(usuarioId),
    countActiveMonitoring(),
  ])
  const myActive = userAccounts.filter((a) => a.is_valid).length
  return { my_active: myActive, total_active: totalActive }
}
