# Documentação Técnica de API — DaemonLogs

Documento para integração do frontend com a API REST. Atualizado em maio de 2026.

---

## Configuração Base

| Item | Valor |
|------|-------|
| Base URL (dev) | `http://localhost:3000` |
| Base URL (produção) | `https://api.seudominio.com` |
| Formato | JSON — `Content-Type: application/json` |
| Swagger (somente dev) | `http://localhost:3000/api-docs` |
| Health check | `GET /health` → `{ "status": "ok" }` |

---

## Autenticação

A API usa **JWT Bearer Token**. Após o login, inclua o token em todas as requisições protegidas:

```
Authorization: Bearer eyJhbGci...
```

A instância pode operar em dois modos, definido pela variável `AUTH_MODE` no servidor:

| `AUTH_MODE` | Fluxo |
|-------------|-------|
| `local` (padrão) | Registro/login com username + password + e-mail |
| `discord` | Login exclusivo via Discord OAuth2 — sem SMTP, sem senha |

### Fluxo completo — modo `local`

1. `POST /auth/register` — criar conta
2. `POST /auth/activate` — ativar com código do e-mail _(obrigatório se `EMAIL_ENABLED=true`)_
3. `POST /auth/login` — obter JWT
4. Incluir JWT via header `Authorization: Bearer <token>` em todas as rotas protegidas
5. `POST /auth/logout` — invalidar sessão

### Fluxo completo — modo `discord`

1. Redirecionar o usuário para `GET /auth/discord` — a API redireciona automaticamente para a página de autorização do Discord
2. O Discord redireciona de volta para `/auth/discord/callback` com `?code=...&state=...`
3. A API valida, cria/atualiza o usuário e redireciona para o frontend com `?token=JWT`
4. Armazenar o JWT recebido e incluí-lo em todas as rotas protegidas

```typescript
// Iniciar login Discord — redirecionar o navegador para:
window.location.href = `${BASE_URL}/auth/discord`

// Na página de callback do frontend, ler o token da URL:
const params = new URLSearchParams(window.location.search)
const token = params.get('token')
if (token) localStorage.setItem('jwt_token', token)
```

> **Sessão única por usuário:** um novo login de um IP diferente no mesmo dia retorna erro `SESSION_IP_BLOCKED` com o timestamp de quando poderá tentar novamente. Sessões Discord OAuth não verificam IP.

---

## Formato de Erros

Todos os erros seguem este formato:

```json
{
  "error": "CÓDIGO_DO_ERRO",
  "message": "Mensagem legível para exibir ao usuário",
  "meta": { }
}
```

O campo `meta` é opcional e aparece em casos específicos (ex: rate limit inclui `retryAfter`).

### Códigos HTTP comuns

| Status | Significado |
|--------|-------------|
| `400` | Dados inválidos — falha de validação do body/query |
| `401` | Não autenticado — token ausente, expirado ou inválido |
| `403` | Sem permissão — plano insuficiente, cooldown ativo, etc. |
| `404` | Recurso não encontrado |
| `409` | Conflito — processo já em andamento, recurso duplicado |
| `429` | Rate limit atingido |
| `500` | Erro interno do servidor |

### Erro de rate limit

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Muitas requisições. Tente novamente em 30 segundos.",
  "meta": { "retryAfter": 30 }
}
```

Após múltiplas violações, o IP é banido temporariamente com `error: "RATE_LIMIT_BANNED"`.

---

## Atenção: Discord IDs (Snowflakes)

Discord IDs são números de 18-19 dígitos que **excedem o limite seguro de JavaScript** (`Number.MAX_SAFE_INTEGER`). A API já aplica um parser customizado no backend, mas o frontend deve:

- **Sempre enviar** Discord IDs como **string** no body
- **Sempre tratar** como string ao receber — nunca converter para `number`

```typescript
// ✅ Correto
const body = { discord_user_id: "1234567890123456789" }

