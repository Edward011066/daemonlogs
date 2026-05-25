import { FastifyRequest, FastifyReply } from 'fastify'
import {
  listMonitoringService,
  addMonitoringService,
  deleteMonitoringService,
  validateMonitoringService,
  getMonitoringStatsService,
} from './service.js'

export async function listMonitoringController(request: FastifyRequest, reply: FastifyReply) {
  const usuarioId = request.user.sub
  const accounts = await listMonitoringService(usuarioId)
  return reply.send(accounts)
}

export async function addMonitoringController(request: FastifyRequest, reply: FastifyReply) {
  const usuarioId = request.user.sub
  const { token } = request.body as { token: string }
  const account = await addMonitoringService(token, usuarioId)
  return reply.code(201).send(account)
}

export async function deleteMonitoringController(request: FastifyRequest, reply: FastifyReply) {
  const usuarioId = request.user.sub
  const { id } = request.params as { id: string }
  await deleteMonitoringService(Number(id), usuarioId)
  return reply.code(204).send()
}

export async function validateMonitoringController(request: FastifyRequest, reply: FastifyReply) {
  const usuarioId = request.user.sub
  const { id } = request.params as { id: string }
  const result = await validateMonitoringService(Number(id), usuarioId)
  return reply.send(result)
}

export async function monitoringStatsController(request: FastifyRequest, reply: FastifyReply) {
  const usuarioId = request.user.sub
  const stats = await getMonitoringStatsService(usuarioId)
  return reply.send(stats)
}

