import prisma from '../../plugins/prisma.js'

export async function findEventsByUser(
  usuarioId: number,
  discordUserId?: string,
  tipo?: string,
  page = 1,
  limit = 50,
  from?: Date,
  to?: Date,
) {
  const where = {
    conta_alvo: {
      usuario_id: usuarioId,
      ...(discordUserId ? { discord_user_id: discordUserId } : {}),
    },
    ...(tipo ? { tipo } : {}),
    ...((from || to) ? {
      created_at: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    } : {}),
  }

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    prisma.eventos_monitoramento.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: { conta_alvo: { select: { discord_user_id: true, username: true } } },
    }),
    prisma.eventos_monitoramento.count({ where }),
  ])
  return { items, total, page, limit }
}
