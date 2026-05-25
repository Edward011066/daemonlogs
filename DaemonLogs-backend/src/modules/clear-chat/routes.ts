import { FastifyInstance } from 'fastify'
import {
  cancelClearChatController,
  clearChannelController,
  clearServerController,
  clearDmsController,
} from './controller.js'

const SNOWFLAKE_PATTERN = '^[0-9]{15,21}$'

const commonOptionalFields = {
  author_ids: {
    type: 'array',
    items: { type: 'string', pattern: SNOWFLAKE_PATTERN },
    maxItems: 20,
    description: 'IDs dos autores cujas mensagens serão excluídas. Padrão: apenas suas próprias mensagens.',
  },
  min_id: {
    type: 'string',
    pattern: SNOWFLAKE_PATTERN,
    description: 'ID mínimo de mensagem (limite inferior, não incluso).',
  },
  max_id: {
    type: 'string',
    pattern: SNOWFLAKE_PATTERN,
    description: 'ID máximo de mensagem (ponto de partida, mais recente).',
  },
} as const

const acceptedSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', description: 'Processo iniciado em background' },
  },
}

export async function clearChatRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] }
  const security = [{ bearerAuth: [] }]

  // POST /clear-chat/cancel
  app.post('/clear-chat/cancel', {
    ...auth,
    config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    schema: {
      tags: ['clear-chat'],
      summary: 'Cancela o processo de exclusão em andamento',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            cancelled: { type: 'boolean' },
          },
        },
      },
    },
    handler: cancelClearChatController,
  })

  // POST /clear-chat/channel
  app.post('/clear-chat/channel', {
    ...auth,
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    schema: {
      tags: ['clear-chat'],
      summary: 'Exclui mensagens em um canal específico',
      description:
        'Usa o token de my-token para excluir mensagens no canal informado. Freemium: limite de 500 mensagens por período de 24h. Apenas 1 processo por vez.',
      security,
      body: {
        type: 'object',
        required: ['channel_id'],
        properties: {
          channel_id: {
            type: 'string',
            pattern: SNOWFLAKE_PATTERN,
            description: 'ID do canal Discord onde as mensagens serão excluídas',
          },
          ...commonOptionalFields,
        },
      },
      response: { 202: acceptedSchema },
    },
    handler: clearChannelController,
  })

  // POST /clear-chat/server
  app.post('/clear-chat/server', {
    ...auth,
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
    schema: {
      tags: ['clear-chat'],
      summary: 'Exclui mensagens em todos os canais de um servidor',
      description:
        'Itera por todos os canais de texto do servidor e exclui as mensagens correspondentes ao filtro. Use ignored_channel_ids para pular canais específicos.',
      security,
      body: {
        type: 'object',
        required: ['guild_id'],
        properties: {
          guild_id: {
            type: 'string',
            pattern: SNOWFLAKE_PATTERN,
            description: 'ID do servidor (guild) Discord',
          },
          ignored_channel_ids: {
            type: 'array',
            items: { type: 'string', pattern: SNOWFLAKE_PATTERN },
            maxItems: 100,
            description: 'IDs de canais a ignorar durante a varredura',
          },
          ...commonOptionalFields,
        },
      },
      response: { 202: acceptedSchema },
    },
    handler: clearServerController,
  })

  // POST /clear-chat/dms
  app.post('/clear-chat/dms', {
    ...auth,
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
    schema: {
      tags: ['clear-chat'],
      summary: 'Exclui mensagens em todos os canais de DM abertos',
      description:
        'Itera por todos os canais de DM do cliente e exclui as mensagens correspondentes. Use ignored_channel_ids para pular DMs específicas.',
      security,
      body: {
        type: 'object',
        properties: {
          ignored_channel_ids: {
            type: 'array',
            items: { type: 'string', pattern: SNOWFLAKE_PATTERN },
            maxItems: 200,
            description: 'IDs de canais de DM a ignorar',
          },
          ...commonOptionalFields,
        },
      },
      response: { 202: acceptedSchema },
    },
    handler: clearDmsController,
  })
}
