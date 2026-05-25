import { FastifyInstance } from 'fastify'
import {
  validateDiscordTokenController,
  getDiscordUserController,
  getGuildChannelsController,
  getDmChannelsController,
} from './controller.js'

const SNOWFLAKE = '^[0-9]{17,20}$'

export async function utilsRoutes(fastify: FastifyInstance) {
  fastify.post('/utils/validate-discord-token', {
    config: {
      rateLimit: { max: 5, timeWindow: 10 * 60 * 1000, ban: 2 },
    },
    schema: {
      tags: ['utilitários'],
      summary: 'Validar token Discord e retornar informações do usuário',
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 10 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            user: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                discriminator: { type: 'string' },
                global_name: { type: 'string', nullable: true },
                avatar: { type: 'string', nullable: true },
                email: { type: 'string', nullable: true },
                phone: { type: 'string', nullable: true },
                mfa_enabled: { type: 'boolean' },
                guild_count: { type: 'number' },
                guilds: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                    },
                  },
                },
                friend_count: { type: 'number' },
                friends: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      username: { type: 'string' },
                      global_name: { type: 'string', nullable: true },
                      avatar: { type: 'string', nullable: true },
                      discriminator: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    handler: validateDiscordTokenController,
  })

  fastify.get('/utils/discord-user/:id', {
    config: {
      rateLimit: { max: 30, timeWindow: 60 * 1000 },
    },
    schema: {
      tags: ['utilitários'],
      summary: 'Buscar informações públicas de um usuário Discord por ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9]{17,20}$' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            username_global: { type: 'string', nullable: true },
            avatar: { type: 'string', nullable: true },
          },
        },
        503: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
    handler: getDiscordUserController,
  })

  const auth = { onRequest: [fastify.authenticate] }
  const security = [{ bearerAuth: [] }]

  fastify.get('/utils/guild-channels/:guildId', {
    ...auth,
    config: { rateLimit: { max: 10, timeWindow: 60 * 1000 } },
    schema: {
      tags: ['utilitários'],
      summary: 'Listar canais de um servidor (usa my-token)',
      description: 'Retorna todos os canais do servidor. Útil para montar a lista de ignored_channel_ids antes de usar /clear-chat/server.',
      security,
      params: {
        type: 'object',
        required: ['guildId'],
        properties: {
          guildId: { type: 'string', pattern: SNOWFLAKE },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            guild_id: { type: 'string' },
            guild_name: { type: 'string' },
            channels: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  position: { type: 'number' },
                  parent_id: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        403: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
    handler: getGuildChannelsController,
  })

  fastify.get('/utils/dm-channels', {
    ...auth,
    config: { rateLimit: { max: 5, timeWindow: 60 * 1000 } },
    schema: {
      tags: ['utilitários'],
      summary: 'Listar DMs abertos (usa my-token)',
      description: 'Retorna todos os canais de DM abertos no cliente. Útil para montar ignored_channel_ids antes de usar /clear-chat/dms ou /tools/close-dm.',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            channels: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  recipient_id: { type: 'string', nullable: true },
                  recipient_username: { type: 'string', nullable: true },
                  recipient_global_name: { type: 'string', nullable: true },
                  recipient_avatar: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        403: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
    handler: getDmChannelsController,
  })
}
