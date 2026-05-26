import crypto from 'node:crypto'
import { AppError } from '../../utils/app-error.js'
import {
  createPagamento,
  findPagamentoByCorrelationId,
  findPagamentoByGatewayChargeId,
  findActivePagamentoByUser,
  findPagamentosByUser,
  updatePagamentoStatus,
  findUserUsernameById,
} from './repository.js'
import { activateUserPremium } from '../plans/repository.js'

// ---------------------------------------------------------------------------
// Gateway selector
// ---------------------------------------------------------------------------

function getActiveGateway(): 'woovi' | 'misticpay' {
  const misticpayActive = !!(process.env.MISTICPAY_CI?.trim() && process.env.MISTICPAY_CS?.trim())
  return misticpayActive ? 'misticpay' : 'woovi'
}

// ---------------------------------------------------------------------------
// Woovi
// ---------------------------------------------------------------------------

const WOOVI_API_URL = 'https://api.woovi.com/api/v1/charge'
const WOOVI_WEBHOOK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC/+NtIkjzevvqD+I3MMv3bLXDt
pvxBjY4BsRrSdca3rtAwMcRYYvxSnd7jagVLpctMiOxQO8ieUCKLSWHpsMAjO/zZ
WMKbqoG8MNpi/u3fp6zz0mcHCOSqYsPUUG19buW8bis5ZZ2IZgBObWSpTvJ0cnj6
HKBAA82Jln+lGwS1MwIDAQAB
-----END PUBLIC KEY-----`

type WooviWebhookSignatures = {
  signature?: string
  legacyHmacSignature?: string
}

async function initiatePaymentWoovi(usuarioId: number) {
  const existing = await findActivePagamentoByUser(usuarioId)
  if (existing) {
    return {
      correlationId: existing.correlation_id,
      qrCodeImage: existing.qrcode_image ?? '',
      brCode: existing.brcode ?? '',
      valorCentavos: existing.valor_centavos,
      chargeExpiresAt: existing.charge_expires_at!.toISOString(),
    }
  }

  const correlationID = `premium-${usuarioId}-${Date.now()}`
  const valorCentavos = Number(process.env.WOOVI_CHARGE_VALUE_CENTS ?? 3990)
  const chargeExpirySeconds = Number(process.env.WOOVI_CHARGE_EXPIRY_SECONDS ?? 3600)
  const chargeExpiresAt = new Date(Date.now() + chargeExpirySeconds * 1000)

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
    gateway: 'woovi',
    brcode: data.charge.brCode,
    qrcode_image: data.charge.qrCodeImage,
    charge_expires_at: chargeExpiresAt,
    woovi_charge_id: data.charge.paymentLinkID,
  })

  return {
    correlationId: correlationID,
    qrCodeImage: data.charge.qrCodeImage,
    brCode: data.charge.brCode,
    valorCentavos,
    chargeExpiresAt: chargeExpiresAt.toISOString(),
  }
}

function validateWooviPublicSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
  if (!signatureHeader) return false
  try {
    const verifier = crypto.createVerify('RSA-SHA256')
    verifier.update(rawBody)
    verifier.end()
    return verifier.verify(WOOVI_WEBHOOK_PUBLIC_KEY, Buffer.from(signatureHeader, 'base64'))
  } catch {
    return false
  }
}

function validateWooviLegacyHmac(rawBody: string | Buffer, signatureHeader: string): boolean {
  const secret = process.env.WOOVI_WEBHOOK_SECRET
  if (!secret || !signatureHeader) return false
  const expected = crypto.createHmac('sha1', secret).update(rawBody).digest('base64')
  try {
    const expectedBuffer = Buffer.from(expected)
    const receivedBuffer = Buffer.from(signatureHeader)
    return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  } catch {
    return false
  }
}

export function validateWooviSignature(rawBody: string | Buffer, signatures: WooviWebhookSignatures): boolean {
  if (validateWooviPublicSignature(rawBody, signatures.signature ?? '')) return true
  return validateWooviLegacyHmac(rawBody, signatures.legacyHmacSignature ?? '')
}

export async function handleWooviWebhook(rawBody: string, signatures: WooviWebhookSignatures, payload: unknown): Promise<void> {
  if (!validateWooviSignature(rawBody, signatures)) {
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

// ---------------------------------------------------------------------------
// MisticPay
// ---------------------------------------------------------------------------

const MISTICPAY_API_URL = 'https://api.misticpay.com'
const MISTICPAY_PAYER_DOCUMENT = '84033724001'

function misticpayHeaders() {
  return {
    ci: process.env.MISTICPAY_CI!,
    cs: process.env.MISTICPAY_CS!,
    'Content-Type': 'application/json',
  }
}

async function initiatePaymentMisticPay(usuarioId: number) {
  const existing = await findActivePagamentoByUser(usuarioId)
  if (existing) {
    return {
      correlationId: existing.correlation_id,
      qrCodeImage: existing.qrcode_image ?? '',
      brCode: existing.brcode ?? '',
      valorCentavos: existing.valor_centavos,
      chargeExpiresAt: existing.charge_expires_at!.toISOString(),
    }
  }

  const user = await findUserUsernameById(usuarioId)
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado')

  const correlationID = `premium-${usuarioId}-${Date.now()}`
  const valorCentavos = Number(process.env.MISTICPAY_CHARGE_VALUE_CENTS ?? 3990)
  const amountBrl = valorCentavos / 100
  const chargeExpirySeconds = Number(process.env.MISTICPAY_CHARGE_EXPIRY_SECONDS ?? 3600)
  const chargeExpiresAt = new Date(Date.now() + chargeExpirySeconds * 1000)

  const response = await fetch(`${MISTICPAY_API_URL}/api/transactions/create`, {
    method: 'POST',
    headers: misticpayHeaders(),
    body: JSON.stringify({
      amount: amountBrl,
      payerName: user.username,
      payerDocument: MISTICPAY_PAYER_DOCUMENT,
      transactionId: correlationID,
      description: 'Assinatura Premium - 30 dias',
      projectWebhook: `${process.env.APP_URL}/webhooks/misticpay`,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new AppError(502, 'MISTICPAY_ERROR', `Erro ao criar cobrança MisticPay: ${body}`)
  }

  const data = await response.json() as {
    data: {
      transactionId: string
      transactionState: string
      qrCodeBase64: string
      copyPaste: string
    }
  }

  await createPagamento({
    correlation_id: correlationID,
    usuario_id: usuarioId,
    valor_centavos: valorCentavos,
    status: 'ACTIVE',
    gateway: 'misticpay',
    brcode: data.data.copyPaste,
    qrcode_image: data.data.qrCodeBase64,
    charge_expires_at: chargeExpiresAt,
    woovi_charge_id: String(data.data.transactionId),
  })

  return {
    correlationId: correlationID,
    qrCodeImage: data.data.qrCodeBase64,
    brCode: data.data.copyPaste,
    valorCentavos,
    chargeExpiresAt: chargeExpiresAt.toISOString(),
  }
}

async function verifyMisticPayTransaction(transactionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${MISTICPAY_API_URL}/api/transactions/check`, {
      method: 'POST',
      headers: misticpayHeaders(),
      body: JSON.stringify({ transactionId }),
    })
    if (!response.ok) return false
    const data = await response.json() as { transaction?: { transactionState: string } }
    return data.transaction?.transactionState === 'COMPLETO'
  } catch {
    return false
  }
}

export async function handleMisticPayWebhook(payload: unknown): Promise<void> {
  const body = payload as {
    transactionId?: number | string
    transactionType?: string
    status?: string
  }

  if (body.transactionType !== 'DEPOSITO' || body.status !== 'COMPLETO') return

  const gatewayChargeId = String(body.transactionId ?? '')
  if (!gatewayChargeId) return

  const pagamento = await findPagamentoByGatewayChargeId(gatewayChargeId)
  if (!pagamento || pagamento.status !== 'ACTIVE') return

  const verified = await verifyMisticPayTransaction(gatewayChargeId)
  if (!verified) return

  const premiumExpires = new Date()
  premiumExpires.setDate(premiumExpires.getDate() + 30)

  await Promise.all([
    updatePagamentoStatus(pagamento.id, 'COMPLETED', premiumExpires),
    activateUserPremium(pagamento.usuario_id, premiumExpires),
  ])
}

// ---------------------------------------------------------------------------
// Exportações públicas compartilhadas
// ---------------------------------------------------------------------------

export async function initiatePaymentService(usuarioId: number) {
  const gateway = getActiveGateway()
  if (gateway === 'misticpay') return initiatePaymentMisticPay(usuarioId)
  return initiatePaymentWoovi(usuarioId)
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

