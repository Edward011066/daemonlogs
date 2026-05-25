---
description: "Use when: implementar pagamento, integração Woovi, PIX, charge PIX, webhook de pagamento, ativar conta premium, criar cobrança, validar webhook, OPENPIX:CHARGE_COMPLETED, correlationID, rawBody, assinatura HMAC, src/modules/payments, POST /payments/initiate, POST /webhooks/woovi."
applyTo: "src/modules/payments/**"
---

# Pagamentos — Integração Woovi PIX

> Spec completa da API Woovi: `api-1-woovi.yaml` na raiz do repositório.
> Sandbox: `https://api.woovi-sandbox.com` | Produção: `https://api.woovi.com`

## Variáveis de Ambiente Necessárias

```env
WOOVI_API_KEY=seu_app_id_da_woovi          # AppID da aplicação Woovi (Authorization header)
WOOVI_WEBHOOK_SECRET=seu_webhook_secret    # Segredo para validar assinatura HMAC-SHA1
WOOVI_CHARGE_VALUE_CENTS=3990              # Valor em CENTAVOS — ex: 3990 = R$ 39,90
```

## Módulo Payments — Estrutura

```
src/modules/payments/
├── routes.ts       # POST /payments/initiate, GET /payments/status/:correlationId
├── controller.ts
├── service.ts      # lógica de criação de charge + ativação de premium
└── repository.ts   # CRUD de pagamentos

src/modules/payments/webhook-routes.ts    # POST /webhooks/woovi — rota separada sem auth JWT
```

## Endpoints

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/payments/initiate` | JWT | Cria cobrança PIX, retorna QR code |
| GET | `/payments/status/:correlationId` | JWT | Consulta status da cobrança |
| POST | `/webhooks/woovi` | Nenhuma¹ | Recebe confirmação de pagamento Woovi |

> ¹ Webhook usa validação de assinatura HMAC-SHA1 própria — **nunca** aplicar `fastify.authenticate` aqui.

## Criar Cobrança (POST /api/v1/charge na Woovi)

```typescript
// src/modules/payments/service.ts
const correlationID = `premium-${usuarioId}-${Date.now()}`  // rastreável por usuário

const response = await fetch('https://api.woovi.com/api/v1/charge', {
  method: 'POST',
  headers: {
    'Authorization': process.env.WOOVI_API_KEY!,  // SEM "Bearer " — só o AppID direto
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    correlationID,
    value: Number(process.env.WOOVI_CHARGE_VALUE_CENTS), // CENTAVOS — nunca em reais
    comment: 'Assinatura Premium - 30 dias',
  }),
})

const data = await response.json() as {
  charge: {
    correlationID: string
    status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
    paymentLinkID: string
    qrCodeImage: string   // base64 do QR code — renderizar no frontend como <img>
    brCode: string        // string PIX copia-e-cola
  }
}

// Salvar no banco ANTES de retornar ao frontend
await createPagamento({
  correlation_id: correlationID,
  usuario_id: usuarioId,
  valor_centavos: Number(process.env.WOOVI_CHARGE_VALUE_CENTS),
  status: 'ACTIVE',
  woovi_charge_id: data.charge.paymentLinkID,
})
```

## Response para o Frontend (201)

```typescript
{
  correlationId: string,
  qrCodeImage: string,   // base64 — frontend renderiza como <img src="data:image/png;base64,..." />
  brCode: string,        // PIX copia-e-cola
  valorCentavos: number,
}
```

## Webhook — Validação de Assinatura OBRIGATÓRIA

**Omitir a validação = qualquer pessoa pode ativar premium sem pagar (OWASP A01).**

### Configuração da rota (rawBody obrigatório)

```typescript
// src/modules/payments/webhook-routes.ts — registrar em app.ts
// Pacote: npm install fastify-raw-body

import rawBody from 'fastify-raw-body'

