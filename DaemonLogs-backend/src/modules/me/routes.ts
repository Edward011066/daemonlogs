import { FastifyInstance } from 'fastify'
import { getMeController, getReferralsController, changePasswordController } from './controller.js'

export async function meRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }
  const security = [{ bearerAuth: [] }]

  fastify.get('/me', {
    ...auth,
    schema: {
      tags: ['me'],
      summary: 'Perfil do usuário autenticado com status do plano e quotas',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            username: { type: 'string' },
            email: { type: 'string' },
            plan: { type: 'string', enum: ['freemium', 'premium', 'admin'] },
            is_admin: { type: 'boolean' },
            premium_expires_at: { type: 'string', nullable: true },
            referral_code: { type: 'string' },
            referral_count: { type: 'number' },
            created_at: { type: 'string' },
            my_token: {
              type: 'object',
              properties: {
                has_token: { type: 'boolean' },
                is_valid: { type: 'boolean' },
              },
            },
            clear_chat: {
              type: 'object',
              description: 'Quota de exclusão de mensagens. null = ilimitado (premium/admin)',
              properties: {
                messages_deleted: { type: 'number', nullable: true },
                messages_remaining: { type: 'number', nullable: true },
                period_start_at: { type: 'string', nullable: true },
                period_resets_at: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
    handler: getMeController,
  })

  fastify.get('/me/referrals', {
    ...auth,
    schema: {
      tags: ['me'],
      summary: 'Usuários que se registraram usando seu código de indicação',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  created_at: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    handler: getReferralsController,
  })

  fastify.patch('/me/password', {
    ...auth,
    config: { rateLimit: { max: 5, timeWindow: 15 * 60 * 1000, ban: 2 } },
    schema: {
      tags: ['me'],
      summary: 'Alterar senha da conta',
      security,
      body: {
        type: 'object',
        required: ['current_password', 'new_password'],
        properties: {
          current_password: { type: 'string', minLength: 1 },
          new_password: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
        401: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
    handler: changePasswordController,
  })
}
