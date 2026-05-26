# Documentação da API MisticPay

Esta documentação detalha a API da MisticPay, uma plataforma de pagamentos que facilita o recebimento e envio de pagamentos via PIX, além de saques em criptomoedas. O objetivo é fornecer um guia claro e estruturado para agentes de IA programadores integrarem e utilizarem os serviços da MisticPay.

## 1. Visão Geral

A MisticPay oferece uma API completa para gerenciar transações financeiras, incluindo:

*   **Recebimento de Pagamentos (Cash-In)**: Geração de QR Codes PIX para recebimento instantâneo.
*   **Realização de Saques (Cash-Out)**: Transferências via PIX para chaves PIX tradicionais e saques em criptomoedas (USDT BEP20).
*   **Consultas**: Verificação de saldo, dados do usuário e histórico de transações.
*   **Gestão de Infrações (MEDs)**: Listagem e resposta a Mecanismos Especiais de Devolução.
*   **Webhooks**: Notificações automáticas sobre eventos importantes, como depósitos, saques e infrações.

## 2. Autenticação

Todas as requisições à API da MisticPay exigem autenticação via `Client ID` (`ci`) e `Client Secret` (`cs`). Essas credenciais devem ser enviadas nos **headers** de cada requisição HTTP.

**Headers Obrigatórios:**

```
ci: seu_client_id
cs: seu_client_secret
Content-Type: application/json
```

## 3. Referência da API

### 3.1. Gerar transação (Cash-In)

Cria uma nova transação PIX para receber pagamento de um cliente. Retorna QR Code e dados da transação.

*   **Endpoint:** `POST /api/transactions/create`
*   **Tipo:** `cashin`

**Parâmetros (Body JSON):**

| Parâmetro       | Tipo     | Descrição                                            | Obrigatório |
| :-------------- | :------- | :--------------------------------------------------- | :---------- |
| `amount`        | `number` | Valor em reais para receber. Ex: `4.55` = R$ 4,55    | Sim         |
| `payerName`     | `string` | Nome do pagador da transação                         | Sim         |
| `payerDocument` | `string` | Documento CPF do pagador (sem formatação: `12345678909`) | Sim         |
| `transactionId` | `string` | ID da sua aplicação para identificação da transação  | Sim         |
| `description`   | `string` | Descrição do pagamento                               | Sim         |
| `projectWebhook`| `string` | URL do webhook (opcional)                            | Não         |
| `splitUser`     | `string` | Email do usuário na plataforma que receberá a divisão (opcional) | Não         |
| `splitTax`      | `number` | Porcentagem da taxa de divisão (opcional)            | Não         |

**Exemplo de Requisição (cURL):**

```bash
curl -X POST 'https://api.misticpay.com/api/transactions/create' \
  --header 'ci: seu_client_id' \
  --header 'cs: seu_client_secret' \
  --header 'Content-Type: application/json' \
  --data '{
  "amount": 5,
  "payerName": "Nome do cliente",
  "payerDocument": "12345678909",
  "transactionId": "id_da_sua_aplicacao_para_identificacao",
  "description": "Pagamento do cliente TAL"
}'
```

**Exemplo de Resposta (JSON):**

```json
{
  "message": "Transação criada com sucesso",
  "data": {
    "transactionId": "31484480",
    "payer": {
      "name": "Nome do cliente",
      "document": "12345678909"
    },
    "transactionFee": 23,
    "transactionType": "DEPOSITO",
    "transactionMethod": "PIX",
    "transactionAmount": 455,
    "transactionState": "PENDENTE",
    "qrCodeBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcgAAAHICAY...",
    "qrcodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...",
    "copyPaste": "00020101021226820014br.gov.bcb.pix2560qrcode.pagsm.com.br/pix/..."
  }
}
```

### 3.2. Gerar transação Interna

Cria uma transação interna vinculada a um usuário pelo e-mail.

*   **Endpoint:** `POST /api/transactions/withdraw/internal`
*   **Tipo:** `internal`

**Parâmetros (Body JSON):**

