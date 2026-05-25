import { FastifyRequest, FastifyReply } from 'fastify'
import {
  cancelClearChatService,
  clearChannelService,
  clearServerService,
  clearDmMessagesService,
} from './service.js'

export async function cancelClearChatController(_request: FastifyRequest, reply: FastifyReply) {
  const cancelled = cancelClearChatService(_request.user.sub)
  return reply.send({
    message: cancelled ? 'Processo de exclusão cancelado' : 'Nenhum processo em execução',
    cancelled,
  })
}

interface ChannelBody {
  channel_id: string
  author_ids?: string[]
  min_id?: string
  max_id?: string
}

interface ServerBody {
  guild_id: string
  ignored_channel_ids?: string[]
  author_ids?: string[]
  min_id?: string
  max_id?: string
}

interface DmsBody {
  ignored_channel_ids?: string[]
  author_ids?: string[]
  min_id?: string
  max_id?: string
}

export async function clearChannelController(
  request: FastifyRequest<{ Body: ChannelBody }>,
  reply: FastifyReply,
) {
  await clearChannelService(request.user.sub, request.body)
  return reply.code(202).send({ message: 'Processo iniciado. Use POST /clear-chat/cancel para cancelar.' })
}

export async function clearServerController(
  request: FastifyRequest<{ Body: ServerBody }>,
  reply: FastifyReply,
) {
  await clearServerService(request.user.sub, request.body)
  return reply.code(202).send({ message: 'Processo iniciado. Use POST /clear-chat/cancel para cancelar.' })
}

export async function clearDmsController(
  request: FastifyRequest<{ Body: DmsBody }>,
  reply: FastifyReply,
) {
  await clearDmMessagesService(request.user.sub, request.body)
  return reply.code(202).send({ message: 'Processo iniciado. Use POST /clear-chat/cancel para cancelar.' })
}