export async function webhookRoutes(fastify: FastifyInstance) {
  // Registrar plugin rawBody ANTES de definir a rota
  await fastify.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,  // processa rawBody antes dos outros hooks
  })

  fastify.post('/webhooks/woovi', {
    config: { rawBody: true },  // ativa rawBody para esta rota
    schema: { hide: true },     // ocultar do Swagger
    handler: wooviWebhookController,
  })
}
```

### Validação da assinatura

```typescript
// src/modules/payments/service.ts
import crypto from 'node:crypto'

export function validateWooviSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
  const expected = crypto
    .createHmac('sha1', process.env.WOOVI_WEBHOOK_SECRET!)
    .update(rawBody)       // RAW BODY — nunca JSON.stringify do body já parseado
    .digest('hex')
  // timingSafeEqual previne timing attack — nunca usar ===
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signatureHeader, 'hex'))
}
```

### Fluxo do handler do webhook

```typescript
export async function handleWooviWebhook(
  rawBody: string,
  signature: string,
  payload: unknown
): Promise<void> {
  // 1. Validar assinatura — rejeitar se inválida
  if (!validateWooviSignature(rawBody, signature)) {
    throw new AppError(401, 'INVALID_SIGNATURE', 'Assinatura do webhook inválida')
  }

  const body = payload as { event: string; charge: { correlationID: string } }

  // 2. Ignorar eventos que não sejam de pagamento confirmado
  if (body.event !== 'OPENPIX:CHARGE_COMPLETED') return

  // 3. Buscar pagamento pelo correlationID
  const pagamento = await findPagamentoByCorrelationId(body.charge.correlationID)
  if (!pagamento || pagamento.status !== 'ACTIVE') return  // idempotência

  // 4. Calcular expiração: now + 30 dias
  const premiumExpires = new Date()
  premiumExpires.setDate(premiumExpires.getDate() + 30)

  // 5. Ativar premium e atualizar pagamento atomicamente
  await Promise.all([
    updatePagamentoStatus(pagamento.id, 'COMPLETED', premiumExpires),
    activateUserPremium(pagamento.usuario_id, premiumExpires), // de plans/repository.ts
  ])
}
```

### Controller do webhook

```typescript
export async function wooviWebhookController(request: FastifyRequest, reply: FastifyReply) {
  const signature = request.headers['x-webhook-signature'] as string ?? ''
  await handleWooviWebhook(
    (request as any).rawBody as string,  // rawBody injetado pelo plugin @fastify/rawbody
    signature,
    request.body
  )
  return reply.code(200).send({ ok: true })  // sempre 200 — Woovi retenta em caso de falha
}
```

## Repository Payments

```typescript
// src/modules/payments/repository.ts
export async function createPagamento(data: {
  correlation_id: string
  usuario_id: number
  valor_centavos: number
  status: string
  woovi_charge_id?: string
}) {
  return prisma.pagamentos.create({ data })
}

export async function findPagamentoByCorrelationId(correlationId: string) {
  return prisma.pagamentos.findUnique({ where: { correlation_id: correlationId } })
}

export async function updatePagamentoStatus(id: number, status: string, premiumExpiresAt?: Date) {
  return prisma.pagamentos.update({
    where: { id },
    data: { status, ...(premiumExpiresAt ? { premium_expires_at: premiumExpiresAt } : {}) },
  })
}
```

## O que a IA NUNCA deve fazer

- Omitir a validação de assinatura do webhook — falha crítica de segurança (OWASP A01)
- Usar o body já parseado (`request.body`) para calcular o HMAC — deve ser o `rawBody` bruto
- Usar `===` para comparar assinaturas — usar `crypto.timingSafeEqual` (previne timing attack)
- Colocar `"Bearer "` antes do `WOOVI_API_KEY` no header Authorization — a Woovi usa AppID direto
- Passar o valor em reais para a Woovi — sempre centavos (`Int`, nunca `Float`)
- Retornar HTTP 4xx/5xx para o webhook da Woovi — ela vai retentar; sempre retornar 200 após log
- Esquecer de atualizar `is_premium` E `premium_expires_at` na tabela `usuarios` ao confirmar pagamento
- Criar a rota `/webhooks/woovi` com `fastify.authenticate` — ela não recebe JWT
