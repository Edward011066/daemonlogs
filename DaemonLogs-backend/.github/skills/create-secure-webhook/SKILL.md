---
name: create-secure-webhook
description: "Use when: criar webhook, webhook seguro, webhook com assinatura, rota de webhook, integração webhook externo, webhook Woovi, webhook MisticPay, webhook PIX, receber eventos externos, validação HMAC, validação RSA, raw body webhook, idempotência webhook, processar payload externo, validar assinatura de terceiro."
argument-hint: "Provedor do webhook (Woovi/MisticPay/outro) e evento esperado."
user-invocable: true
---

# Skill: Criar Webhook Seguro

Cria uma rota de webhook externa com validação de assinatura e idempotência, seguindo o padrão DaemonLogs.

## Princípios de segurança para webhooks

1. **Nunca usar `fastify.authenticate`** — webhooks externos não têm JWT
2. **Validar assinatura antes de processar qualquer dado**
3. **Sempre responder 200** mesmo em erro lógico — gateways reenviam para qualquer status != 2xx
4. **Checar idempotência** — gateway pode enviar o mesmo evento mais de uma vez
5. **Usar rawBody** — assinaturas são calculadas sobre o payload bruto, não o parseado
6. **Comparações com `crypto.timingSafeEqual()`** — nunca `===` para tokens/hashes

---

## Passo a passo

### 1. Registrar rawBody no plugin (se ainda não configurado)

```typescript
// Em src/app.ts ou no plugin de content-type
// O plugin fastify-raw-body deve estar registrado ANTES das rotas
import rawBody from 'fastify-raw-body'

await fastify.register(rawBody, {
  field: 'rawBody',  // disponível como request.rawBody
  global: false,     // ativar só nas rotas que precisam
  encoding: 'utf8',
})
```

### 2. Rota do Webhook

```typescript
// src/modules/payments/webhook-routes.ts (ou arquivo separado de webhooks)
import { FastifyInstance } from 'fastify'
import { handleWebhookController } from './controller.js'

export async function webhookRoutes(fastify: FastifyInstance) {
  // NUNCA fastify.authenticate em webhooks externos
  fastify.post('/webhooks/<provider>', {
    config: {
      rawBody: true,        // habilita request.rawBody nesta rota
      rateLimit: {
        max: 100,           // gateways podem fazer retries — usar limite generoso
        timeWindow: 60_000,
      },
    },
    schema: {
      hide: true,           // esconder do Swagger (endpoint interno)
      // Sem body schema definido aqui — raw body é validado manualmente pela assinatura
    },
    handler: handleWebhookController,
  })
}
```

### 3. Controller do Webhook

```typescript
// src/modules/payments/controller.ts
export async function handleWebhookController(request: FastifyRequest, reply: FastifyReply) {
  const rawBody = request.rawBody as string
  const signature = request.headers['x-webhook-signature'] as string ?? ''

  // 1. Validar assinatura PRIMEIRO — antes de qualquer acesso ao body
  const isValid = validateSignature(rawBody, signature)
  if (!isValid) {
    // Logar tentativa inválida (sem revelar detalhes)
    request.log.warn({ ip: request.ip }, 'Webhook com assinatura inválida recebido')
    // Responder 200 para evitar que gateway marque endpoint como down
    return reply.code(200).send({ received: true })
  }

  // 2. Parsear body apenas após validar assinatura
  const payload = JSON.parse(rawBody)

  // 3. Chamar service — processar em background se demorado
  void processWebhookService(payload).catch(err => request.log.error(err))

  // 4. Sempre responder 200 rapidamente
  return reply.code(200).send({ received: true })
}
```

### 4. Validação de Assinatura — HMAC-SHA256

```typescript
// Para provedores com segredo compartilhado (HMAC)
import crypto from 'node:crypto'

export function validateHmacSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret || !signatureHeader) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  // Normalizar formato: alguns provedores enviam "sha256=<hex>", outros só "<hex>"
  const receivedHex = signatureHeader.replace(/^sha256=/, '')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(receivedHex, 'hex'),
    )
  } catch {
    return false  // buffers com tamanho diferente lançam erro — assinar como inválido
  }
}
```

### 5. Validação de Assinatura — RSA-SHA256 (ex: Woovi)

```typescript
// Para provedores com chave pública RSA
import crypto from 'node:crypto'

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
<chave_publica_do_provedor>
-----END PUBLIC KEY-----`

export function validateRsaSignature(rawBody: string | Buffer, signatureB64: string): boolean {
  if (!signatureB64) return false
  try {
    const verifier = crypto.createVerify('RSA-SHA256')
    verifier.update(rawBody)
    return verifier.verify(PUBLIC_KEY, Buffer.from(signatureB64, 'base64'))
  } catch {
    return false
  }
}
```

### 6. Idempotência no Service

```typescript
// src/modules/payments/service.ts
export async function processWebhookService(payload: SomePayload) {
  const correlationId = payload.correlationID  // ou equivalente do provedor

  // Checar se já processamos este evento
  const existing = await findPagamentoPorCorrelationId(correlationId)
  if (existing?.status === 'COMPLETED') {
    return  // idempotente — não processar duas vezes
  }

  // Processar pagamento...
  await updatePagamentoStatus(correlationId, 'COMPLETED')
}
```

---

## Checklist de segurança

- [ ] **Sem** `fastify.authenticate` na rota de webhook
- [ ] `config: { rawBody: true }` na rota
- [ ] `schema: { hide: true }` para esconder do Swagger
- [ ] Validar assinatura **antes** de parsear ou usar o body
- [ ] Usar `crypto.timingSafeEqual()` — nunca `===`
- [ ] Responder `200` sempre — inclusive em assinatura inválida (logar silenciosamente)
- [ ] Checar idempotência no service antes de processar
- [ ] Processar em background (`void asyncFn().catch(log)`) se operação demorada
- [ ] Nunca logar o payload completo em produção (pode conter dados sensíveis)
- [ ] Variável de segredo lida de `process.env` — nunca hardcoded no código

## Padrão de resposta do DaemonLogs

Os webhooks do DaemonLogs atualizam `status` dos pagamentos:
- `PENDING` → `COMPLETED` (ao receber confirmação de pagamento)
- `PENDING` → `EXPIRED` (ao receber expiração)

Ver `payments.instructions.md` para o fluxo Woovi e `misticpay.instructions.md` para MisticPay.
