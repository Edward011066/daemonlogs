import { FastifyInstance } from 'fastify'
import { listServersController, checkServerController } from './controller.js'

export async function serverRoutes(fastify: FastifyInstance) {
  fastify.get('/servers', {
    schema: {
      tags: ['Servidores'],
      summary: 'Listar servidores descobertos pelas contas de monitoramento',
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Total de servidores únicos descobertos' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  guild_id: { type: 'string' },
                  server_name: { type: 'string' },
                  created_at: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    handler: listServersController,
  })

  fastify.post('/servers', {
    config: { rateLimit: { max: 30, timeWindow: 60_000 } },
    schema: {
      tags: ['Servidores'],
      summary: 'Verificar se um servidor está sendo monitorado pelo guild_id',
      body: {
        type: 'object',
        required: ['guild_id'],
        properties: {
          guild_id: { type: 'string', pattern: '^[0-9]{17,20}$', description: 'ID do servidor Discord (Snowflake)' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            monitored: { type: 'boolean' },
            server: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                guild_id: { type: 'string' },
                server_name: { type: 'string' },
                created_at: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: checkServerController,
  })
}
