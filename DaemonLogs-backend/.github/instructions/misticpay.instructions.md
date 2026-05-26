---
description: "Use when: implementar integração MisticPay, API MisticPay, pagamentos MisticPay, PIX MisticPay, cash-in, cash-out, saque crypto, webhook MisticPay, MEDs, infractions, defesa de infração, ci, cs, client id, client secret, api.misticpay.com, transactions/create, transactions/withdraw, transactions/check, users/balance, users/info, users/transactions/list, meds/infractions, crypto/withdraw-api, projectWebhook."
applyTo: "src/modules/payments/**"
---

# MisticPay — Consulta obrigatória da documentação

> **Fonte de verdade**: [Documentação da API MisticPay.md](../../Documentação%20da%20API%20MisticPay.md) na raiz do repositório.
> Antes de qualquer implementação, leia o arquivo acima. Nunca inferir endpoints, autenticação ou payloads sem consultá-lo.

## Regra principal

Antes de escrever, alterar, revisar, explicar ou propor qualquer código relacionado à MisticPay, leia primeiro o arquivo `Documentação da API MisticPay.md`.

Se a tarefa mencionar a MisticPay de forma direta ou indireta, a consulta ao arquivo é obrigatória. Isso inclui: `ci`, `cs`, `api.misticpay.com`, `cash-in`, `cash-out`, `PIX`, `saque crypto`, `USDT BEP20`, `MEDs`, `infractions`, `defense`, `justificativa`, `proofs`, `projectWebhook`, `transactions/create`, `transactions/withdraw`, `transactions/check`, `users/balance`, `users/info`, `users/transactions/list`, `crypto/withdraw-api`, `crypto/fees`.

## Padrões de implementação no projeto

### Variáveis de ambiente

```env
MISTICPAY_CI=        # Client ID (header ci)
MISTICPAY_CS=        # Client Secret (header cs)
MISTICPAY_CHARGE_VALUE_CENTS=3990     # valor em centavos internamente — dividir por 100 ao chamar a API
MISTICPAY_CHARGE_EXPIRY_SECONDS=3600  # usado localmente para marcar charge_expires_at
```

### Autenticação

```typescript
// SEMPRE headers ci/cs — nunca Authorization Bearer
{
  ci: process.env.MISTICPAY_CI!,
  cs: process.env.MISTICPAY_CS!,
  'Content-Type': 'application/json',
}
```

### Criar cobrança (`POST /api/transactions/create`)

Parâmetros obrigatórios usados pelo projeto:

| Campo | Fonte |
|-------|-------|
| `amount` | `MISTICPAY_CHARGE_VALUE_CENTS / 100` (reais, não centavos) |
| `payerName` | `usuarios.username` (username do Discord do usuário autenticado) |
| `payerDocument` | `"84033724001"` — hardcoded; API exige mas não usa o valor |
| `transactionId` | `correlation_id` gerado pelo backend (`premium-${userId}-${Date.now()}`) |
| `description` | `"Assinatura Premium - 30 dias"` |
| `projectWebhook` | `process.env.APP_URL + '/webhooks/misticpay'` |

Campos **ignorados**: `splitUser`, `splitTax`.

Campos da resposta usados pelo projeto:

| Campo da API | Campo do banco |
|--------------|----------------|
| `data.qrCodeBase64` | `qrcode_image` |
| `data.copyPaste` | `brcode` |
| `data.transactionId` | `woovi_charge_id` (ID interno MisticPay — usado no webhook) |

### Webhook (`POST /webhooks/misticpay`)

- MisticPay **não envia assinatura HMAC** → a rota **não usa** `fastify-raw-body`
- Validação defensiva: chamar `POST /api/transactions/check` antes de ativar premium
- Identificar pagamento por `woovi_charge_id = String(body.transactionId)`
- Só processar quando `body.transactionType === 'DEPOSITO' && body.status === 'COMPLETO'`
- Retornar sempre `200 { ok: true }` — MisticPay pode retentar em falha

### Verificação defensiva do webhook

```typescript
// Consulta MisticPay para confirmar status antes de ativar premium
const response = await fetch('https://api.misticpay.com/api/transactions/check', {
  method: 'POST',
  headers: { ci, cs, 'Content-Type': 'application/json' },
  body: JSON.stringify({ transactionId }),
})
// Validar: data.transaction.transactionState === 'COMPLETO'
```

### Seleção de gateway

O sistema suporta Woovi e MisticPay como gateways alternativos. Apenas 1 deve estar ativo (credenciais preenchidas) ao mesmo tempo. A função `getActiveGateway()` em `src/modules/payments/service.ts` determina qual usar checando as variáveis de ambiente.

### Schema — coluna `gateway`

A tabela `pagamentos` possui a coluna `gateway VARCHAR(20) DEFAULT 'woovi'`. Ao criar um pagamento MisticPay, usar `gateway: 'misticpay'`.

## O que a IA NUNCA deve fazer

- Consultar endpoints, autenticação ou payloads da MisticPay sem antes ler `Documentação da API MisticPay.md`
- Usar `Authorization Bearer` — MisticPay usa `ci`/`cs` nos headers
- Enviar `amount` em centavos para a MisticPay — a API espera reais (ex: `39.90`, não `3990`)
- Reutilizar padrões da Woovi/OpenPix como se fossem da MisticPay
- Ativar premium no webhook da MisticPay sem verificação defensiva via `/api/transactions/check`
- Aplicar `fastify.authenticate` na rota `/webhooks/misticpay` — é webhook externo sem JWT
- Usar `fastify-raw-body` na rota MisticPay — não há HMAC para calcular
- Inventar campos, status ou eventos de webhook sem respaldo no arquivo de documentação
