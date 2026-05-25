import prisma from '../../plugins/prisma.js'

export async function findAllMonitoringByUser(usuarioId: number) {
  return prisma.contas_monitoramento.findMany({
    where: { usuario_id: usuarioId },
    select: { id: true, is_valid: true, created_at: true, token: false },
  })
}

export async function findMonitoringById(id: number, usuarioId: number) {
  return prisma.contas_monitoramento.findFirst({
    where: { id, usuario_id: usuarioId },
  })
}

export async function createMonitoring(data: { token: string; usuario_id: number; is_valid: boolean }) {
  return prisma.contas_monitoramento.create({ data })
}

export async function deleteMonitoring(id: number, usuarioId: number) {
  return prisma.contas_monitoramento.deleteMany({
    where: { id, usuario_id: usuarioId },
  })
}

export async function updateMonitoringValidity(id: number, is_valid: boolean) {
  return prisma.contas_monitoramento.update({ where: { id }, data: { is_valid } })
}

export async function findAllValidTokens() {
  return prisma.contas_monitoramento.findMany({
    where: { is_valid: true },
    select: { id: true, token: true },
  })
}
