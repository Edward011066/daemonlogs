import { FastifyInstance } from 'fastify'
import rawBody from 'fastify-raw-body'
import { wooviWebhookController, misticPayWebhookController } from './controller.js'

export async function webhookRoutes(fastify: FastifyInstance) {
  await fastify.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  })

  // Woovi: valida assinatura HMAC/RSA — rawBody obrigatório para cálculo do digest
  fastify.post('/webhooks/woovi', {
    config: { rawBody: true },
    schema: { hide: true },
    handler: wooviWebhookController,
  })

  // MisticPay: sem assinatura HMAC — validação defensiva via /api/transactions/check na MisticPay
  fastify.post('/webhooks/misticpay', {
    schema: { hide: true },
    handler: misticPayWebhookController,
  })
}
