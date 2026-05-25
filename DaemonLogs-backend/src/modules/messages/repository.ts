import prisma from '../../plugins/prisma.js'

export async function findMessagesByTarget(contaAlvoId: number, page: number, limit = 50) {
  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    prisma.mensagens_salvas.findMany({
      where: { conta_alvo_id: contaAlvoId },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.mensagens_salvas.count({ where: { conta_alvo_id: contaAlvoId } }),
  ])
  return { items, total, page, limit }
}

export async function findMessagesByUserTarget(usuarioId: number, discordUserId?: string, page = 1, limit = 50) {
  const where = discordUserId
    ? { conta_alvo: { usuario_id: usuarioId, discord_user_id: discordUserId } }
    : { conta_alvo: { usuario_id: usuarioId } }

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    prisma.mensagens_salvas.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: { conta_alvo: { select: { discord_user_id: true, username: true } } },
    }),
    prisma.mensagens_salvas.count({ where }),
  ])
  return { items, total, page, limit }
}
