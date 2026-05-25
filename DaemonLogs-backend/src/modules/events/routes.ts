import { FastifyInstance } from 'fastify'
import { listEventsController } from './controller.js'

const TIPOS_EVENTO = ['MESSAGE_SENT', 'MESSAGE_EDIT', 'MESSAGE_DELETE', 'VOICE_JOIN', 'VOICE_LEAVE', 'VOICE_SWITCH', 'MENTION']

export async function eventRoutes(fastify: FastifyInstance) {
  fastify.get('/events', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['Eventos'],
      summary: 'Listar eventos de monitoramento',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          targetId: { type: 'string', description: 'discord_user_id da conta alvo' },
          tipo: { type: 'string', enum: TIPOS_EVENTO },
          page: { type: 'number', default: 1, minimum: 1 },
          limit: { type: 'number', default: 50, minimum: 1, maximum: 100, description: 'Itens por página (máx 100)' },
          from: { type: 'string', description: 'Filtrar eventos após esta data (ISO 8601, ex: 2026-05-01T00:00:00Z)' },
          to: { type: 'string', description: 'Filtrar eventos até esta data (ISO 8601)' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  tipo: { type: 'string' },
                  dados: {
                    type: 'object',
                    nullable: true,
                    description: 'Para MESSAGE_SENT: { message_id, conteudo, link_mensagem, guild_id, guild_name, channel_id, channel_name }. Para demais tipos: dados do evento.',
                    additionalProperties: true,
                  },
                  created_at: { type: 'string' },
                  conta_alvo: {
                    type: 'object',
                    properties: {
                      discord_user_id: { type: 'string' },
                      username: { type: 'string', nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    handler: listEventsController,
  })
}
