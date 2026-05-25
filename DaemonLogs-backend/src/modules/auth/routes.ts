import { FastifyInstance } from 'fastify'
import { AUTH_CONFIG } from '../../config/auth-config.js'
import {
  registerController,
  loginController,
  logoutController,
  activateController,
  resendActivationController,
  requestPasswordResetController,
  verifyResetCodeController,
  resetPasswordController,
  discordOAuthController,
  discordCallbackController,
} from './controller.js'

export async function authRoutes(fastify: FastifyInstance) {
  if (AUTH_CONFIG.mode === 'discord') {
    fastify.get('/auth/discord', {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: 60 * 1000,
          ban: 5,
        },
      },
      schema: {
        tags: ['Auth'],
        summary: 'Iniciar autenticação Discord OAuth2',
        description: 'Redireciona para a página de autorização do Discord.',
        response: { 302: { description: 'Redirect para Discord' } },
      },
      handler: discordOAuthController,
    })

    fastify.get('/auth/discord/callback', {
      schema: {
        tags: ['Auth'],
        summary: 'Callback Discord OAuth2',
        description: 'Recebe code+state do Discord, valida, cria/atualiza usuário e redireciona ao frontend com JWT.',
        querystring: {
          type: 'object',
          required: ['code', 'state'],
          properties: {
            code: { type: 'string' },
            state: { type: 'string' },
          },
        },
        response: { 302: { description: 'Redirect para frontend com ?token=JWT' } },
      },
      handler: discordCallbackController,
    })

    return // local routes não registradas no modo discord
  }

  fastify.post('/auth/register', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 10 * 60 * 1000, // 5 por 10 min
        ban: 2,
      },
    },
    schema: {
      tags: ['Auth'],
      summary: 'Registrar novo usuário',
      body: {
        type: 'object',
        required: ['username', 'password', 'email'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          password: { type: 'string', minLength: 6 },
          email: { type: 'string', format: 'email' },
          referral_code: { type: 'string', description: 'Código de indicação de outro usuário (opcional)' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            username: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
    handler: registerController,
  })

  fastify.post('/auth/activate', {
    schema: {
      tags: ['Auth'],
      summary: 'Ativar conta via código recebido por email',
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', minLength: 10 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: activateController,
  })

  fastify.post('/auth/resend-activation', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 10 * 60 * 1000, // 5 por 10 min
        ban: 2,
      },
    },
    schema: {
      tags: ['Auth'],
      summary: 'Reenviar email de ativação',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: resendActivationController,
  })

  fastify.post('/auth/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: 5 * 60 * 1000, // 10 por 5 min
        ban: 3,
      },
    },
    schema: {
      tags: ['Auth'],
      summary: 'Login',
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          password: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            usuario: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                username: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: loginController,
  })

  fastify.post('/auth/logout', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Logout',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: logoutController,
  })

  fastify.post('/auth/forgot-password', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 15 * 60 * 1000, // 5 por 15 min — previne abuso de envio de email
        ban: 2,
      },
    },
    schema: {
      tags: ['Auth'],
      summary: 'Solicitar redefinição de senha',
      description: 'Envia um código de 6 dígitos para o email cadastrado. Expira em 15 minutos.',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: requestPasswordResetController,
  })

  fastify.post('/auth/verify-reset-code', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: 5 * 60 * 1000, // 10 por 5 min
        ban: 3,
      },
    },
    schema: {
      tags: ['Auth'],
      summary: 'Verificar código de redefinição de senha',
      description: 'Valida o código de 6 dígitos antes de exibir o formulário de nova senha.',
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', minLength: 6, maxLength: 6, pattern: '^[0-9]{6}$' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: verifyResetCodeController,
  })

  fastify.post('/auth/reset-password', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: 10 * 60 * 1000, // 10 por 10 min
        ban: 2,
      },
    },
    schema: {
      tags: ['Auth'],
      summary: 'Redefinir senha',
      description: 'Define uma nova senha utilizando o código de redefinição enviado por email.',
      body: {
        type: 'object',
        required: ['code', 'new_password'],
        properties: {
          code: { type: 'string', minLength: 6, maxLength: 6, pattern: '^[0-9]{6}$' },
          new_password: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: resetPasswordController,
  })
}