// ❌ Errado — perde precisão silenciosamente
const body = { discord_user_id: 1234567890123456789 }
```

---

## Operações Assíncronas (202 Accepted)

Endpoints de longa duração retornam **imediatamente com status `202`** e executam em background. O processo pode levar de segundos a alguns minutos.

**Endpoints que retornam 202:**

| Endpoint | Cancelar via |
|----------|-------------|
| `POST /tools/close-dm` | `POST /tools/cancel-current-process` |
| `POST /tools/leave-server` | `POST /tools/cancel-current-process` |
| `POST /tools/delete-relationships` | `POST /tools/cancel-current-process` |
| `POST /clear-chat/channel` | `POST /clear-chat/cancel` |
| `POST /clear-chat/server` | `POST /clear-chat/cancel` |
| `POST /clear-chat/dms` | `POST /clear-chat/cancel` |

**Resposta imediata (202):**
```json
{ "message": "Processo iniciado. Use POST /tools/cancel-current-process para cancelar." }
```

**Verificar status:**
- Tools: `GET /tools/status` → `{ "active": true | false }`
- Clear-chat: atualizar `GET /me` para ver quota consumida

> Se tentar iniciar um segundo processo enquanto um já está ativo, recebe `409 PROCESS_ALREADY_RUNNING`.

---

## Endpoints por Módulo

### Auth

> Os endpoints disponíveis variam conforme o `AUTH_MODE` configurado no servidor.

**Modo `local`** (padrão):

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| `POST` | `/auth/register` | ❌ | Criar conta |
| `POST` | `/auth/activate` | ❌ | Ativar conta com código recebido por e-mail |
| `POST` | `/auth/resend-activation` | ❌ | Reenviar e-mail de ativação |
| `POST` | `/auth/login` | ❌ | Login — retorna JWT |
| `POST` | `/auth/logout` | ✅ | Logout — invalida sessão |
| `POST` | `/auth/forgot-password` | ❌ | Solicitar redefinição de senha |
| `POST` | `/auth/verify-reset-code` | ❌ | Validar código de redefinição antes de exibir formulário |
| `POST` | `/auth/reset-password` | ❌ | Redefinir senha com código validado |

**Modo `discord`**:

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| `GET` | `/auth/discord` | ❌ | Inicia OAuth2 — redireciona para página de autorização do Discord |
| `GET` | `/auth/discord/callback` | ❌ | Callback do Discord — valida, cria/atualiza usuário, redireciona com JWT |

**POST /auth/register** _(apenas AUTH_MODE=local)_
```json
// Request
{
  "username": "string (3-50 chars)",
  "password": "string (min 6)",
  "email": "string (email válido)",
  "referral_code": "string (opcional)"
}

// Response 201
{ "id": 1, "username": "string", "email": "string" }
```

**GET /auth/discord** _(apenas AUTH_MODE=discord)_
```
// Sem body — redireciona (302) para https://discord.com/oauth2/authorize?...
// Redirecionar o navegador do usuário para este endpoint.
```

**GET /auth/discord/callback** _(apenas AUTH_MODE=discord)_
```
// Query params recebidos automaticamente pelo Discord: ?code=...&state=...
// A API processa e redireciona (302) para:
// DISCORD_OAUTH_FRONTEND_REDIRECT?token=<JWT>
//
// No frontend, leia o token da query string da URL de chegada:
const token = new URLSearchParams(window.location.search).get('token')
```

**POST /auth/login** _(apenas AUTH_MODE=local)_
```json
// Request
{ "username": "string", "password": "string" }

// Response 200
{
  "token": "eyJhbGci...",
  "usuario": { "id": 1, "username": "string" }
}
```

**POST /auth/forgot-password**
```json
// Request
{ "email": "string" }

// Response 200
{ "message": "Se o e-mail existir, um código foi enviado." }
```

**POST /auth/verify-reset-code**
```json
// Request
{ "code": "123456" }  // 6 dígitos numéricos

// Response 200
{ "valid": true }
```

**POST /auth/reset-password**
```json
// Request
{ "code": "123456", "new_password": "string (min 6)" }

