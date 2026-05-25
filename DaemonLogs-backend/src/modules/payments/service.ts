import crypto from 'node:crypto'
import { AppError } from '../../utils/app-error.js'
import { createPagamento, findPagamentoByCorrelationId, findPagamentosByUser, updatePagamentoStatus } from './repository.js'
import { activateUserPremium } from '../plans/repository.js'

const WOOVI_API_URL = 'https://api.woovi.com/api/v1/charge'

export async function initiatePaymentService(usuarioId: number) {
  const correlationID = `premium-${usuarioId}-${Date.now()}`
  const valorCentavos = Number(process.env.WOOVI_CHARGE_VALUE_CENTS ?? 3990)

  const response = await fetch(WOOVI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: process.env.WOOVI_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      correlationID,
      value: valorCentavos,
      comment: 'Assinatura Premium - 30 dias',
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new AppError(502, 'WOOVI_ERROR', `Erro ao criar cobrança PIX: ${body}`)
  }

  const data = await response.json() as {
    charge: {
      correlationID: string
      status: string
      paymentLinkID: string
      qrCodeImage: string
      brCode: string
    }
  }

  await createPagamento({
    correlation_id: correlationID,
    usuario_id: usuarioId,
    valor_centavos: valorCentavos,
    status: 'ACTIVE',
    woovi_charge_id: data.charge.paymentLinkID,
  })

  return {
    correlationId: correlationID,
    qrCodeImage: data.charge.qrCodeImage,
    brCode: data.charge.brCode,
    valorCentavos,
  }
}

export async function getPaymentStatusService(correlationId: string, usuarioId: number) {
  const pagamento = await findPagamentoByCorrelationId(correlationId)
  if (!pagamento || pagamento.usuario_id !== usuarioId) {
    throw new AppError(404, 'NOT_FOUND', 'Cobrança não encontrada')
  }
  return pagamento
}

export async function listPaymentsService(usuarioId: number) {
  return findPagamentosByUser(usuarioId)
}

export function validateWooviSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
  const secret = process.env.WOOVI_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto
    .createHmac('sha1', secret)
    .update(rawBody)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signatureHeader, 'hex'))
  } catch {
    return false
  }
}

export async function handleWooviWebhook(rawBody: string, signature: string, payload: unknown): Promise<void> {
  if (!validateWooviSignature(rawBody, signature)) {
    throw new AppError(401, 'INVALID_SIGNATURE', 'Assinatura do webhook inválida')
  }

  const body = payload as { event: string; charge?: { correlationID: string } }

  if (body.event !== 'OPENPIX:CHARGE_COMPLETED') return

  const correlationID = body.charge?.correlationID
  if (!correlationID) return

  const pagamento = await findPagamentoByCorrelationId(correlationID)
  if (!pagamento || pagamento.status !== 'ACTIVE') return

  const premiumExpires = new Date()
  premiumExpires.setDate(premiumExpires.getDate() + 30)

  await Promise.all([
    updatePagamentoStatus(pagamento.id, 'COMPLETED', premiumExpires),
    activateUserPremium(pagamento.usuario_id, premiumExpires),
  ])
}
