import { FastifyInstance } from 'fastify'
import { initiatePaymentController, getPaymentStatusController, listPaymentsController } from './controller.js'

export async function paymentRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }
  const security = [{ bearerAuth: [] }]

  fastify.post('/payments/initiate', {
    ...auth,
    schema: {
      tags: ['Pagamentos'],
      summary: 'Iniciar cobrança PIX premium',
      security,
      response: {
        201: {
          type: 'object',
          properties: {
            correlationId: { type: 'string' },
            qrCodeImage: { type: 'string', description: 'QR code em base64' },
            brCode: { type: 'string', description: 'PIX copia-e-cola' },
            valorCentavos: { type: 'number' },
          },
        },
      },
    },
    handler: initiatePaymentController,
  })

  fastify.get('/payments/status/:correlationId', {
    ...auth,
    schema: {
      tags: ['Pagamentos'],
      summary: 'Consultar status de cobrança PIX',
      security,
      params: {
        type: 'object',
        required: ['correlationId'],
        properties: {
          correlationId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            correlation_id: { type: 'string' },
            valor_centavos: { type: 'number' },
            status: { type: 'string' },
            premium_expires_at: { type: 'string', nullable: true },
            created_at: { type: 'string' },
          },
        },
      },
    },
    handler: getPaymentStatusController,
  })

  fastify.get('/payments', {
    ...auth,
    schema: {
      tags: ['Pagamentos'],
      summary: 'Listar histórico de pagamentos',
      security,
    },
    handler: listPaymentsController,
  })
}
