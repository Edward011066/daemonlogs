import prisma from '../../plugins/prisma.js'

export async function findClearChatUsage(usuarioId: number) {
  return prisma.clear_chat_usage.findUnique({ where: { usuario_id: usuarioId } })
}

export async function upsertClearChatUsage(
  usuarioId: number,
  data: { messages_deleted: number; period_start_at: Date },
) {
  return prisma.clear_chat_usage.upsert({
    where: { usuario_id: usuarioId },
    create: { usuario_id: usuarioId, ...data },
    update: data,
  })
}

export async function incrementMessageCount(usuarioId: number, count: number) {
  return prisma.clear_chat_usage.update({
    where: { usuario_id: usuarioId },
    data: { messages_deleted: { increment: count } },
  })
}
