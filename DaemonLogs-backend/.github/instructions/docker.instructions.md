---
description: "Use when: criar Dockerfile, editar docker-compose, configurar ambiente Docker, configurar variáveis de ambiente, criar .env.example, configurar PostgreSQL em container, configurar volumes, criar serviço Docker."
applyTo: "docker-compose*.yml, Dockerfile*, .env*"
---

# Docker e Infraestrutura — Regras

## Serviços no docker-compose.yml

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| `api` | `3000:3000` | Aplicação Fastify |
| `postgres` | `5432:5432` | PostgreSQL |

## docker-compose.yml de Referência

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    command: >
      sh -c "npx prisma migrate deploy && node dist/server.js"

volumes:
  postgres_data:
```

## Variáveis de Ambiente (.env.example)

```env
# Database
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
POSTGRES_USER=daemonlogs
  POSTGRES_PASSWORD=changeme_in_production
  POSTGRES_DB=daemonlogs_db

# Auth
JWT_SECRET=changeme_in_production_use_random_256bit

# App
PORT=3000
NODE_ENV=production
SWAGGER_ENABLED=true   # false em produção para não expor /api-docs

# Rate Limiting
RATE_LIMIT_GLOBAL_MAX=120    # requisições por janela de tempo (global)
RATE_LIMIT_WINDOW_MS=60000   # janela em ms (60s)

# Password Reset
PASSWORD_RESET_TTL_MINUTES=15  # tempo de vida do código de reset de senha

# Woovi PIX
WOOVI_API_KEY=your_woovi_app_id
WOOVI_WEBHOOK_SECRET=your_webhook_secret
WOOVI_CHARGE_VALUE_CENTS=3990
```

## O que a IA NUNCA deve fazer

- Expor `DATABASE_URL` com credenciais hardcoded no `docker-compose.yml`
- Usar `latest` como tag de imagem Docker (usar versão fixa, ex: `postgres:16-alpine`)
- Omitir `healthcheck` no serviço `postgres` (a API depende do banco estar pronto)
- Rodar `prisma migrate dev` no container de produção — usar `prisma migrate deploy`
- Subir serviços sem `depends_on` com a condição `service_healthy`
