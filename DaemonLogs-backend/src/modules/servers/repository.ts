import prisma from '../../plugins/prisma.js'

export async function findAllServers() {
  const items = await prisma.servidores.findMany({
    select: { id: true, guild_id: true, server_name: true, created_at: true },
    distinct: ['guild_id'],
    orderBy: { server_name: 'asc' },
  })
  return { items, total: items.length }
}