| Parâmetro     | Tipo     | Descrição                                | Obrigatório |
| :------------ | :------- | :--------------------------------------- | :---------- |
| `email`       | `string` | Email do recebedor                       | Sim         |
| `amount`      | `number` | Valor da transação                       | Sim         |
| `description` | `string` | Descrição da transação                   | Sim         |

**Exemplo de Requisição (cURL):**

```bash
curl -X POST 'https://api.misticpay.com/api/transactions/withdraw/internal' \
  --header 'ci: seu_client_id' \
  --header 'cs: seu_client_secret' \
  --header 'Content-Type: application/json' \
  --data '{
  "email": "emailrecebedor@gmail.com",
  "amount": 2,
  "description": "teste"
}'
```

**Exemplo de Resposta (JSON):**

```json
{
  "message": "Transferência realizada com sucesso",
  "data": {
    "transactionId": "id-da-transacao",
    "amount": 1,
    "recipientEmail": "emailrecebedor@gmail.com",
    "recipientName": "Nome do recebedor"
  }
}
```

### 3.3. Consultar saldo

Retorna o saldo disponível na conta.

*   **Endpoint:** `GET /api/users/balance`
*   **Tipo:** `cashout` ou `all`

**Exemplo de Requisição (cURL):**

```bash
curl -X GET 'https://api.misticpay.com/api/users/balance' \
  --header 'ci: seu_client_id' \
  --header 'cs: seu_client_secret'
```

**Exemplo de Resposta (JSON):**

```json
{
  "message": "Saldo obtido com sucesso",
  "data": {
    "balance": 0.00
  }
}
```

### 3.4. Consultar dados do usuário

Retorna os dados do usuário autenticado pelas credenciais CI/CS. Inclui informações pessoais, status da conta e saldo disponível.

*   **Endpoint:** `GET /api/users/info`
*   **Tipo:** `consulta`

**Campos Retornados:**

| Campo           | Tipo      | Descrição                                    |
| :-------------- | :-------- | :------------------------------------------- |
| `name`          | `string`  | Nome do usuário                              |
| `email`         | `string`  | Email do usuário                             |
| `document`      | `string`  | CPF/CNPJ do usuário                          |
| `phone`         | `string`  | Telefone do usuário                          |
| `accountVerified`| `boolean` | Se a conta do usuário está verificada        |
| `documentVerified`| `boolean` | Se o documento do usuário está verificado    |
| `withdrawBlocked`| `boolean` | Se o saque está bloqueado para o usuário     |
| `availableBalance`| `number`  | Saldo disponível (saldo total - saldo bloqueado) |
| `blockedBalance`| `number`  | Saldo bloqueado por MEDs ou outras restrições |

**Exemplo de Requisição (cURL):**

```bash
curl -X GET 'https://api.misticpay.com/api/users/info' \
  --header 'ci: seu_client_id' \
  --header 'cs: seu_client_secret'
```

**Exemplo de Resposta (JSON):**

```json
{
  "message": "Dados do usuário encontrados com sucesso",
  "data": {
    "name": "João Silva",
    "email": "joao@email.com",
    "document": "12345678909",
    "phone": "11999999999",
    "accountVerified": true,
    "documentVerified": true,
    "withdrawBlocked": false,
    "availableBalance": 850.00,
    "blockedBalance": 150.00
  }
}
```

### 3.5. Solicitar saque

Solicita um saque via PIX para uma chave PIX. O valor será debitado do saldo disponível. Suporta chaves PIX tradicionais (CPF, CNPJ, Email, Telefone, Chave Aleatória).

*   **Endpoint:** `POST /api/transactions/withdraw`
*   **Tipo:** `cashout`

**Parâmetros (Body JSON):**

| Parâmetro      | Tipo     | Descrição                                            | Obrigatório |
| :------------- | :------- | :--------------------------------------------------- | :---------- |
| `amount`       | `number` | Valor em reais para receber. Ex: `100` = R$ 100,00   | Sim         |
| `pixKey`       | `string` | Chave PIX do destinatário (sem formatação: `12345678909`). | Sim         |
| `pixKeyType`   | `string` | Tipo da chave PIX: `"CPF"`, `"CNPJ"`, `"EMAIL"`, `"TELEFONE"`, `"CHAVE_ALEATORIA"` | Sim         |
| `description`  | `string` | Descrição do pagamento                               | Sim         |
| `projectWebhook`| `string` | URL do webhook para notificações (opcional)         | Não         |

