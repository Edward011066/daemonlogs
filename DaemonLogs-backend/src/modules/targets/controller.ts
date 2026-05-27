import { FastifyRequest, FastifyReply } from 'fastify'
import { listTargetsService, addTargetService, deleteTargetService, countTargetsService } from './service.js'

export async function listTargetsController(request: FastifyRequest, reply: FastifyReply) {
  const targets = await listTargetsService(request.user.sub)
  return reply.send(targets)
}

export async function addTargetController(request: FastifyRequest, reply: FastifyReply) {
  const { discord_user_id } = request.body as { discord_user_id: string }
  const target = await addTargetService({ discord_user_id }, request.user.sub)
  return reply.code(201).send(target)
}

export async function deleteTargetController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await deleteTargetService(Number(id), request.user.sub)
  return reply.code(204).send()
}

export async function countTargetsController(_request: FastifyRequest, reply: FastifyReply) {
  const result = await countTargetsService()
  return reply.send(result)
}
