import { FastifyRequest, FastifyReply } from 'fastify'
import { listServersService, checkServerService } from './service.js'

export async function listServersController(_request: FastifyRequest, reply: FastifyReply) {
  const result = await listServersService()
  return reply.send(result)
}

export async function checkServerController(request: FastifyRequest, reply: FastifyReply) {
  const { guild_id } = request.body as { guild_id: string }
  const result = await checkServerService(guild_id)
  return reply.send(result)
}
