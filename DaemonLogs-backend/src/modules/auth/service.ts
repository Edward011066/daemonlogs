import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { FastifyInstance } from 'fastify'
import { AppError } from '../../utils/app-error.js'
import { validateEmailDomain } from '../../utils/email-validator.js'
import { sendActivationEmail, sendPasswordResetEmail } from '../../utils/email.js'
import { activateUserPremium } from '../plans/repository.js'
import { AUTH_CONFIG } from '../../config/auth-config.js'
import {
  findUsuarioByUsername,
  findUsuarioByEmail,
  findUsuarioByReferralCode,
  createUsuario,
  activateUsuario,
  incrementReferralCount,
  findActiveSession,
  deleteAllSessionsForUser,
  createSession,
  deleteSession,
  createEmailVerification,
  findEmailVerification,
  markEmailVerificationUsed,
  deleteOldVerificationsForUser,
  createPasswordReset,
  findPasswordReset,
  markPasswordResetUsed,
  deleteOldPasswordResetsForUser,
  updateUserPassword,
  upsertUsuarioByDiscordId,
} from './repository.js'

function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

function generateActivationCode(): string {
  return crypto.randomBytes(32).toString('hex')
}

async function createUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode()
    const existing = await findUsuarioByReferralCode(code)
    if (!existing) return code
  }
  return crypto.randomBytes(8).toString('hex').toUpperCase()
}

async function processReferral(referrerId: number): Promise<void> {
  const threshold = Number(process.env.REFERRAL_PREMIUM_THRESHOLD ?? 5)
  const updated = await incrementReferralCount(referrerId)

  if (updated.referral_count >= threshold) {
    const currentExpires = updated.premium_expires_at
    const base = currentExpires && currentExpires > new Date() ? currentExpires : new Date()
    const newExpires = new Date(base)
    newExpires.setDate(newExpires.getDate() + 30)
    await activateUserPremium(referrerId, newExpires)
  }
}

export async function registerService(data: {
  username: string
  password: string
  email: string
  referral_code?: string
}): Promise<{ id: number; username: string; email: string }> {
  const emailEnabled = process.env.EMAIL_ENABLED !== 'false'

  if (emailEnabled) {
    const domainCheck = validateEmailDomain(data.email)
    if (!domainCheck.valid) throw new AppError(422, 'INVALID_EMAIL_DOMAIN', domainCheck.reason!)
  }

  const existingUsername = await findUsuarioByUsername(data.username)
  if (existingUsername) throw new AppError(409, 'USERNAME_TAKEN', 'Username já está em uso')

  const existingEmail = await findUsuarioByEmail(data.email)
  if (existingEmail) throw new AppError(409, 'EMAIL_TAKEN', 'Email já está em uso')

  let referredById: number | undefined
  if (data.referral_code) {
    const referrer = await findUsuarioByReferralCode(data.referral_code)
    if (!referrer) throw new AppError(404, 'REFERRAL_NOT_FOUND', 'Código de indicação inválido')
    referredById = referrer.id
  }

  const hashed = await bcrypt.hash(data.password, AUTH_CONFIG.salt_rounds)
  const referralCode = await createUniqueReferralCode()
  const autoActivate = !emailEnabled

  const user = await createUsuario({
    username: data.username,
    password: hashed,
    email: data.email,
    is_activated: autoActivate,
    referral_code: referralCode,
    referred_by_id: referredById,
  })

  if (emailEnabled) {
    const ttlMinutes = Number(process.env.ACTIVATION_CODE_TTL_MINUTES ?? 60)
    const code = generateActivationCode()
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

    await createEmailVerification({ usuario_id: user.id, code, expires_at: expiresAt })
    await sendActivationEmail(data.email, code)
  }

  return { id: user.id, username: user.username, email: user.email }
}

export async function activateAccountService(code: string): Promise<void> {
  const verification = await findEmailVerification(code)

  if (!verification) throw new AppError(404, 'INVALID_CODE', 'Código de ativação inválido')
  if (verification.used) throw new AppError(409, 'CODE_ALREADY_USED', 'Código já utilizado')
  if (verification.expires_at < new Date()) throw new AppError(410, 'CODE_EXPIRED', 'Código de ativação expirado')

  await markEmailVerificationUsed(verification.id)
  await activateUsuario(verification.usuario_id)

  const user = await import('./repository.js').then((r) => r.findUsuarioById(verification.usuario_id))
  if (user?.referred_by_id) {
    await processReferral(user.referred_by_id)
  }
}

export async function resendActivationService(email: string): Promise<void> {
  if (process.env.EMAIL_ENABLED === 'false') {
    throw new AppError(400, 'EMAIL_DISABLED', 'Sistema de email desativado')
  }

  const user = await findUsuarioByEmail(email)
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Email não encontrado')
  if (user.is_activated) throw new AppError(409, 'ALREADY_ACTIVATED', 'Conta já está ativada')

  await deleteOldVerificationsForUser(user.id)

  const ttlMinutes = Number(process.env.ACTIVATION_CODE_TTL_MINUTES ?? 60)
  const code = generateActivationCode()
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

  await createEmailVerification({ usuario_id: user.id, code, expires_at: expiresAt })
  await sendActivationEmail(email, code)
}

