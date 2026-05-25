import { FastifyRequest, FastifyReply } from 'fastify'
import { listServersService } from './service.js'

export async function listServersController(_request: FastifyRequest, reply: FastifyReply) {
  const result = await listServersService()
  return reply.send(result)
}
