import { FastifyRequest, FastifyReply } from 'fastify'
import { listMessagesService } from './service.js'

export async function listMessagesController(request: FastifyRequest, reply: FastifyReply) {
  const { targetId, page } = request.query as { targetId?: string; page?: string }
  const result = await listMessagesService(request.user.sub, targetId, Number(page) || 1)
  return reply.send(result)
}