export async function loginService(
  username: string,
  password: string,
  ip: string,
  fastify: FastifyInstance
): Promise<{ token: string; usuario: { id: number; username: string } }> {
  const user = await findUsuarioByUsername(username)
  if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciais inválidas')

  // Usuários Discord OAuth não possuem senha — rejeitar tentativa de login local
  if (!user.password) throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciais inválidas')

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciais inválidas')

  if (!user.is_activated) {
    throw new AppError(403, 'ACCOUNT_NOT_ACTIVATED', 'Conta não ativada. Verifique seu email.')
  }

  const sessaoAtiva = await findActiveSession(user.id)
  if (sessaoAtiva && sessaoAtiva.ip !== ip) {
    const liberadoEm = new Date(sessaoAtiva.created_at.getTime() + AUTH_CONFIG.session_ttl_ms)
    throw new AppError(403, 'IP_BLOCKED', 'IP bloqueado. Tente novamente após 24h.', {
      liberado_em: liberadoEm.toISOString(),
    })
  }

  await deleteAllSessionsForUser(user.id)

  const expiresAt = new Date(Date.now() + AUTH_CONFIG.session_ttl_ms)
  const jwtToken = fastify.jwt.sign({ sub: user.id, ip }, { expiresIn: '24h' })

  await createSession({ usuario_id: user.id, ip, jwt_token: jwtToken, expires_at: expiresAt })

  return { token: jwtToken, usuario: { id: user.id, username: user.username } }
}

export async function logoutService(jwtToken: string): Promise<void> {
  await deleteSession(jwtToken)
}

export async function requestPasswordResetService(email: string): Promise<void> {
  if (process.env.EMAIL_ENABLED === 'false') {
    throw new AppError(400, 'EMAIL_DISABLED', 'Sistema de email desativado')
  }

  const user = await findUsuarioByEmail(email)
  // Não revelar se o email existe ou não (previne enumeração de usuários)
  if (!user) return

  await deleteOldPasswordResetsForUser(user.id)

  const ttlMinutes = Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 15)
  const code = String(crypto.randomInt(100000, 1000000))
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

  await createPasswordReset({ usuario_id: user.id, code, expires_at: expiresAt })
  await sendPasswordResetEmail(email, code)
}

export async function verifyResetCodeService(code: string): Promise<void> {
  const reset = await findPasswordReset(code)
  if (!reset) throw new AppError(404, 'INVALID_CODE', 'Código inválido')
  if (reset.used) throw new AppError(409, 'CODE_ALREADY_USED', 'Código já utilizado')
  if (reset.expires_at < new Date()) throw new AppError(410, 'CODE_EXPIRED', 'Código expirado')
}

export async function resetPasswordService(code: string, newPassword: string): Promise<void> {
  const reset = await findPasswordReset(code)
  if (!reset) throw new AppError(404, 'INVALID_CODE', 'Código inválido')
  if (reset.used) throw new AppError(409, 'CODE_ALREADY_USED', 'Código já utilizado')
  if (reset.expires_at < new Date()) throw new AppError(410, 'CODE_EXPIRED', 'Código expirado')

  const hashed = await bcrypt.hash(newPassword, AUTH_CONFIG.salt_rounds)
  await markPasswordResetUsed(reset.id)
  await updateUserPassword(reset.usuario_id, hashed)
}

export async function discordCallbackService(
  code: string,
  state: string,
  cookieState: string | undefined,
  fastify: FastifyInstance
): Promise<{ token: string; frontend_redirect: string }> {
  // 1. Validar state CSRF
  if (!cookieState) {
    throw new AppError(400, 'INVALID_STATE', 'State OAuth2 inválido ou expirado')
  }
  const stateB = Buffer.from(state)
  const cookieB = Buffer.from(cookieState)
  if (stateB.length !== cookieB.length || !crypto.timingSafeEqual(stateB, cookieB)) {
    throw new AppError(400, 'INVALID_STATE', 'State OAuth2 inválido ou expirado')
  }

  // 2. Trocar code por access_token
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: AUTH_CONFIG.discord.client_id,
      client_secret: process.env.DISCORD_CLIENT_SECRET ?? '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: AUTH_CONFIG.discord.redirect_uri,
    }),
  })
  if (!tokenRes.ok) {
    throw new AppError(502, 'DISCORD_TOKEN_EXCHANGE_FAILED', 'Falha na troca de código Discord')
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string }

  // 3. Buscar perfil do usuário no Discord
  const meRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (!meRes.ok) {
    throw new AppError(502, 'DISCORD_PROFILE_FETCH_FAILED', 'Falha ao buscar perfil Discord')
  }
  const profile = (await meRes.json()) as {
    id: string
    username: string
    global_name?: string
    email?: string
  }

  // 4. Upsert do usuário por discord_id
  const referralCode = await createUniqueReferralCode()
  const user = await upsertUsuarioByDiscordId({
    discord_id: profile.id,
    username: profile.username,
    email: profile.email ?? null,
    referral_code: referralCode,
  })

  // 5. Invalidar sessões anteriores e criar nova
  await deleteAllSessionsForUser(user.id)
  const expiresAt = new Date(Date.now() + AUTH_CONFIG.session_ttl_ms)
  const jwtToken = fastify.jwt.sign({ sub: user.id, ip: 'discord_oauth' }, { expiresIn: '24h' })
  await createSession({ usuario_id: user.id, ip: 'discord_oauth', jwt_token: jwtToken, expires_at: expiresAt })

  return { token: jwtToken, frontend_redirect: AUTH_CONFIG.discord.frontend_redirect }
}

