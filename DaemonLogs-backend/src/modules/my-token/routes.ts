import { FastifyInstance } from 'fastify'
import { getMyTokenController, addMyTokenController, deleteMyTokenController, rotateMyTokenController } from './controller.js'

export async function myTokenRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }
  const security = [{ bearerAuth: [] }]

  fastify.get('/my-token', {
    ...auth,
    schema: {
      tags: ['my-token'],
      summary: 'Retorna o token pessoal do usuário autenticado',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            token: { type: 'string' },
            is_valid: { type: 'boolean' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
          },
        },
        404: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
    handler: getMyTokenController,
  })

  fastify.post('/my-token/add', {
    ...auth,
    config: {
      rateLimit: { max: 5, timeWindow: 10 * 60 * 1000, ban: 2 },
    },
    schema: {
      tags: ['my-token'],
      summary: 'Adicionar token Discord pessoal (valida antes de salvar)',
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
            created_at: { type: 'string' },
          },
        },
        409: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        422: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
    handler: addMyTokenController,
  })

  fastify.delete('/my-token/delete', {
    ...auth,
    schema: {
      tags: ['my-token'],
      summary: 'Deletar token pessoal (respeita cooldown)',
      security,
      response: {
        204: { type: 'null' },
        404: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        429: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' }, meta: { type: 'object' } } },
      },
    },
    handler: deleteMyTokenController,
  })

  fastify.patch('/my-token/rotate', {
    ...auth,
    config: {
      rateLimit: { max: 5, timeWindow: 10 * 60 * 1000, ban: 2 },
    },
    schema: {
      tags: ['my-token'],
      summary: 'Rotacionar token pessoal com novo token válido (respeita cooldown)',
      security,
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
            id: { type: 'number' },
            is_valid: { type: 'boolean' },
            updated_at: { type: 'string' },
          },
        },
        404: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        422: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        429: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' }, meta: { type: 'object' } } },
      },
    },
    handler: rotateMyTokenController,
  })
}