// Response 200
{ "message": "Senha redefinida com sucesso." }
```

---

### Me (Perfil próprio)

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| `GET` | `/me` | ✅ | Perfil completo com status do plano e quotas |
| `GET` | `/me/referrals` | ✅ | Lista de usuários que se cadastraram com seu código |
| `PATCH` | `/me/password` | ✅ | Alterar senha |

**GET /me — Resposta**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "is_admin": false,
  "plan": "freemium",
  "premium_expires_at": null,
  "referral_code": "ABC12345",
  "referral_count": 3,
  "clear_chat_quota": {
    "deletions_used": 120,
    "deletions_limit": 500,
    "window_hours": 24,
    "resets_at": "2026-05-25T10:00:00.000Z"
  },
  "my_token": {
    "has_token": true,
    "is_valid": true
  }
}
```

Valores de `plan`: `"freemium"` | `"premium"` | `"admin"`

Quando premium está ativo, `clear_chat_quota.resets_at` é `null` (sem limite).

**PATCH /me/password**
```json
// Request
{ "current_password": "string", "new_password": "string (min 6)" }

// Response 200
{ "message": "Senha alterada com sucesso." }
```

---

### Monitoramento

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| `GET` | `/monitoring` | ✅ | Listar contas de monitoramento |
| `POST` | `/monitoring` | ✅ | Adicionar token selfbot (validado imediatamente) |
| `DELETE` | `/monitoring/:id` | ✅ | Remover conta de monitoramento |
| `POST` | `/monitoring/:id/revalidate` | ✅ | Revalidar token de conta existente |

**POST /monitoring**
```json
// Request
{ "token": "token_discord_selfbot" }

// Response 201
{
  "id": 1,
  "is_valid": true,
  "created_at": "2026-05-24T12:00:00.000Z"
}
```

Erros específicos:
- `400 INVALID_TOKEN` — token inválido ou rejeitado pelo Discord

---

### Contas Alvo

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| `GET` | `/targets` | ✅ | Listar contas alvo |
| `POST` | `/targets` | ✅ | Adicionar alvo por Discord ID |
| `DELETE` | `/targets/:id` | ✅ | Remover conta alvo |

**POST /targets**
```json
// Request
{ "discord_user_id": "123456789012345678" }

// Response 201
{
  "id": 1,
  "discord_user_id": "123456789012345678",
  "username": "usuario_discord",
  "display_name": "Nome Exibido",
  "avatar_url": "https://cdn.discordapp.com/avatars/...",
  "created_at": "2026-05-24T12:00:00.000Z"
}
```

Erros específicos:
- `403 PREMIUM_REQUIRED` — freemium tentou adicionar mais de 3 alvos
- `403 COOLDOWN_ACTIVE` — freemium está no cooldown de 24h após remover um alvo
- `403 NO_ACTIVE_MONITORING` — freemium sem conta de monitoramento ativa
- `409 TARGET_ALREADY_EXISTS` — alvo já cadastrado

---

### Mensagens

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| `GET` | `/messages` | ✅ | Listar mensagens salvas das contas alvo |

---

### Eventos

| Método | Endpoint | Auth | Query Params | Descrição |
|--------|----------|:----:|--------------|-----------|
| `GET` | `/events` | ✅ | `limit`, `from`, `to` | Listar eventos de monitoramento |

**Query params:**
- `limit` — máximo de resultados (padrão: `50`, máx: `100`)
- `from` — data ISO de início ex: `2026-05-01T00:00:00Z`
- `to` — data ISO de fim

**Tipos de evento no campo `event_type`:**
- `voice_join` / `voice_leave` / `voice_move`
- `message_edit` — inclui conteúdo original e novo
- `message_delete` — inclui conteúdo deletado
- `mention`

---

### Servidores

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| `GET` | `/servers` | ✅ | Servidores descobertos pelas contas de monitoramento |

---

### Pagamentos PIX

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| `POST` | `/payments/initiate` | ✅ | Gerar cobrança PIX premium |
| `GET` | `/payments/status/:correlationId` | ✅ | Status da cobrança |
| `GET` | `/payments` | ✅ | Histórico de pagamentos |