**Exemplo de Requisição (cURL):**

```bash
curl -X POST 'https://api.misticpay.com/api/transactions/withdraw' \
  --header 'ci: seu_client_id' \
  --header 'cs: seu_client_secret' \
  --header 'Content-Type: application/json' \
  --data '{
  "amount": 1,
  "pixKey": "12345678909",
  "pixKeyType": "CPF",
  "description": "saque com id",
  "projectWebhook": "https://webhooktrack.com/api/webhook/bZ_7mnNS"
}'
```

**Exemplo de Resposta (JSON):**

```json
{
  "message": "Saque adicionado à fila de processamento",
  "data": {
    "jobId": "withdraw-4-1764365277110-jxqfvna",
    "transactionId": 54345,
    "status": "QUEUED",
    "message": "Seu saque será processado em breve"
  }
}
```

### 3.6. Solicitar saque crypto

Solicita um saque em criptomoeda (USDT BEP20) para uma wallet. O valor será debitado do saldo disponível e convertido para USDT.

*   **Endpoint:** `POST /api/crypto/withdraw-api`
*   **Tipo:** `cashout`

**Parâmetros (Body JSON):**

| Parâmetro       | Tipo     | Descrição                                            | Obrigatório |
| :-------------- | :------- | :--------------------------------------------------- | :---------- |
| `amount`        | `number` | Valor em reais para sacar. Ex: `100` = R$ 100,00     | Sim         |
| `wallet`        | `string` | Endereço da carteira USDT BEP20 do destinatário      | Sim         |
| `projectWebhook`| `string` | URL do webhook para notificações (opcional)         | Não         |

**Exemplo de Requisição (cURL):**

```bash
curl -X POST 'https://api.misticpay.com/api/crypto/withdraw-api' \
  --header 'ci: seu_client_id' \
  --header 'cs: seu_client_secret' \
  --header 'Content-Type: application/json' \
  --data '{
  "amount": 100,
  "wallet": "0x1234567890123456789012345678901234567890",
  "projectWebhook": "https://webhook.example.com/api/webhook"
}'
```

**Exemplo de Resposta (JSON):**

```json
{
  "message": "Saque crypto adicionado à fila de processamento",
  "data": {
    "jobId": "crypto-withdraw-4-1764365277110-jxqfvna",
    "transactionId": 54345,
    "status": "QUEUED",
    "message": "Seu saque crypto será processado em breve"
  }
}
```

### 3.7. Consultar taxas de cripto

Consulta informações sobre as taxas de cripto, incluindo taxa da plataforma, taxa de rede e cotação atual.

*   **Endpoint:** `GET /api/crypto/fees`
*   **Tipo:** `info`

**Informações Importantes:**

*   Taxa da plataforma: 3% sobre o valor informado.
*   Taxa de rede: R$ 3,00 (fixa, apenas para informação - já descontada automaticamente pela rede).
*   Inclui cotação atual BRL/USD.

**Exemplo de Requisição (cURL):**

```bash
curl -X GET 'https://api.misticpay.com/api/crypto/fees' \
  --header 'ci: seu_client_id' \
  --header 'cs: seu_client_secret' \
  --header 'Content-Type: application/json'
```

**Exemplo de Resposta (JSON):**

```json
{
  "message": "Taxas obtidas com sucesso",
  "data": {
    "quote": {
      "brlPerUSD": 5.25,
      "networkFee": 3.0,
      "fixedFeeUSDT": 0.5,
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "fees": {
      "platformFeePercentage": 3,
      "networkFee": 3.0
    }
  }
}
```

### 3.8. Verificar transação

Consulte o status e detalhes de uma transação específica.

*   **Endpoint:** `POST /api/transactions/check`

**⚠️ Rate Limit:** Esta rota possui rate limit de `60 requisições por minuto por IP`. Requisições que excederem este limite retornarão erro 429.

