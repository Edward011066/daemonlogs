import { FastifyInstance } from 'fastify'
import {
  listMonitoringController,
  addMonitoringController,
  deleteMonitoringController,
  validateMonitoringController,
  monitoringStatsController,
} from './controller.js'

export async function monitoringRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }
  const security = [{ bearerAuth: [] }]

  fastify.get('/monitoring', {
    ...auth,
    schema: {
      tags: ['Monitoramento'],
      summary: 'Listar contas de monitoramento',
      security,
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              is_valid: { type: 'boolean' },
              username: {
                anyOf: [{ type: 'string' }, { type: 'null' }],
                description: 'Username da conta Discord associada ao token',
              },
              created_at: { type: 'string' },
            },
          },
        },
      },
    },
    handler: listMonitoringController,
  })

  fastify.post('/monitoring', {
    ...auth,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: 10 * 60 * 1000, // 10 por 10 min — validação de token é custosa
        ban: 2,
      },
    },
    schema: {
      tags: ['Monitoramento'],
      summary: 'Adicionar conta de monitoramento (token Discord)',
      security,
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 10 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            is_valid: { type: 'boolean' },
            username: { type: 'string', description: 'Username da conta Discord adicionada' },
            created_at: { type: 'string' },
          },
        },
      },
    },
    handler: addMonitoringController,
  })

  fastify.delete('/monitoring/:id', {
    ...auth,
    schema: {
      tags: ['Monitoramento'],
      summary: 'Remover conta de monitoramento',
      security,
      params: {
        type: 'object',
        properties: { id: { type: 'number' } },
      },
    },
    handler: deleteMonitoringController,
  })

  fastify.post('/monitoring/:id/validate', {
    ...auth,
    schema: {
      tags: ['Monitoramento'],
      summary: 'Revalidar token de uma conta de monitoramento',
      security,
      params: {
        type: 'object',
        properties: { id: { type: 'number' } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            is_valid: { type: 'boolean' },
          },
        },
      },
    },
    handler: validateMonitoringController,
  })

  fastify.get('/monitoring/stats', {
    ...auth,
    schema: {
      tags: ['Monitoramento'],
      summary: 'Estatísticas de contas de monitoramento',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            my_active: { type: 'number', description: 'Minhas contas ativas' },
            total_active: { type: 'number', description: 'Total de contas ativas na plataforma' },
          },
        },
      },
    },
    handler: monitoringStatsController,
  })
}
