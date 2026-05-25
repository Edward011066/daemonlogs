import { FastifyRequest, FastifyReply } from 'fastify'
import { getMyTokenService, addMyTokenService, deleteMyTokenService, rotateMyTokenService } from './service.js'

export async function getMyTokenController(request: FastifyRequest, reply: FastifyReply) {
  const myToken = await getMyTokenService(request.user.sub)
  return reply.send(myToken)
}

export async function addMyTokenController(
  request: FastifyRequest<{ Body: { token: string } }>,
  reply: FastifyReply,
) {
  const result = await addMyTokenService(request.user.sub, request.body.token)
  return reply.code(201).send({ id: result.id, is_valid: result.is_valid, created_at: result.created_at })
}

export async function deleteMyTokenController(request: FastifyRequest, reply: FastifyReply) {
  await deleteMyTokenService(request.user.sub)
  return reply.code(204).send()
}

export async function rotateMyTokenController(
  request: FastifyRequest<{ Body: { token: string } }>,
  reply: FastifyReply,
) {
  const result = await rotateMyTokenService(request.user.sub, request.body.token)
  return reply.send({ id: result.id, is_valid: result.is_valid, updated_at: result.updated_at })
}
