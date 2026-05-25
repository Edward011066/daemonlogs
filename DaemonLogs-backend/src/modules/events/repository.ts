import prisma from '../../plugins/prisma.js'

export async function findMessagesSentByUser(
  usuarioId: number,
  discordUserId?: string,
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
    ...((from || to) ? {
      created_at: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    } : {}),
  }

  const skip = (page - 1) * limit
  const [rawItems, total] = await Promise.all([
    prisma.mensagens_salvas.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: { conta_alvo: { select: { discord_user_id: true, username: true } } },
    }),
    prisma.mensagens_salvas.count({ where }),
  ])

  const items = rawItems.map((m) => ({
    id: m.id,
    tipo: 'MESSAGE_SENT',
    dados: {
      message_id: m.message_id,
      conteudo: m.conteudo,
      link_mensagem: m.link_mensagem,
      guild_id: m.guild_id,
      guild_name: m.guild_name,
      channel_id: m.channel_id,
      channel_name: m.channel_name,
    },
    created_at: m.created_at,
    conta_alvo: m.conta_alvo,
  }))

  return { items, total, page, limit }
}

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
