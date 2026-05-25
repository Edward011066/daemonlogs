# DaemonLogs

Sistema web de monitoramento de contas Discord com planos freemium/premium, automações pessoais e integração PIX.

## Índice

- [Funcionalidades](#funcionalidades)
- [Planos](#planos)
- [Pré-requisitos](#pré-requisitos)
- [Configuração Rápida com Docker](#configuração-rápida-com-docker)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [E-mail e SMTP](#e-mail-e-smtp)
- [Swagger · API Docs](#swagger--api-docs)
- [CORS](#cors)
- [Regras de Plano · plan-rules.ts](#regras-de-plano--plan-rulests)
- [Testando via Swagger](#testando-via-swagger-passo-a-passo)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Deploy em VPS](#deploy-em-vps)
- [Backup do Banco de Dados](#backup-do-banco-de-dados)
- [Estrutura do Projeto](#estrutura-do-projeto)

---

## Funcionalidades

- **Monitoramento em tempo real** de mensagens, edições, deleções, menções e eventos de voz
- **Sistema freemium/premium** com limites configuráveis sem necessidade de deploy
- **My-token** — cada usuário cadastra o próprio token Discord para automações
- **Automações pessoais** — fechar DMs, sair de servidores, remover relações em massa
- **Clear-chat** — exclusão de mensagens em canais, servidores e DMs com delay humanizado
- **Pagamento PIX** via Woovi com ativação automática de premium
- **Sistema de indicações** — número configurável de indicações gera 30 dias de premium
- **Premium por servidores** — conta em X servidores únicos ganha premium automaticamente
- **Deduplicação** — múltiplos monitores do mesmo alvo nunca geram registros duplicados
- **Rate limiting** global com ban progressivo

---

## Planos

| Funcionalidade | Freemium | Premium |
|---|---|---|
| Contas alvo monitoradas | Máx. 3 | Ilimitadas |
| Cooldown após remover alvo | 24 horas | Nenhum |
| Requer conta de monitoramento ativa | Sim | Não |
| Clear-chat | Sim — até 500 msgs / 24 h | Sim — sem limite |
| Automações (tools) | Sim | Sim |
| Duração do premium | — | 30 dias por pagamento |

> Todos os limites são editáveis em `src/config/plan-rules.ts`.

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose — para rodar em produção ou desenvolvimento
- Node.js 22+ — apenas para desenvolvimento local sem Docker

---

## Configuração Rápida com Docker

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/daemonlogs.git
cd daemonlogs
```

### 2. Crie o `.env`

```bash
cp .env.example .env
```

Preencha **no mínimo** as variáveis obrigatórias:

```env
# Banco de dados
POSTGRES_USER=daemonlogs
POSTGRES_PASSWORD=senha_forte_aqui
POSTGRES_DB=daemonlogs_db
DATABASE_URL=postgresql://daemonlogs:senha_forte_aqui@postgres:5432/daemonlogs_db

# Autenticação
JWT_SECRET=gere_com_o_comando_abaixo

# App
PORT=3000
NODE_ENV=production
APP_URL=https://api.seudominio.com

# Desabilite temporariamente para testar sem configurar SMTP
EMAIL_ENABLED=false

# Desabilite em produção
SWAGGER_ENABLED=false
```

**Gerar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Suba com Docker Compose

```bash
docker compose up -d --build
```

Na primeira execução, a API automaticamente:
1. Aguarda o PostgreSQL ficar saudável
2. Executa todas as migrations (`npm run db:deploy`)
3. Gera o Prisma Client (`npm run db:generate`)
4. Inicia o servidor na porta configurada

```bash
# Status dos containers
docker compose ps

# Logs da API em tempo real
docker compose logs -f api

# Logs do banco
docker compose logs -f postgres
```

### 4. Verificar a API

```bash
curl http://localhost:3000/health
# { "status": "ok" }
```

---

## Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
|----------|:-----------:|--------|-----------|
| `DATABASE_URL` | ✅ | — | URL PostgreSQL. Em Docker use `@postgres:5432`; em dev local use `@localhost:5432` |
| `POSTGRES_USER` | ✅ | — | Usuário do banco (usado pelo serviço `postgres` no Compose) |
| `POSTGRES_PASSWORD` | ✅ | — | Senha do banco |
| `POSTGRES_DB` | ✅ | — | Nome do banco de dados |
| `JWT_SECRET` | ✅ | — | Segredo para assinar JWTs. Mínimo 32 caracteres aleatórios |
| `PORT` | — | `3000` | Porta que o servidor escuta |
| `NODE_ENV` | — | `development` | `production` reduz logs ao mínimo; `development` exibe logs completos |
| `APP_URL` | — | `http://localhost:3000` | URL base da aplicação. Usada em links enviados por e-mail |
| `SWAGGER_ENABLED` | — | `true` | `false` desativa `/api-docs` completamente. **Recomendado em produção** |
| `AUTH_MODE` | — | `local` | `local` = registro/login com username+senha; `discord` = OAuth2 Discord (dispensa SMTP) |
| `DISCORD_CLIENT_ID` | ⚠️ | — | App ID do Discord Developer Portal (apenas `AUTH_MODE=discord`) |
| `DISCORD_CLIENT_SECRET` | ⚠️ | — | Client Secret do Discord — nunca commitar em repositórios públicos |
| `DISCORD_REDIRECT_URI` | — | `.../auth/discord/callback` | Deve bater exatamente com o configurado no Discord Developer Portal |
| `DISCORD_OAUTH_FRONTEND_REDIRECT` | — | `http://localhost:5173` | URL do frontend que recebe `?token=JWT` após autenticação Discord |
| `EMAIL_ENABLED` | — | `true` | `false` desativa e-mail e validação de domínio; ativação de conta é dispensada (apenas `AUTH_MODE=local`) |
| `SMTP_HOST` | ⚠️ | — | Host SMTP (`smtp.gmail.com`, `smtp.office365.com`, etc.) — não necessário com `AUTH_MODE=discord` |
| `SMTP_PORT` | — | `587` | Porta SMTP (`587` para STARTTLS, `465` para SSL/TLS direto) |
| `SMTP_SECURE` | — | `false` | `true` = SSL/TLS direto (porta 465). `false` = STARTTLS (porta 587) |
| `SMTP_USER` | ⚠️ | — | Usuário SMTP |
| `SMTP_PASS` | ⚠️ | — | Senha SMTP. Para Gmail, use **Senha de App** (não a senha da conta) |
| `SMTP_FROM` | — | `noreply@<SMTP_HOST>` | E-mail remetente exibido nos envios |
| `ACTIVATION_CODE_TTL_MINUTES` | — | `60` | Validade do código de ativação de conta (minutos) |
| `PASSWORD_RESET_TTL_MINUTES` | — | `15` | Validade do código de redefinição de senha (minutos) |
| `ALLOWED_EMAIL_DOMAINS` | — | lista pré-definida | Domínios de e-mail permitidos no cadastro, separados por vírgula |
| `BLOCKED_EMAIL_DOMAINS` | — | lista pré-definida | Domínios de e-mail descartáveis bloqueados no cadastro |
| `REFERRAL_PREMIUM_THRESHOLD` | — | `5` | Indicações bem-sucedidas necessárias para ganhar 30 dias de premium |
| `RATE_LIMIT_GLOBAL_MAX` | — | `120` | Máximo de requisições por janela (todas as rotas) |
| `RATE_LIMIT_WINDOW_MS` | — | `60000` | Janela do rate limit em ms (60000 = 1 minuto) |
| `MY_TOKEN_COOLDOWN_HOURS` | — | `24` | Cooldown para deletar ou rotacionar my-token válido |
| `WOOVI_API_KEY` | ⚠️ | — | App ID da Woovi para cobranças PIX |
| `WOOVI_WEBHOOK_SECRET` | ⚠️ | — | Secret do webhook Woovi (validação HMAC-SHA1) |
| `WOOVI_CHARGE_VALUE_CENTS` | ⚠️ | — | Valor da cobrança em centavos (`3990` = R$ 39,90) |

> ⚠️ Obrigatória apenas se a funcionalidade correspondente for usada.

---

## E-mail e SMTP

### Alternativa: Autenticação via Discord OAuth2

Se você não quer configurar SMTP, use o modo Discord OAuth2:

```env
AUTH_MODE=discord
DISCORD_CLIENT_ID=seu_app_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_REDIRECT_URI=https://api.seudominio.com/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=https://app.seudominio.com/auth/callback
```

Nesse modo:
- Nenhuma configuração SMTP é necessária
- Usuários fazem login com a conta Discord deles
- As rotas locais (`/auth/register`, `/auth/login`, etc.) **não são registradas**
- Configure o redirect URI também no [Discord Developer Portal](https://discord.com/developers/applications) → OAuth2 → Redirects

### Modo debug — sem e-mail (modo local)

Útil para desenvolvimento e testes rápidos com `AUTH_MODE=local`:

```env
EMAIL_ENABLED=false
```

Com isso:
- Nenhum e-mail é enviado
- Validação de domínio de e-mail é desativada
- **A ativação de conta é dispensada** — o usuário pode logar imediatamente após o registro

### Ativar e-mail em produção

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=noreply@seudominio.com
APP_URL=https://api.seudominio.com
ACTIVATION_CODE_TTL_MINUTES=60
PASSWORD_RESET_TTL_MINUTES=15
```

### Criar Senha de App no Gmail

1. Acesse [myaccount.google.com/security](https://myaccount.google.com/security)
2. Ative a **Verificação em duas etapas**
3. Pesquise **"Senhas de app"** → crie uma senha para "E-mail"
4. Use os 16 dígitos gerados em `SMTP_PASS`

### Referência de provedores SMTP

| Provedor | `SMTP_HOST` | `SMTP_PORT` | `SMTP_SECURE` |
|----------|------------|:-----------:|:-------------:|
| Gmail | `smtp.gmail.com` | `587` | `false` |
| Outlook / Hotmail | `smtp.office365.com` | `587` | `false` |
| Yahoo | `smtp.mail.yahoo.com` | `587` | `false` |
| Brevo (Sendinblue) | `smtp-relay.brevo.com` | `587` | `false` |
| Amazon SES | `email-smtp.<região>.amazonaws.com` | `587` | `false` |

---

## Swagger · API Docs

### Ativar (desenvolvimento)

```env
SWAGGER_ENABLED=true
```

Acesse: `http://localhost:3000/api-docs`

### Desativar (produção)

```env
SWAGGER_ENABLED=false
```

O endpoint `/api-docs` deixa de existir por completo — nenhuma rota é registrada. **Recomendado em produção** para não expor o contrato da API publicamente.

---

## CORS

Por padrão a API aceita requisições de **qualquer origem** (`origin: true`), ideal para desenvolvimento. Em produção, restrinja ao domínio do seu frontend editando `src/app.ts`:

```typescript
// Desenvolvimento — qualquer origem
await fastify.register(cors, { origin: true })

// Produção — apenas um domínio
await fastify.register(cors, { origin: 'https://app.seudominio.com' })

// Múltiplos domínios
await fastify.register(cors, {
  origin: ['https://app.seudominio.com', 'https://admin.seudominio.com'],
})
```

Após editar, reconstrua o container:

```bash
docker compose up -d --build
```

---

## Regras de Plano · plan-rules.ts

O arquivo `src/config/plan-rules.ts` centraliza **todas** as regras de negócio de planos, quotas e automações. Edite e reinicie o servidor — sem migration nem rebuild completo.

```typescript
export const PLAN_RULES = {
  freemium: {
    max_targets: 3,                   // máx. de contas alvo para freemium
    cooldown_hours: 24,               // espera após remover alvo (horas)
    requires_active_monitoring: true, // exige conta de monitoramento ativa
  },
  premium: {
    max_targets: Infinity,            // sem limite
    cooldown_hours: 0,                // sem espera
    requires_active_monitoring: false,
  },
  server_count_premium: {
    enabled: true,                    // false = desativa este benefício
    min_unique_servers: 10,           // servidores únicos para ganhar premium
    premium_days: 30,                 // dias de premium concedidos
  },
  my_token_cooldown_hours: 24,        // cooldown para deletar/rotacionar my-token
  clear_chat: {
    premium_only: false,              // true = somente premium usa clear-chat
    freemium_max_deletions: 500,      // msgs que freemium pode deletar por período
    freemium_cooldown_hours: 24,      // janela do período de quota (horas)
    base_delete_delay_ms: 600,        // delay entre exclusões individuais (ms)
    search_delay_ms: 1000,            // delay entre buscas de batch (ms)
  },
  tools: {
    premium_only: false,              // true = somente premium usa automações
    action_delay_ms: 600,             // delay entre cada ação das automações (ms)
  },
}
```

### Bloquear funcionalidade para freemium

Mude `premium_only` para `true` e reinicie o servidor:

```typescript
tools: {
  premium_only: true,  // freemium recebe 403 ao tentar usar automações
  action_delay_ms: 600,
}
```

---

## Testando via Swagger (Passo a Passo)

> Requer `SWAGGER_ENABLED=true` no `.env`

Acesse: `http://localhost:3000/api-docs`

### Passo 1 — Criar conta

> Se `AUTH_MODE=discord`, pule para o **Passo 1b** abaixo.

**POST /auth/register**

```json
{
  "username": "meuusuario",
  "password": "minhasenha123",
  "email": "meu@email.com"
}
```

Resposta `201`: `{ "id": 1, "username": "meuusuario", "email": "meu@email.com" }`

---

### Passo 1b — Login via Discord OAuth2 (apenas `AUTH_MODE=discord`)

Abra no navegador:

```
GET http://localhost:3000/auth/discord
```

Você será redirecionado para o Discord, autorize o acesso e será redirecionado de volta para o frontend com `?token=<JWT>` na URL. Use esse token nos passos seguintes.

---

### Passo 2 — Ativar conta

**Com `EMAIL_ENABLED=false` ou `AUTH_MODE=discord`:** pule esta etapa — a conta já está ativa.

**Com `EMAIL_ENABLED=true` (modo local):**

**POST /auth/activate**
```json
{ "code": "codigo_recebido_no_email" }
```

Se o e-mail não chegar, reenvie via **POST /auth/resend-activation** com `{ "email": "meu@email.com" }`.

---

### Passo 3 — Login e obtenção do JWT

> Se veio do Passo 1b (Discord OAuth2), o JWT já foi obtido. Pule para o Passo 4.

**POST /auth/login**
```json
{ "username": "meuusuario", "password": "minhasenha123" }
```

Resposta: `{ "token": "eyJhbGci...", "usuario": { "id": 1, "username": "meuusuario" } }`

Copie o valor do campo `token`.

---

### Passo 4 — Autenticar no Swagger

1. Clique no botão **Authorize** (🔒) no canto superior direito da página
2. Cole o JWT no campo `bearerAuth` — **sem** o prefixo "Bearer"
3. Clique **Authorize** → **Close**

Todas as requisições seguintes incluirão o token automaticamente.

---

### Passo 5 — Adicionar conta de monitoramento

**POST /monitoring**
```json
{ "token": "SEU_TOKEN_DISCORD_SELFBOT" }
```

O token é validado imediatamente com a API do Discord antes de ser salvo. Resposta `201` confirma a conta adicionada.

---

### Passo 6 — Adicionar conta alvo

**POST /targets**
```json
{ "discord_user_id": "123456789012345678" }
```

O sistema busca automaticamente o perfil público do usuário Discord e salva o resultado. Regras freemium são aplicadas.

> Discord IDs são números grandes — envie sempre como **string**.

---

### Passo 7 — Acompanhar eventos monitorados

**GET /events**

Parâmetros opcionais:
- `limit` — máximo de resultados (padrão: `50`, máx: `100`)
- `from` — data ISO de início (ex: `2026-05-01T00:00:00Z`)
- `to` — data ISO de fim

---

### Passo 8 — Ver mensagens salvas

**GET /messages**

---

### Passo 9 — Verificar perfil e plano

**GET /me**

Retorna: plano atual (`freemium` / `premium` / `admin`), quota do clear-chat, status do my-token e código de indicação.

---

## Desenvolvimento Local

```bash
# 1. Instalar dependências
npm install

# 2. Subir apenas o banco via Docker
docker compose up -d postgres

# 3. Configurar .env com localhost
# DATABASE_URL=postgresql://daemonlogs:senha@localhost:5432/daemonlogs_db

# 4. Aplicar migrations
npm run db:migrate

# 5. Gerar Prisma Client
npm run db:generate

# 6. Popular banco com usuário de teste
npm run db:seed
# Credenciais: teste@daemonlogs.com / teste123

# 7. Iniciar com hot reload
npm run dev
```

A API inicia em `http://localhost:3000`.

> **Seed de desenvolvimento:** cria o usuário `teste` com email `teste@daemonlogs.com`, senha `teste123`, conta já ativada e código de indicação `TESTE0001`.

---

## Deploy em VPS

### 1. Instalar Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clonar e configurar

```bash
git clone https://github.com/seu-usuario/daemonlogs.git
cd daemonlogs
cp .env.example .env
nano .env
```

Configurações essenciais para produção:

```env
NODE_ENV=production
APP_URL=https://api.seudominio.com
SWAGGER_ENABLED=false
EMAIL_ENABLED=true
# ... restante das variáveis
```

### 3. Subir os serviços

```bash
docker compose up -d --build
```

### 4. Nginx como Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.seudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.seudominio.com;

    ssl_certificate     /etc/letsencrypt/live/api.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seudominio.com/privkey.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

### 5. SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.seudominio.com
```

O certbot configura o Nginx automaticamente e agenda a renovação do certificado.

### 6. Atualizar a aplicação

```bash
git pull
docker compose up -d --build
```

O container aplica novas migrations automaticamente na inicialização.

---

## Backup do Banco de Dados

### Exportar

```bash
# Formato SQL legível
docker exec daemonlogs-postgres \
  pg_dump -U daemonlogs daemonlogs_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Formato binário — menor tamanho, restauração mais rápida
docker exec daemonlogs-postgres \
  pg_dump -U daemonlogs -Fc daemonlogs_db > backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restaurar

```bash
# De arquivo SQL
cat backup.sql | docker exec -i daemonlogs-postgres \
  psql -U daemonlogs daemonlogs_db

# De arquivo binário (.dump)
docker exec -i daemonlogs-postgres \
  pg_restore -U daemonlogs -d daemonlogs_db < backup.dump
```

### Backup automático diário via cron

```bash
# Crie a pasta de backups
mkdir -p backups

# Editar crontab
crontab -e
```

Adicione a linha abaixo (backup às 3h da manhã, mantém últimos 7 dias):

```
0 3 * * * cd /caminho/para/daemonlogs && docker exec daemonlogs-postgres pg_dump -U daemonlogs daemonlogs_db > backups/backup_$(date +\%Y\%m\%d).sql && find backups/ -name "*.sql" -mtime +7 -delete
```

---

## Estrutura do Projeto

```
src/
├── app.ts                    # Bootstrap: CORS, plugins, rotas, error handler
├── server.ts                 # Entry point (listen na porta configurada)
├── config/
│   ├── plan-rules.ts         # ⚙️  Central de regras de plano — edite aqui
│   └── auth-config.ts        # ⚙️  AUTH_MODE, salt_rounds, session_ttl, config Discord OAuth2
├── modules/                  # Arquitetura: routes → controller → service → repository
│   ├── auth/                 # Registro, login, ativação, reset de senha
│   ├── me/                   # Perfil próprio, indicações, troca de senha
│   ├── monitoring/           # Contas de monitoramento (tokens selfbot)
│   ├── targets/              # Contas alvo (Discord User IDs)
│   ├── messages/             # Mensagens capturadas das contas alvo
│   ├── events/               # Eventos: voz, edições, deleções, menções
│   ├── servers/              # Servidores Discord descobertos pelos monitores
│   ├── payments/             # Cobranças PIX + webhook Woovi
│   ├── plans/                # Lógica freemium/premium reutilizável
│   ├── my-token/             # Token Discord pessoal do usuário
│   ├── utils/                # Validar token, buscar usuário/canais Discord
│   ├── tools/                # Automações: fechar DMs, sair de servidores
│   └── clear-chat/           # Exclusão de mensagens em massa
├── selfbot/                  # discord.js-selfbot-v13
│   ├── client-manager.ts     # Gerencia clientes selfbot ativos
│   ├── events/               # Handlers de eventos Discord (um arquivo por evento)
│   └── functions/            # Funções utilitárias do selfbot
├── plugins/                  # Plugins Fastify (JWT auth, Prisma, Swagger, rate-limit)
├── utils/                    # AppError, envio de e-mail, validadores
└── types/                    # Extensões TypeScript do Fastify
prisma/
├── schema.prisma             # Schema completo do banco de dados
├── migrations/               # Histórico de migrations (não editar manualmente)
└── seed.ts                   # Seed de desenvolvimento (npm run db:seed)
```

## Segurança

- Senhas: hash bcrypt com custo 12
- Tokens Discord: armazenados como texto plano (necessário para autenticar o selfbot)
- JWT: validado em cada request com verificação de sessão no banco
- Webhook Woovi: validado via HMAC-SHA1 com `crypto.timingSafeEqual` (previne timing attacks)
- Sessão única por usuário — novo IP no mesmo dia é bloqueado por 24h
- Rate limiting com ban progressivo em todos os endpoints
