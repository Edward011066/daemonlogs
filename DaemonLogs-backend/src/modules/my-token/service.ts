import { AppError } from '../../utils/app-error.js'
import { PLAN_RULES } from '../../config/plan-rules.js'
import { validateToken } from '../../selfbot/functions/validate-token.js'
import { findMyTokenByUser, createMyToken, deleteMyToken, updateMyToken } from './repository.js'

function assertCooldownRespected(myToken: { is_valid: boolean; updated_at: Date }): void {
  if (!myToken.is_valid) return

  const cooldownMs = PLAN_RULES.my_token_cooldown_hours * 60 * 60 * 1000
  const liberadoEm = new Date(myToken.updated_at.getTime() + cooldownMs)

  if (liberadoEm > new Date()) {
    throw new AppError(429, 'COOLDOWN_ACTIVE', 'Token em cooldown. Aguarde antes de alterar.', {
      liberado_em: liberadoEm.toISOString(),
    })
  }
}

export async function getMyTokenService(usuarioId: number) {
  const myToken = await findMyTokenByUser(usuarioId)
  if (!myToken) throw new AppError(404, 'NOT_FOUND', 'Nenhum token cadastrado')
  return myToken
}

export async function addMyTokenService(usuarioId: number, token: string) {
  const existing = await findMyTokenByUser(usuarioId)
  if (existing) throw new AppError(409, 'TOKEN_ALREADY_EXISTS', 'Você já possui um token cadastrado. Use PATCH /my-token/rotate para substituí-lo.')

  const valid = await validateToken(token)
  if (!valid) throw new AppError(422, 'INVALID_TOKEN', 'Token Discord inválido ou expirado')

  return createMyToken({ token, usuario_id: usuarioId, is_valid: true })
}

export async function deleteMyTokenService(usuarioId: number) {
  const myToken = await findMyTokenByUser(usuarioId)
  if (!myToken) throw new AppError(404, 'NOT_FOUND', 'Nenhum token cadastrado')

  assertCooldownRespected(myToken)
  await deleteMyToken(usuarioId)
}

export async function rotateMyTokenService(usuarioId: number, newToken: string) {
  const myToken = await findMyTokenByUser(usuarioId)
  if (!myToken) throw new AppError(404, 'NOT_FOUND', 'Nenhum token cadastrado. Use POST /my-token/add para adicionar.')

  assertCooldownRespected(myToken)

  const valid = await validateToken(newToken)
  if (!valid) throw new AppError(422, 'INVALID_TOKEN', 'Token Discord inválido ou expirado')

  return updateMyToken(usuarioId, { token: newToken, is_valid: true })
}
