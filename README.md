# DaemonLogs — Guia de Deploy

Stack completa: **frontend React** + **backend Fastify** + **PostgreSQL**.

---

## Índice

1. [Visão geral da arquitetura](#1-visão-geral-da-arquitetura)
2. [Deploy conjunto (stack unificada)](#2-deploy-conjunto-stack-unificada)
   - [Configurar o backend](#21-configurar-o-backend)
   - [Configurar o frontend](#22-configurar-o-frontend)
   - [Subir tudo](#23-subir-tudo)
3. [Deploy individual em máquinas separadas](#3-deploy-individual-em-máquinas-separadas)
   - [Backend + PostgreSQL (servidor A)](#31-backend--postgresql-servidor-a)
   - [Frontend (servidor B)](#32-frontend-servidor-b)
4. [Variáveis que devem estar sincronizadas](#4-variáveis-que-devem-estar-sincronizadas)
5. [Comandos úteis](#5-comandos-úteis)

---

## 1. Visão geral da arquitetura

```
Browser
  │
  ▼ :80
┌─────────────────────────────────────────┐
│  nginx (frontend)                       │
│  /api/* ──proxy──► api:3000  (interna)  │
│  /*     ──────────► SPA estática        │
└─────────────────────────────────────────┘
                 │ rede interna Docker
                 ▼
         ┌───────────────┐
         │  api (:3000)  │
         └───────────────┘
                 │ rede interna Docker
                 ▼
         ┌───────────────┐
         │  postgres     │  (sem porta externa)
         └───────────────┘
```

No deploy conjunto, o browser nunca fala diretamente com a API.
Todas as chamadas `/api/*` passam pelo nginx, que faz o proxy internamente.

---

## 2. Deploy conjunto (stack unificada)

> **Pré-requisitos:** Docker e Docker Compose instalados.

### 2.1 Configurar o backend

```bash
cp DaemonLogs-backend/.env.example DaemonLogs-backend/.env
```

Edite `DaemonLogs-backend/.env`:

| Variável | O que configurar |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciais do banco (escolha as suas) |
| `JWT_SECRET` | String aleatória de 256 bits — gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AUTH_MODE` | `local` (usuário/senha) ou `discord` (OAuth2) |
| `APP_URL` | URL pública do sistema, ex: `https://daemonlogs.seudominio.com` |
| `EMAIL_ENABLED` | `false` para testes sem SMTP; `true` exige configurar `SMTP_*` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Configurações do seu servidor de e-mail |
| `WOOVI_API_KEY` / `WOOVI_WEBHOOK_SECRET` | Credenciais Woovi para pagamentos PIX (opcional) |

**Se `AUTH_MODE=discord`**, configure também:

| Variável | Valor |
|---|---|
| `DISCORD_CLIENT_ID` | Application ID no Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | Client Secret (nunca commitar) |
| `DISCORD_REDIRECT_URI` | `https://daemonlogs.seudominio.com/api/auth/discord/callback` |
| `DISCORD_OAUTH_FRONTEND_REDIRECT` | `https://daemonlogs.seudominio.com` |

> **Atenção:** `DISCORD_REDIRECT_URI` deve ser cadastrado no [Discord Developer Portal](https://discord.com/developers/applications) → OAuth2 → Redirects.

---

### 2.2 Configurar o frontend

```bash
cp DaemonLogs-frontend/.env.example DaemonLogs-frontend/.env
```

Edite `DaemonLogs-frontend/.env`:

| Variável | Valor no deploy conjunto |
|---|---|
| `VITE_API_URL` | Deixe em branco ou `/api` — o compose já injeta `/api` no build |
| `VITE_AUTH_MODE` | **Deve ser igual ao `AUTH_MODE` do backend** (`local` ou `discord`) |

> `VITE_AUTH_MODE` controla qual tela de login é exibida (formulário local ou botão Discord).
> O compose lê este valor do `DaemonLogs-frontend/.env` automaticamente.

---

### 2.3 Subir tudo

```bash
# Na raiz do projeto (onde está este README)
docker compose up --build -d
```

Acesse **http://localhost** (ou a porta definida em `FRONTEND_PORT`).

Para parar:

```bash
docker compose down
```

Para parar e apagar o volume do banco:

```bash
docker compose down -v
```

**Variável opcional no shell (ou em um `.env` na raiz):**

```env
FRONTEND_PORT=80   # porta externa do nginx (padrão: 80)
```

---

## 3. Deploy individual em máquinas separadas

Cada repositório tem seu próprio `docker-compose.yml` para rodar de forma independente.

### 3.1 Backend + PostgreSQL (servidor A)

```bash
cd DaemonLogs-backend
cp .env.example .env
# edite .env conforme descrito na seção 2.1
```

Ajustes específicos para deploy isolado:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/daemonlogs_db"
APP_URL=https://api.seudominio.com
NODE_ENV=production
SWAGGER_ENABLED=false
```

Subir:

```bash
docker compose up --build -d
```

A API ficará disponível na porta **3000** do servidor A.

---

### 3.2 Frontend (servidor B)

```bash
cd DaemonLogs-frontend
cp .env.example .env
```

Edite `.env`:

```env
# URL pública do backend (servidor A)
VITE_API_URL=https://api.seudominio.com

# Deve ser igual ao AUTH_MODE configurado no backend
VITE_AUTH_MODE=local
```

Subir em **produção** (build estático com nginx):

```bash
VITE_API_URL=https://api.seudominio.com docker compose -f docker-compose.prod.yml up --build -d
```

> O `VITE_API_URL` é **baked no build** pelo Vite — para trocar a URL da API é necessário reconstruir a imagem (`--build`).

Subir em **desenvolvimento** (hot-reload):

```bash
docker compose up --build
# Acesse http://localhost:5173
```

---

## 4. Variáveis que devem estar sincronizadas

Ao fazer deploy em máquinas separadas, estas variáveis precisam ser configuradas de forma consistente nos dois repositórios:

| Backend (`.env`) | Frontend (`.env`) | O que sincronizar |
|---|---|---|
| `AUTH_MODE=discord` | `VITE_AUTH_MODE=discord` | Modo de autenticação — deve ser igual |
| `DISCORD_OAUTH_FRONTEND_REDIRECT=https://app.com` | `VITE_API_URL=https://api.com` | URLs públicas corretas |
| `APP_URL=https://app.com` | — | URL base usada em e-mails |

---

## 5. Comandos úteis

```bash
# Ver logs de um serviço específico
docker compose logs -f api
docker compose logs -f frontend
docker compose logs -f postgres

# Rodar migrations manualmente (sem rebuild)
docker compose exec api npx prisma migrate deploy

# Acessar o banco via psql
docker compose exec postgres psql -U daemonlogs -d daemonlogs_db

# Rebuild apenas um serviço
docker compose up --build api -d

# Ver status dos containers
docker compose ps
```
