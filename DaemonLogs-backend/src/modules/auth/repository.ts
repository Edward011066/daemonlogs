import prisma from '../../plugins/prisma.js'

export async function findUsuarioByUsername(username: string) {
  return prisma.usuarios.findUnique({ where: { username } })
}

export async function findUsuarioByEmail(email: string) {
  return prisma.usuarios.findUnique({ where: { email } })
}

export async function findUsuarioById(id: number) {
  return prisma.usuarios.findUnique({ where: { id } })
}

export async function findUsuarioByReferralCode(code: string) {
  return prisma.usuarios.findUnique({ where: { referral_code: code }, select: { id: true } })
}

export async function createUsuario(data: {
  username: string
  password?: string | null
  email?: string | null
  is_activated: boolean
  referral_code: string
  referred_by_id?: number
  discord_id?: string | null
}) {
  return prisma.usuarios.create({ data })
}

export async function upsertUsuarioByDiscordId(data: {
  discord_id: string
  username: string
  email?: string | null
  referral_code: string
}) {
  return prisma.usuarios.upsert({
    where: { discord_id: data.discord_id },
    update: { username: data.username },
    create: {
      discord_id: data.discord_id,
      username: data.username,
      email: data.email ?? null,
      password: null,
      is_activated: true,
      referral_code: data.referral_code,
    },
  })
}

export async function activateUsuario(id: number) {
  return prisma.usuarios.update({ where: { id }, data: { is_activated: true } })
}

export async function incrementReferralCount(usuarioId: number) {
  return prisma.usuarios.update({
    where: { id: usuarioId },
    data: { referral_count: { increment: 1 } },
    select: { referral_count: true, is_premium: true, premium_expires_at: true },
  })
}

export async function findActiveSession(usuarioId: number) {
  return prisma.sessions.findFirst({
    where: {
      usuario_id: usuarioId,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: 'desc' },
  })
}

export async function deleteAllSessionsForUser(usuarioId: number) {
  return prisma.sessions.deleteMany({ where: { usuario_id: usuarioId } })
}

export async function createSession(data: {
  usuario_id: number
  ip: string
  jwt_token: string
  expires_at: Date
}) {
  return prisma.sessions.create({ data })
}

export async function deleteSession(jwtToken: string) {
  return prisma.sessions.deleteMany({ where: { jwt_token: jwtToken } })
}

export async function findValidTokensForUser(usuarioId: number) {
  return prisma.contas_monitoramento.findMany({
    where: { usuario_id: usuarioId, is_valid: true },
    select: { id: true, token: true },
  })
}

export async function markTokenInvalid(tokenId: number) {
  return prisma.contas_monitoramento.update({
    where: { id: tokenId },
    data: { is_valid: false },
  })
}

export async function createEmailVerification(data: {
  usuario_id: number
  code: string
  expires_at: Date
}) {
  return prisma.email_verifications.create({ data })
}

export async function findEmailVerification(code: string) {
  return prisma.email_verifications.findUnique({ where: { code } })
}

export async function markEmailVerificationUsed(id: number) {
  return prisma.email_verifications.update({ where: { id }, data: { used: true } })
}

export async function deleteOldVerificationsForUser(usuarioId: number) {
  return prisma.email_verifications.deleteMany({ where: { usuario_id: usuarioId } })
}

export async function createPasswordReset(data: {
  usuario_id: number
  code: string
  expires_at: Date
}) {
  return prisma.password_resets.create({ data })
}

export async function findPasswordReset(code: string) {
  return prisma.password_resets.findUnique({ where: { code } })
}

export async function markPasswordResetUsed(id: number) {
  return prisma.password_resets.update({ where: { id }, data: { used: true } })
}

export async function deleteOldPasswordResetsForUser(usuarioId: number) {
  return prisma.password_resets.deleteMany({ where: { usuario_id: usuarioId } })
}

export async function updateUserPassword(usuarioId: number, hashedPassword: string) {
  return prisma.usuarios.update({ where: { id: usuarioId }, data: { password: hashedPassword } })
}

