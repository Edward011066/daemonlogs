import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

export default fp(async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    global: true,
    max: Number(process.env.RATE_LIMIT_GLOBAL_MAX ?? 120),
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000), // 1 minuto
    ban: 3, // após 3 violações no janela → ban progressivo
    errorResponseBuilder(_request, context) {
      const retryAfter = Math.ceil(context.ttl / 1000)
      return {
        error: context.ban ? 'RATE_LIMIT_BANNED' : 'RATE_LIMIT_EXCEEDED',
        message: context.ban
          ? `IP banido por excesso de violações. Tente novamente em ${retryAfter} segundos.`
          : `Muitas requisições. Tente novamente em ${retryAfter} segundos.`,
        meta: { retryAfter },
      }
    },
  })
})