**Parâmetros (Body JSON):**

| Parâmetro       | Tipo            | Descrição                      | Obrigatório |
| :-------------- | :-------------- | :----------------------------- | :---------- |
| `transactionId` | `string` \| `number` | ID da transação a ser verificada | Sim         |

**Exemplo de Requisição (cURL):**

```bash
curl -X POST 'https://api.misticpay.com/api/transactions/check' \
  --header 'ci: seu_client_id' \
  --header 'cs: seu_client_secret' \
  --header 'Content-Type: application/json' \
  --data '{
  "transactionId": "54345"
}'
```

**Exemplo de Resposta (JSON):**

```json
{
  "message": "Transação encontrada com sucesso!",
  "transaction": {
    "transactionId": "301124932.60430735",
    "value": 1.12,
    "fee": 0.31,
    "transactionState": "COMPLETO",
    "transactionType": "DEPOSITO",
    "transactionMethod": "PIX",
    "createdAt": "2025-12-02T01:20:18.475Z",
    "updatedAt": "2025-12-02T01:20:53.002Z"
  }
}
```

**Status Possíveis da Transação:**

| Status     | Descrição                               |
| :--------- | :-------------------------------------- |
| `PENDENTE` | Transação pendente, aguardando pagamento |
| `COMPLETO` | Transação aprovada e concluída com sucesso |
| `FALHA`    | Transação falhou ou foi rejeitada       |

### 3.9. Listar transações

Lista as transações do usuário com paginação e filtro por status. Retorna no máximo 10 transações por página.

*   **Endpoint:** `GET /api/users/transactions/list/:page`
*   **Tipo:** `consulta`

**Autenticação:** Esta rota utiliza autenticação via `CI/CS` (Client ID / Client Secret) nos headers da requisição.

**Parâmetros (URL):**

| Parâmetro  | Tipo     | Descrição                                            | Obrigatório |
| :--------- | :------- | :--------------------------------------------------- | :---------- |
| `page`     | `number` | Número da página a ser retornada (padrão: `1`)       | Sim         |
| `perPage`  | `number` | Número de itens por página (padrão: `10`, máximo: `10`) | Não         |
| `status`   | `string` | Filtro por status da transação (opcional). Valores: `PENDENTE`, `COMPLETO`, `FALHA`, `CANCELADO` | Não         |

**Exemplo de Requisição (cURL):**

```bash
curl -X GET 'https://api.misticpay.com/api/users/transactions/list/1?status=COMPLETO' \
  --header 'ci: seu_client_id' \
  --header 'cs: seu_client_secret' \
  --header 'Content-Type: application/json'
```

**Exemplo de Resposta (JSON):**

```json
{
  "message": "Lista de transações obtida com sucesso",
  "data": [
    {
      "id": 934866,
      "value": 2,
      "fee": 0.15,
      "clientName": "Gustavo",
      "clientDocument": "15810217478",
      "description": "Checkout 1042 - teste",
      "requestIp": "::1",
      "updatedAt": "2026-03-04T23:47:23.257Z",
      "transactionState": "COMPLETO",
      "transactionType": "DEPOSITO",
      "transactionMethod": "PIX",
      "source": "CHECKOUT",
      "endToEndId": null,
      "clientTransactionId": "checkout-1042-1772668040504-1awhmwv",
      "createdAt": "2026-03-04T23:47:23.257Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 10,
    "totalPages": 5
  }
}
```

**Campos Retornados (Objeto `data`):**

