import { FastifyInstance } from 'fastify'
import {
  cancelCurrentProcessController,
  getAutomationStatusController,
  closeDmsController,
  leaveServersController,
  deleteRelationshipsController,
} from './controller.js'

const automationRateLimit = {
  config: {
    rateLimit: { max: 3, timeWindow: 60 * 60 * 1000, ban: 2 },
  },
}

export async function toolsRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }
  const security = [{ bearerAuth: [] }]

  fastify.get('/tools/status', {
    ...auth,
    schema: {
      tags: ['automações'],
      summary: 'Verificar se há um processo de automação em execução',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            active: { type: 'boolean', description: 'true se há um processo rodando em background' },
          },
        },
      },
    },
    handler: getAutomationStatusController,
  })

  fastify.post('/tools/cancel-current-process', {
    ...auth,
    schema: {
      tags: ['automações'],
      summary: 'Cancelar processo de automação em andamento',
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
    handler: cancelCurrentProcessController,
  })

  fastify.post('/tools/close-dm', {
    ...auth,
    ...automationRateLimit,
    schema: {
      tags: ['automações'],
      summary: 'Fechar todos os DMs do usuário (exceto os ignorados)',
      security,
      body: {
        type: 'object',
        properties: {
          ignored_channel_ids: { type: 'array', items: { type: 'string' }, default: [] },
        },
      },
      response: {
        202: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
        403: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
    handler: closeDmsController,
  })

  fastify.post('/tools/leave-server', {
    ...auth,
    ...automationRateLimit,
    schema: {
      tags: ['automações'],
      summary: 'Sair de todos os servidores (exceto os ignorados)',
      security,
      body: {
        type: 'object',
        properties: {
          ignored_guild_ids: { type: 'array', items: { type: 'string' }, default: [] },
        },
      },
      response: {
        202: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
        403: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
    handler: leaveServersController,
  })

  fastify.post('/tools/delete-relationships', {
    ...auth,
    ...automationRateLimit,
    schema: {
      tags: ['automações'],
      summary: 'Deletar todas as relações do usuário (exceto os ignorados)',
      security,
      body: {
        type: 'object',
        properties: {
          ignored_user_ids: { type: 'array', items: { type: 'string' }, default: [] },
        },
      },
      response: {
        202: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
        403: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
    handler: deleteRelationshipsController,
  })
}