**POST /payments/initiate — Resposta**
```json
{
  "correlationID": "uuid-da-cobranca",
  "pixCopyPaste": "00020101021...",
  "qrCodeImage": "https://api.woovi.com/qr/...",
  "expiresAt": "2026-05-24T22:00:00.000Z",
  "valueCents": 3990
}
```

**GET /payments/status/:correlationId — Resposta**
```json
{
  "status": "ACTIVE",
  "correlationID": "uuid",
  "paidAt": null
}
```

Valores de `status`: `"ACTIVE"` | `"COMPLETED"` | `"EXPIRED"`

**Fluxo recomendado no frontend:**
1. `POST /payments/initiate` — exibir QR code e PIX copia-e-cola
2. Polling em `GET /payments/status/:correlationID` a cada 5–10 segundos
3. Quando `status === "COMPLETED"` → exibir confirmação e atualizar `GET /me`

---

### My-Token (Token Discord Pessoal)

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| `GET` | `/my-token` | ✅ | Ver token pessoal cadastrado |
| `POST` | `/my-token/add` | ✅ | Adicionar token (validado antes de salvar) |
| `DELETE` | `/my-token/delete` | ✅ | Deletar token (respeita cooldown de 24h) |
| `PATCH` | `/my-token/rotate` | ✅ | Substituir por novo token válido (respeita cooldown) |

> O my-token é obrigatório para usar `tools` e `utils/guild-channels` e `utils/dm-channels`.

---

### Utils (Utilitários Discord)

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| `POST` | `/utils/validate-discord-token` | ✅ | Valida token Discord e retorna dados do usuário |
| `GET` | `/utils/discord-user/:id` | ✅ | Busca usuário público Discord por ID |
| `GET` | `/utils/guild-channels/:guildId` | ✅ | Lista canais de um servidor via my-token |
| `GET` | `/utils/dm-channels` | ✅ | Lista DMs abertos via my-token |

**POST /utils/validate-discord-token**
```json
// Request
{ "token": "token_discord" }

// Response 200
{
  "valid": true,
  "user": {
    "id": "123456789",
    "username": "string",
    "discriminator": "0",
    "avatar": "hash_do_avatar"
  }
}
```

---

### Tools (Automações)

| Método | Endpoint | Auth | Tipo | Descrição |
|--------|----------|:----:|------|-----------|
| `GET` | `/tools/status` | ✅ | Síncrono | Verifica se há processo em execução |
| `POST` | `/tools/cancel-current-process` | ✅ | Síncrono | Cancela processo em andamento |
| `POST` | `/tools/close-dm` | ✅ | **202 Async** | Fechar todos os DMs (exceto ignorados) |
| `POST` | `/tools/leave-server` | ✅ | **202 Async** | Sair de todos os servidores (exceto ignorados) |
| `POST` | `/tools/delete-relationships` | ✅ | **202 Async** | Remover todas as relações (exceto ignorados) |

**GET /tools/status**
```json
{ "active": false }
```

**POST /tools/close-dm**
```json
// Request (todos os campos são opcionais)
{ "ignored_channel_ids": ["123456789", "987654321"] }
```

**POST /tools/leave-server**
```json
{ "ignored_guild_ids": ["123456789"] }
```

**POST /tools/delete-relationships**
```json
{ "ignored_user_ids": ["123456789"] }
```

Todos retornam `202` imediatamente. Use `GET /tools/status` para saber quando terminou.

---

### Clear-Chat (Exclusão de Mensagens)

| Método | Endpoint | Auth | Tipo | Descrição |
|--------|----------|:----:|------|-----------|
| `POST` | `/clear-chat/cancel` | ✅ | Síncrono | Cancela exclusão em andamento |
| `POST` | `/clear-chat/channel` | ✅ | **202 Async** | Exclui mensagens de um canal |
| `POST` | `/clear-chat/server` | ✅ | **202 Async** | Exclui mensagens de todos os canais de um servidor |
| `POST` | `/clear-chat/dms` | ✅ | **202 Async** | Exclui mensagens em todos os DMs abertos |

**POST /clear-chat/channel**
```json
{ "channel_id": "123456789012345678" }
```

**POST /clear-chat/server**
```json
{ "guild_id": "123456789012345678" }
```