| Campo             | Tipo     | Descrição                                    |
| :---------------- | :------- | :------------------------------------------- |
| `id`              | `number` | ID da transação                              |
| `value`           | `number` | Valor da transação em reais                  |
| `fee`             | `number` | Taxa cobrada na transação                    |
| `clientName`      | `string` | Nome do cliente da transação                 |
| `clientDocument`  | `string` | Documento do cliente (pode estar mascarado)  |
| `description`     | `string` | Descrição da transação                       |
| `requestIp`       | `string` | IP de origem da requisição                   |
| `transactionState`| `string` | Estado da transação: `PENDENTE`, `COMPLETO`, `FALHA` ou `CANCELADO` |n| `transactionType` | `string` | Tipo da transação (ex: `DEPOSITO`, `RETIRADA`) |n| `transactionMethod`| `string` | Método da transação (ex: `PIX`)              |
| `source`          | `string` | Origem da transação (ex: `API`, `CHECKOUT`)  |
| `endToEndId`      | `string` \| `null` | Identificador end-to-end do PIX (quando disponível) |n| `clientTransactionId`| `string` | ID da transação do cliente                   |
| `createdAt`       | `string` | Data de criação (ISO 8601)                   |
| `updatedAt`       | `string` | Data da última atualização (ISO 8601)        |
| `pagination.page` | `number` | Página atual                                 |
| `pagination.perPage`| `number` | Itens por página (fixo: 10)                  |
| `pagination.total`| `number` | Total de transações na página atual          |
| `pagination.totalPages`| `number` | Total de páginas disponíveis                |

**Filtros de Status:**

| Status     | Descrição                               |
| :--------- | :-------------------------------------- |
| `PENDENTE` | Transação pendente, aguardando pagamento |
| `COMPLETO` | Transação aprovada e concluída com sucesso |
| `FALHA`    | Transação falhou ou foi rejeitada       |
| `CANCELADO`| Transação cancelada                     |

**Erros Possíveis:**

| Código | Descrição                                    |
| :----- | :------------------------------------------- |
| `400`  | Credenciais de integração não enviadas (ci e cs nos headers) |
| `401`  | Credenciais inválidas                         |

## 4. MEDs (Infrações)

### 4.1. Listar infrações

Lista todas as infrações (MEDs) registradas para sua conta, com paginação. Inclui detalhes da transação associada e respostas de defesa enviadas.

*   **Endpoint:** `GET /api/meds/infractions/list`

**Autenticação:** Esta rota utiliza autenticação via `CI/CS` (Client ID / Client Secret) nos headers da requisição.

**Parâmetros (URL):**

| Parâmetro  | Tipo     | Descrição                                            | Obrigatório |
| :--------- | :------- | :--------------------------------------------------- | :---------- |
| `page`     | `number` | Número da página a ser retornada (padrão: `1`)       | Sim         |
| `perPage`  | `number` | Número de itens por página (padrão: `10`, máximo: `10`) | Não         |

**Exemplo de Requisição (cURL):**

```bash
curl -X GET 'https://api.misticpay.com/api/meds/infractions/list?page=1' \
  --header 'ci: seu_client_id' \
  --header 'cs: seu_client_secret'
```

**Exemplo de Resposta (JSON):**

