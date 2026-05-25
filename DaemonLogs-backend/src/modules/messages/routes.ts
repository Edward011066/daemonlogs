import { FastifyInstance } from 'fastify'
import { listMessagesController } from './controller.js'

export async function messageRoutes(fastify: FastifyInstance) {
  fastify.get('/messages', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['Mensagens'],
      summary: 'Listar mensagens salvas das contas alvo',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          targetId: { type: 'string', description: 'discord_user_id da conta alvo' },
          page: { type: 'number', default: 1 },
        },
      },
    },
    handler: listMessagesController,
  })
}
