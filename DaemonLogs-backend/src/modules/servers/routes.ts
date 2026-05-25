import { FastifyInstance } from 'fastify'
import { listServersController } from './controller.js'

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
}