```json
{
  "data": {
    "infractions": [
      {
        "id": 42,
        "externalId": "INF-2026-001",
        "type": "FRAUD",
        "status": "WAITING_PSP",
        "source": "ONLYUP",
        "endToEndId": "E00000000202602161750abcdef123456",
        "reportedBy": "DEBITED_PARTICIPANT",
        "reportDetails": "Transação não reconhecida",
        "analysisResult": null,
        "amount": 150.00,
        "currency": "BRL",
        "createdAt": "2026-02-16T17:50:00.000Z",
        "transaction": {
          "id": 31484,
          "value": 150.00,
          "externalId": "TXN-12345",
          "clientTransactionId": "301124932.60430735",
          "endToEndId": "E00000000202602161750abcdef123456",
          "transactionState": "COMPLETO",
          "transactionType": "DEPOSITO",
          "createdAt": "2026-02-16T17:45:00.000Z"
        },
        "defenseResponses": []
      }
    ],
    "pagination": {
      "page": 1,
      "perPage": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Status Possíveis da Infração:**

| Status        | Descrição                                    |
| :------------ | :------------------------------------------- |
| `WAITING_PSP` | Aguardando análise — você pode enviar defesa |
| `ACCEPTED`    | Infração aceita — devolução será realizada   |
| `REJECTED`    | Infração rejeitada — saldo desbloqueado      |
| `CANCELLED`   | Infração cancelada                           |

### 4.2. Responder infração

Envia uma resposta de defesa para uma infração específica. Só é possível responder infrações com status `WAITING_PSP` e cada infração aceita apenas uma resposta.

**⚠️ Importante:** A defesa só pode ser enviada uma única vez por infração. Certifique-se de que a justificativa esteja completa antes de enviar.

*   **Endpoint:** `POST /api/meds/infractions/:infractionId/defense`

**Parâmetros (URL):**

| Parâmetro      | Tipo     | Descrição                                | Obrigatório |
| :------------- | :------- | :--------------------------------------- | :---------- |
| `infractionId` | `number` | ID da infração (obtido na listagem)      | Sim         |

**Parâmetros (Body JSON):**

| Parâmetro       | Tipo       | Descrição                                            | Obrigatório |
| :-------------- | :--------- | :--------------------------------------------------- | :---------- |
| `analise`       | `string`   | Posicionamento: `"rejeitado"` ou `"aceito"`          | Sim         |
| `justificativa` | `string`   | Texto da defesa (mínimo 10 caracteres)               | Sim         |
| `proofs`        | `string[]` | Array de URLs das provas (mínimo 1, máximo 10)       | Sim         |

**Exemplo de Requisição (cURL):**

```bash
curl -X POST 'https://api.misticpay.com/api/meds/infractions/42/defense' \
  --header 'ci: seu_client_id' \
  --header 'cs: seu_client_secret' \
  --header 'Content-Type: application/json' \
  --data '{
  "analise": "rejeitado",
  "justificativa": "Transação legítima realizada pelo titular da conta.",
  "proofs": [
    "https://exemplo.com/comprovante1.png",
    "https://exemplo.com/comprovante2.pdf"
  ]
}'
```

**Exemplo de Resposta (201 JSON):**

```json
{
  "message": "Defesa enviada com sucesso",
  "data": {
    "id": 7,
    "infractionId": 42,
    "analise": "rejeitado",
    "justificativa": "Transação legítima realizada pelo titular da conta.",
    "proofs": [
      {
        "url": "https://exemplo.com/comprovante1.png",
        "fileName": "prova-1",
        "mimeType": "url"
      },
      {
        "url": "https://exemplo.com/comprovante2.pdf",
        "fileName": "prova-2",
        "mimeType": "url"
      }
    ],
    "createdAt": "2026-02-25T19:30:00.000Z"
  }
}
```

**Erros Possíveis:**

| Código | Descrição                                            |
| :----- | :--------------------------------------------------- |
| `400`  | Campos obrigatórios ausentes, valor inválido para analise, ou infração já resolvida |
| `403`  | A infração não pertence à sua conta                  |
| `404`  | Infração não encontrada                              |
| `409`  | Defesa já enviada para esta infração                 |

## 5. Webhooks

Os webhooks da MisticPay permitem que você receba notificações em tempo real sobre eventos importantes em sua conta. Para configurar um webhook, forneça a URL do seu endpoint no campo `projectWebhook` ao criar uma transação ou saque, ou utilize a URL configurada nas credenciais da sua aplicação.

### 5.1. Webhook de Depósito

Notificação enviada quando um depósito é concluído.

**Estrutura do Webhook de Depósito (JSON):**

```json
{
  "transactionId": 31484480,
  "transactionType": "DEPOSITO",
  "transactionMethod": "PIX",
  "clientName": "Nome do cliente",
  "clientDocument": "12345678909",
  "status": "COMPLETO",
  "value": 455,
  "fee": 23,
  "e2e": "1234567890987654321098765432109876543210987654321098765432109876"
}
```

### 5.2. Webhook de Saque

Notificação enviada quando um saque é concluído.

**Estrutura do Webhook de Saque (JSON):**

```json
{
  "transactionId": 31484480,
  "transactionType": "RETIRADA",
  "transactionMethod": "PIX",
  "clientName": "Nome do cliente",
  "clientDocument": "12345678909",
  "status": "COMPLETO",
  "value": 455,
  "fee": 23,
  "e2e": "1234567890987654321098765432109876543210987654321098765432109876"
}
```

### 5.3. Webhook de MED

Quando uma infração (MED - Mecanismo Especial de Devolução) é registrada ou atualizada para uma transação, o sistema envia automaticamente uma notificação via webhook para a URL configurada na `projectWebhook` da credencial ou da transação.

**⚠️ Importante:** O webhook de MED é disparado tanto na criação da infração quanto em atualizações (ex: quando o resultado da análise é informado). Utilize o campo `infraction.status` para identificar o estado atual.

**Estrutura do Webhook de MED (Infração Criada - JSON):**

```json
{
  "event": "INFRACTION",
  "infraction": {
    "id": 42,
    "externalId": "INF-2026-001",
    "type": "FRAUD",
    "status": "WAITING_PSP",
    "amount": 150.00,
    "currency": "BRL",
    "analysisResult": null,
    "analysisDetails": null,
    "reportedBy": "DEBITED_PARTICIPANT",
    "reportDetails": "Transação não reconhecida pelo titular da conta",
    "createdAt": "2026-02-16T17:50:00.000Z"
  },
  "transaction": {
    "transactionId": "TXN-12345",
    "endToEndId": "E00000000202602161750abcdef123456",
    "value": 150.00,
    "status": "COMPLETO"
  }
}
```

**Estrutura do Webhook de MED (Análise Concluída - JSON):**

```json
{
  "event": "INFRACTION",
  "infraction": {
    "id": 42,
    "externalId": "INF-2026-001",
    "type": "FRAUD",
    "status": "ACCEPTED",
    "amount": 150.00,
    "currency": "BRL",
    "analysisResult": "AGREED",
    "analysisDetails": "Fraude confirmada após análise",
    "reportedBy": "DEBITED_PARTICIPANT",
    "reportDetails": "Transação não reconhecida pelo titular da conta",
    "createdAt": "2026-02-16T17:50:00.000Z"
  },
  "transaction": {
    "transactionId": "TXN-12345",
    "endToEndId": "E00000000202602161750abcdef123456",
    "value": 150.00,
    "status": "COMPLETO"
  }
}
```

**Campos do objeto `infraction`:**

| Campo           | Tipo     | Descrição                                            |
| :-------------- | :------- | :--------------------------------------------------- |
| `id`            | `number` | ID interno da infração                               |
| `externalId`    | `string` | ID externo da infração (gateway)                     |
| `type`          | `string` | Tipo da infração (ex: `FRAUD`, `REFUND_REQUEST`)     |
| `status`        | `string` | `WAITING_PSP`, `ACCEPTED`, `REJECTED` ou `CANCELLED` |
| `amount`        | `number` | Valor da infração em reais                           |
| `currency`      | `string` | Moeda (padrão: `BRL`)                                |
| `analysisResult`| `string` \| `null` | Resultado: `AGREED` (aceita) ou `DISAGREED` (rejeitada) |n| `analysisDetails`| `string` \| `null` | Detalhes adicionais da análise                       |
| `reportedBy`    | `string` \| `null` | Quem reportou: `DEBITED_PARTICIPANT`, `CREDITED_PARTICIPANT` ou `ACCOUNT_HOLDER` |n| `reportDetails` | `string` \| `null` | Detalhes do reporte                                  |
| `createdAt`     | `string` | Data de criação (ISO 8601)                           |

**Campos do objeto `transaction` (dentro do webhook de MED):**

| Campo           | Tipo     | Descrição                                    |
| :-------------- | :------- | :------------------------------------------- |
| `transactionId` | `string` | ID da transação (`clientTransactionId` ou `externalId`) |
| `endToEndId`    | `string` \| `null` | Identificador end-to-end do PIX              |
| `value`         | `number` | Valor original da transação                  |
| `status`        | `string` | Estado atual da transação                    |

**Status da Infração:**

| Status        | Descrição                                    |
| :------------ | :------------------------------------------- |
| `WAITING_PSP` | Aguardando análise — você pode enviar defesa |
| `ACCEPTED`    | Infração aceita — devolução será realizada   |
| `REJECTED`    | Infração rejeitada — saldo desbloqueado      |
| `CANCELLED`   | Infração cancelada                           |

---

**Autor:** Manus AI
**Data:** 26 de maio de 2026
