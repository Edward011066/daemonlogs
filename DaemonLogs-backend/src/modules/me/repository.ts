import prisma from '../../plugins/prisma.js'

export async function findMeProfile(usuarioId: number) {
  return prisma.usuarios.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      username: true,
      email: true,
      is_premium: true,
      is_admin: true,
      premium_expires_at: true,
      referral_code: true,
      referral_count: true,
      created_at: true,
      clear_chat_usage: {
        select: { messages_deleted: true, period_start_at: true },
      },
      my_token: {
        select: { is_valid: true },
      },
    },
  })
}

export async function findReferrals(usuarioId: number) {
  return prisma.usuarios.findMany({
    where: { referred_by_id: usuarioId },
    select: { username: true, created_at: true },
    orderBy: { created_at: 'desc' },
  })
}

export async function findPasswordById(usuarioId: number) {
  return prisma.usuarios.findUnique({
    where: { id: usuarioId },
    select: { password: true },
  })
}

export async function updatePassword(usuarioId: number, newPasswordHash: string) {
  return prisma.usuarios.update({
    where: { id: usuarioId },
    data: { password: newPasswordHash },
    select: { id: true },
  })
}
