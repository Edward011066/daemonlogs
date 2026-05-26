import prisma from '../../plugins/prisma.js'

export async function findUserOwnDiscordInfo(usuarioId: number) {
  return prisma.usuarios.findUnique({
    where: { id: usuarioId },
    select: {
      discord_id: true,
      contas_monitoramento: {
        where: { is_valid: true },
        select: { token: true },
      },
    },
  })
}

export async function findAllTargetsByUser(usuarioId: number) {
  return prisma.contas_alvos.findMany({ where: { usuario_id: usuarioId } })
}

export async function findTargetById(id: number, usuarioId: number) {
  return prisma.contas_alvos.findFirst({ where: { id, usuario_id: usuarioId } })
}

export async function findTargetByDiscordId(discordUserId: string, usuarioId: number) {
  return prisma.contas_alvos.findFirst({
    where: { discord_user_id: discordUserId, usuario_id: usuarioId },
  })
}

export async function createTarget(data: {
  discord_user_id: string
  username: string
  username_global?: string
  usuario_id: number
}) {
  return prisma.contas_alvos.create({ data })
}

export async function deleteTarget(id: number, usuarioId: number) {
  return prisma.contas_alvos.deleteMany({ where: { id, usuario_id: usuarioId } })
}
