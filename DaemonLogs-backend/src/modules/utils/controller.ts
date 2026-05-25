import { FastifyRequest, FastifyReply } from 'fastify'
import { validateDiscordTokenService, getDiscordUserService, getGuildChannelsService, getDmChannelsService } from './service.js'

export async function validateDiscordTokenController(
  request: FastifyRequest<{ Body: { token: string } }>,
  reply: FastifyReply,
) {
  const result = await validateDiscordTokenService(request.body.token)
  return reply.send(result)
}

export async function getDiscordUserController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = await getDiscordUserService(request.params.id)
  return reply.send(user)
}

export async function getGuildChannelsController(
  request: FastifyRequest<{ Params: { guildId: string } }>,
  reply: FastifyReply,
) {
  const data = await getGuildChannelsService(request.user.sub, request.params.guildId)
  return reply.send(data)
}

export async function getDmChannelsController(request: FastifyRequest, reply: FastifyReply) {
  const data = await getDmChannelsService(request.user.sub)
  return reply.send(data)
}
