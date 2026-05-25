import prisma from '../../plugins/prisma.js'

export async function findUserPlanInfo(usuarioId: number) {
  return prisma.usuarios.findUnique({
    where: { id: usuarioId },
    select: {
      is_premium: true,
      is_admin: true,
      premium_expires_at: true,
      last_target_removed_at: true,
    },
  })
}

export async function countUserTargets(usuarioId: number) {
  return prisma.contas_alvos.count({ where: { usuario_id: usuarioId } })
}

export async function hasActiveMonitoring(usuarioId: number) {
  const count = await prisma.contas_monitoramento.count({
    where: { usuario_id: usuarioId, is_valid: true },
  })
  return count > 0
}

export async function updateUserLastTargetRemoved(usuarioId: number) {
  return prisma.usuarios.update({
    where: { id: usuarioId },
    data: { last_target_removed_at: new Date() },
  })
}

export async function activateUserPremium(usuarioId: number, expiresAt: Date) {
  return prisma.usuarios.update({
    where: { id: usuarioId },
    data: { is_premium: true, premium_expires_at: expiresAt },
  })
}

export async function deactivateUserPremium(usuarioId: number) {
  return prisma.usuarios.update({
    where: { id: usuarioId },
    data: { is_premium: false, premium_expires_at: null },
  })
}

export async function findUsersWithUniqueServerCount(minServers: number) {
  const result = await prisma.$queryRaw<{ usuario_id: number; unique_servers: bigint }[]>`
    SELECT cm.usuario_id, COUNT(DISTINCT s.guild_id) as unique_servers
    FROM servidores s
    JOIN contas_monitoramento cm ON s.conta_monitoramento_id = cm.id
    GROUP BY cm.usuario_id
    HAVING COUNT(DISTINCT s.guild_id) >= ${minServers}
  `
  return result.map((r: { usuario_id: number; unique_servers: bigint }) => ({ usuario_id: r.usuario_id, unique_servers: Number(r.unique_servers) }))
}
