import crypto from 'node:crypto'
import { FastifyRequest, FastifyReply } from 'fastify'
import { AUTH_CONFIG } from '../../config/auth-config.js'
import {
  loginService,
  registerService,
  logoutService,
  activateAccountService,
  resendActivationService,
  requestPasswordResetService,
  verifyResetCodeService,
  resetPasswordService,
  discordCallbackService,
} from './service.js'

export async function registerController(request: FastifyRequest, reply: FastifyReply) {
  const { username, password, email, referral_code } = request.body as {
    username: string
    password: string
    email: string
    referral_code?: string
  }
  const user = await registerService({ username, password, email, referral_code })
  return reply.code(201).send(user)
}

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const { username, password } = request.body as { username: string; password: string }
  const ip = request.ip
  const result = await loginService(username, password, ip, request.server)
  return reply.send(result)
}

export async function logoutController(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization ?? ''
  const token = authHeader.replace('Bearer ', '')
  await logoutService(token)
  return reply.send({ message: 'Logout realizado com sucesso' })
}

export async function activateController(request: FastifyRequest, reply: FastifyReply) {
  const { code } = request.body as { code: string }
  await activateAccountService(code)
  return reply.send({ message: 'Conta ativada com sucesso' })
}

export async function resendActivationController(request: FastifyRequest, reply: FastifyReply) {
  const { email } = request.body as { email: string }
  await resendActivationService(email)
  return reply.send({ message: 'Email de ativação reenviado' })
}

export async function requestPasswordResetController(request: FastifyRequest, reply: FastifyReply) {
  const { email } = request.body as { email: string }
  await requestPasswordResetService(email)
  return reply.send({ message: 'Se o email estiver cadastrado, o código de redefinição foi enviado' })
}

export async function verifyResetCodeController(request: FastifyRequest, reply: FastifyReply) {
  const { code } = request.body as { code: string }
  await verifyResetCodeService(code)
  return reply.send({ message: 'Código válido' })
}

export async function resetPasswordController(request: FastifyRequest, reply: FastifyReply) {
  const { code, new_password } = request.body as { code: string; new_password: string }
  await resetPasswordService(code, new_password)
  return reply.send({ message: 'Senha redefinida com sucesso' })
}

export async function discordOAuthController(_request: FastifyRequest, reply: FastifyReply) {
  const state = crypto.randomBytes(16).toString('hex')

  reply.setCookie('discord_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_CONFIG.discord.state_ttl_ms / 1000,
    path: '/',
  })

  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.discord.client_id,
    redirect_uri: AUTH_CONFIG.discord.redirect_uri,
    response_type: 'code',
    scope: AUTH_CONFIG.discord.scopes.join(' '),
    state,
  })

  return reply.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`)
}

export async function discordCallbackController(request: FastifyRequest, reply: FastifyReply) {
  const { code, state } = request.query as { code?: string; state?: string }

  if (!code || !state) {
    return reply.code(400).send({ error: 'INVALID_REQUEST', message: 'Parâmetros code e state são obrigatórios' })
  }

  const cookieState = (request.cookies as Record<string, string | undefined>).discord_oauth_state

  const { token, frontend_redirect } = await discordCallbackService(code, state, cookieState, request.server)

  reply.clearCookie('discord_oauth_state', { path: '/' })
  return reply.redirect(`${frontend_redirect}?token=${encodeURIComponent(token)}`)
}

