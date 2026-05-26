import { FastifyRequest, FastifyReply } from 'fastify'
import { initiatePaymentService, getPaymentStatusService, listPaymentsService, handleWooviWebhook, handleMisticPayWebhook } from './service.js'

export async function initiatePaymentController(request: FastifyRequest, reply: FastifyReply) {
  const result = await initiatePaymentService(request.user.sub)
  return reply.code(201).send(result)
}

export async function getPaymentStatusController(request: FastifyRequest, reply: FastifyReply) {
  const { correlationId } = request.params as { correlationId: string }
  const result = await getPaymentStatusService(correlationId, request.user.sub)
  return reply.send(result)
}

export async function listPaymentsController(request: FastifyRequest, reply: FastifyReply) {
  const result = await listPaymentsService(request.user.sub)
  return reply.send(result)
}

export async function wooviWebhookController(request: FastifyRequest, reply: FastifyReply) {
  const signature = (request.headers['x-webhook-signature'] as string) ?? ''
  const legacyHmacSignature = (request.headers['x-openpix-signature'] as string) ?? ''
  await handleWooviWebhook(
    (request as unknown as { rawBody: string }).rawBody,
    { signature, legacyHmacSignature },
    request.body
  )
  return reply.code(200).send({ ok: true })
}

export async function misticPayWebhookController(request: FastifyRequest, reply: FastifyReply) {
  await handleMisticPayWebhook(request.body)
  return reply.code(200).send({ ok: true })
}
