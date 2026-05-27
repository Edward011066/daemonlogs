import { FastifyInstance } from 'fastify'
import { listTargetsController, addTargetController, deleteTargetController, countTargetsController } from './controller.js'

export async function targetRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }
  const security = [{ bearerAuth: [] }]

  fastify.get('/targets', {
    ...auth,
    schema: {
      tags: ['Contas Alvo'],
      summary: 'Listar contas alvo',
      security,
    },
    handler: listTargetsController,
  })

  fastify.post('/targets', {
    ...auth,
    schema: {
      tags: ['Contas Alvo'],
      summary: 'Adicionar conta alvo',
      security,
      body: {
        type: 'object',
        required: ['discord_user_id'],
        properties: {
          discord_user_id: { type: 'string', pattern: '^[0-9]{17,20}$', description: 'ID Discord do usuário alvo' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            discord_user_id: { type: 'string' },
            username: { type: 'string' },
            username_global: { type: 'string', nullable: true },
            created_at: { type: 'string' },
          },
        },
      },
    },
    handler: addTargetController,
  })

  fastify.delete('/targets/:id', {
    ...auth,
    schema: {
      tags: ['Contas Alvo'],
      summary: 'Remover conta alvo',
      security,
      params: {
        type: 'object',
        properties: { id: { type: 'number' } },
      },
    },
    handler: deleteTargetController,
  })

  fastify.get('/targets-amount', {
    schema: {
      tags: ['Contas Alvo'],
      summary: 'Total de contas alvo monitoradas (público)',
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Total de contas alvo em todo o sistema' },
          },
        },
      },
    },
    handler: countTargetsController,
  })
}
