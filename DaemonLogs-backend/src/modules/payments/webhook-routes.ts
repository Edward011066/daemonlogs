import { FastifyInstance } from 'fastify'
import rawBody from 'fastify-raw-body'
import { wooviWebhookController } from './controller.js'

export async function webhookRoutes(fastify: FastifyInstance) {
  await fastify.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  })

  fastify.post('/webhooks/woovi', {
    config: { rawBody: true },
    schema: { hide: true },
    handler: wooviWebhookController,
  })
}
