import { FastifyRequest, FastifyReply } from 'fastify'
import {
  cancelCurrentProcessService,
  getAutomationStatusService,
  closeDmsService,
  leaveServersService,
  deleteRelationshipsService,
} from './service.js'

export async function cancelCurrentProcessController(request: FastifyRequest, reply: FastifyReply) {
  const cancelled = cancelCurrentProcessService(request.user.sub)
  return reply.send({
    message: cancelled ? 'Processo cancelado com sucesso' : 'Nenhum processo em execução',
    cancelled,
  })
}

export async function getAutomationStatusController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(getAutomationStatusService(request.user.sub))
}

export async function closeDmsController(
  request: FastifyRequest<{ Body: { ignored_channel_ids?: string[] } }>,
  reply: FastifyReply,
) {
  await closeDmsService(request.user.sub, request.body.ignored_channel_ids ?? [])
  return reply.code(202).send({ message: 'Processo iniciado. Use POST /tools/cancel-current-process para cancelar.' })
}

export async function leaveServersController(
  request: FastifyRequest<{ Body: { ignored_guild_ids?: string[] } }>,
  reply: FastifyReply,
) {
  await leaveServersService(request.user.sub, request.body.ignored_guild_ids ?? [])
  return reply.code(202).send({ message: 'Processo iniciado. Use POST /tools/cancel-current-process para cancelar.' })
}

export async function deleteRelationshipsController(
  request: FastifyRequest<{ Body: { ignored_user_ids?: string[] } }>,
  reply: FastifyReply,
) {
  await deleteRelationshipsService(request.user.sub, request.body.ignored_user_ids ?? [])
  return reply.code(202).send({ message: 'Processo iniciado. Use POST /tools/cancel-current-process para cancelar.' })
}