**POST /clear-chat/dms**
```json
{}
```

> Todos os endpoints de clear-chat exigem my-token válido cadastrado. Freemium tem quota de 500 mensagens a cada 24 horas.

Erros específicos:
- `403 NO_VALID_TOKEN` — sem my-token válido cadastrado
- `403 QUOTA_EXCEEDED` — freemium atingiu o limite de deleções do período
- `409 PROCESS_ALREADY_RUNNING` — já existe um processo de exclusão ativo

---

## Limites de Rate

| Endpoint / Grupo | Limite | Janela | Ban após |
|-----------------|--------|--------|---------|
| Global (todas as rotas) | 120 req | 1 min | 3 violações |
| `POST /auth/register` | 5 req | 10 min | 2 violações |
| `POST /auth/login` | 10 req | 5 min | 3 violações |
| `POST /auth/forgot-password` | 5 req | 15 min | 2 violações |
| `PATCH /me/password` | 5 req | 15 min | 2 violações |
| `GET /utils/guild-channels/:id` | 10 req | 1 min | — |
| `GET /utils/dm-channels` | 5 req | 1 min | — |

---

## Exemplo de Configuração no Frontend

### Cliente HTTP base (fetch)

```typescript
// src/lib/api.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('jwt_token')
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw error // { error: string, message: string, meta?: object }
  }

  // 202 e 204 podem não ter body
  if (response.status === 202 || response.status === 204) return null as T

  return response.json()
}
```

### Tratar rate limit

```typescript
try {
  await apiFetch('/targets', { method: 'POST', body: JSON.stringify({ discord_user_id: id }) })
} catch (err: any) {
  if (err.error === 'RATE_LIMIT_EXCEEDED' || err.error === 'RATE_LIMIT_BANNED') {
    const seconds = err.meta?.retryAfter ?? 60
    toast.error(`Aguarde ${seconds}s antes de tentar novamente.`)
    return
  }
  if (err.error === 'PREMIUM_REQUIRED') {
    toast.error('Este recurso é exclusivo para usuários premium.')
    return
  }
  toast.error(err.message ?? 'Erro desconhecido.')
}
```

### Login e armazenamento do JWT

```typescript
// AUTH_MODE=local
async function login(username: string, password: string) {
  const data = await apiFetch<{ token: string; usuario: { id: number; username: string } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
  )
  localStorage.setItem('jwt_token', data.token)
  return data.usuario
}

// AUTH_MODE=discord — iniciar OAuth2
function loginWithDiscord() {
  // Redireciona o navegador; a API define cookie de state e redireciona para o Discord
  window.location.href = `${BASE_URL}/auth/discord`
}

// Página de callback do frontend (ex: /auth/callback)
// Chamada quando o Discord redireciona de volta com ?token=JWT
function handleDiscordCallback() {
  const token = new URLSearchParams(window.location.search).get('token')
  if (token) {
    localStorage.setItem('jwt_token', decodeURIComponent(token))
    // redirecionar para o dashboard
  }
}

function logout() {
  apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
  localStorage.removeItem('jwt_token')
}
```

### Polling para pagamento PIX

```typescript
async function waitForPayment(correlationID: string, onSuccess: () => void) {
  const interval = setInterval(async () => {
    const { status } = await apiFetch<{ status: string }>(
      `/payments/status/${correlationID}`,
    )
    if (status === 'COMPLETED') {
      clearInterval(interval)
      onSuccess()
    }
    if (status === 'EXPIRED') {
      clearInterval(interval)
      toast.error('Cobrança PIX expirada.')
    }
  }, 5000)
}
```

---

## Variável de Ambiente no Frontend

```env
# .env (Vite)
VITE_API_URL=https://api.seudominio.com

# .env.local (desenvolvimento)
VITE_API_URL=http://localhost:3000
```

> **Modo Discord OAuth2:** configure `DISCORD_OAUTH_FRONTEND_REDIRECT` no servidor para apontar para a URL do seu frontend onde o token será lido (ex: `https://app.seudominio.com/auth/callback`). O JWT chega como query param `?token=...` nessa URL.
