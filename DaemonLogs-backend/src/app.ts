import Fastify, { type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { AppError } from './utils/app-error.js'
import { destroyClient } from './selfbot/client-manager.js'
import { findMonitoringTokenById } from './modules/monitoring/repository.js'
import swaggerPlugin from './plugins/swagger.js'
import authPlugin from './plugins/auth.js'
import rateLimitPlugin from './plugins/rate-limit.js'
import prisma from './plugins/prisma.js'
import { authRoutes } from './modules/auth/routes.js'
import { monitoringRoutes } from './modules/monitoring/routes.js'
import { targetRoutes } from './modules/targets/routes.js'
import { eventRoutes } from './modules/events/routes.js'
import { serverRoutes } from './modules/servers/routes.js'
import { paymentRoutes } from './modules/payments/routes.js'
import { webhookRoutes } from './modules/payments/webhook-routes.js'
import { myTokenRoutes } from './modules/my-token/routes.js'
import { utilsRoutes } from './modules/utils/routes.js'
import { toolsRoutes } from './modules/tools/routes.js'
import { clearChatRoutes } from './modules/clear-chat/routes.js'
import { meRoutes } from './modules/me/routes.js'

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  })

  // Discord Snowflake IDs são inteiros de 18-19 dígitos e excedem Number.MAX_SAFE_INTEGER.
  // JSON.parse nativo os converte para float64 com perda de precisão (ex: 1404598971384598662
  // vira 1404598971384598800), quebrando comparações com channel.id/guild.id (sempre strings).
  // Este parser converte qualquer inteiro ≥ 16 dígitos para string ANTES do JSON.parse.
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (_req, body, done) {
    try {
      const rawBody = body as string

      if (rawBody.trim().length === 0) {
        done(null, undefined)
        return
      }

      const safe = rawBody.replace(/([:,\[])\s*(\d{16,})(?=[\s,\]\}])/g, '$1 "$2"')
      done(null, JSON.parse(safe))
    } catch (err) {
      done(err as Error, undefined)
    }
  })

  await fastify.register(cors, { origin: true })
  await fastify.register(cookie)
  if (process.env.SWAGGER_ENABLED !== 'false') {
    await fastify.register(swaggerPlugin)
  }
  await fastify.register(authPlugin)
  await fastify.register(rateLimitPlugin)

  // Health check real: so responde OK quando a API e o banco estao acessiveis.
  fastify.get('/health', { schema: { hide: true } }, async () => {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok' }
  })

  // Rota interna — chamada pelo token-validator worker para destruir clientes selfbot inválidos.
  // Protegida por X-Internal-Secret; não exposta no Swagger nem fora da rede Docker.
  fastify.post<{ Body: { id: number } }>(
    '/internal/destroy-token',
    {
      schema: {
        hide: true,
        body: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'integer' } },
        },
      },
    },
    async (request, reply) => {
      const secret = request.headers['x-internal-secret']
      if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
        return reply.code(403).send({ error: 'FORBIDDEN' })
      }
      const account = await findMonitoringTokenById(request.body.id)
      if (!account) return reply.code(404).send({ error: 'NOT_FOUND' })
      await destroyClient(account.token)
      return reply.send({ ok: true })
    },
  )

  // Rotas
  await fastify.register(authRoutes)
  await fastify.register(monitoringRoutes)
  await fastify.register(targetRoutes)
  await fastify.register(eventRoutes)
  await fastify.register(serverRoutes)
  await fastify.register(paymentRoutes)
  await fastify.register(webhookRoutes)
  await fastify.register(myTokenRoutes)
  await fastify.register(utilsRoutes)
  await fastify.register(toolsRoutes)
  await fastify.register(clearChatRoutes)
  await fastify.register(meRoutes)

  // Handler global de erros
  fastify.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
        ...(error.meta ? { meta: error.meta } : {}),
      })
    }

    // Erros de validação do Fastify
    if (error.validation) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: error.message })
    }

    fastify.log.error(error)
    return reply.code(500).send({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' })
  })

  return fastify
}
