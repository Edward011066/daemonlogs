import { FastifyRequest, FastifyReply } from 'fastify'
import { listEventsService } from './service.js'

export async function listEventsController(request: FastifyRequest, reply: FastifyReply) {
  const { targetId, tipo, page, limit, from, to } = request.query as {
    targetId?: string
    tipo?: string
    page?: string
    limit?: string
    from?: string
    to?: string
  }
  const result = await listEventsService(
    request.user.sub,
    targetId,
    tipo,
    Number(page) || 1,
    Math.min(Number(limit) || 50, 100),
    from,
    to,
  )
  return reply.send(result)
}
