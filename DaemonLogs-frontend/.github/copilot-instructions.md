# DaemonLogs — Frontend

React 18 + Vite + TypeScript frontend para a API REST de monitoramento Discord.
API documentada em [FRONTEND DOCUMENTAÇÃO.md](../FRONTEND%20DOCUMENTAÇÃO.md) e spec OpenAPI em [api-endpoints.json](../api-endpoints.json).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Estilos | Tailwind CSS + `clsx` + `tailwind-merge` |
| Componentes | shadcn/ui (Radix UI) |
| State remoto | TanStack Query v5 |
| Roteamento | React Router v6 |
| Ícones | `lucide-react` — **única** fonte de ícones permitida |

## Estrutura `src/`

```
src/
├── components/
│   ├── ui/          ← gerado pelo shadcn/ui — nunca editar manualmente
│   ├── layout/      ← AppShell, Sidebar, Header
│   ├── auth/        ← formulários e páginas de autenticação
│   ├── monitoring/  ← contas de monitoramento
│   ├── targets/     ← alvos Discord
│   ├── events/      ← feed de eventos, tabela, badges
│   ├── tools/       ← ferramentas de automação
│   ├── payments/    ← fluxo PIX
│   └── shared/      ← StatusDot, AsyncButton, PlanBadge, etc.
├── hooks/           ← hooks de dados (useAuth, useMonitoring, useEvents…)
├── lib/
│   ├── api.ts       ← apiFetch — único ponto de acesso à API
│   ├── auth.ts      ← helpers de JWT (getToken, setToken, clearToken)
│   └── utils.ts     ← cn() gerado pelo shadcn/ui
├── pages/           ← componentes de rota
├── types/           ← interfaces TypeScript compartilhadas
└── main.tsx
```

## Regras obrigatórias

1. **Busque antes de criar** — verifique `src/components/` antes de escrever qualquer componente novo.
2. **Nunca recrie componentes shadcn** — use `@/components/ui/*` (Button, Card, Dialog, Badge, etc.).
3. **`cn()` sempre** — use `import { cn } from "@/lib/utils"` para compor classes; nunca concatene strings manualmente.
4. **Nunca use `style={}`** para cores ou layout que possam ser expressos em Tailwind.
5. **Nunca chame `fetch()` diretamente** — use `apiFetch()` de `@/lib/api`.
6. **Nunca invente endpoints** — consulte `FRONTEND DOCUMENTAÇÃO.md` ou `api-endpoints.json`.
7. **Sem emoji de caractere Unicode** — use exclusivamente ícones `lucide-react`.
8. **Cores via tokens** — nunca escreva `#bd93f9` ou `rgba(...)` em JSX; use as classes Tailwind configuradas.
9. **Consulte `api-endpoints.json` SEMPRE** — antes de criar qualquer hook, query, mutation ou chamada `apiFetch()`, abra `api-endpoints.json` e verifique o path exato, os campos de request/response e os status codes. Os campos retornados pela API **podem diferir** dos nomes intuitivos (ex: `tipo` em vez de `event_type`, `dados` em vez de `metadata`, `conta_alvo` em vez de `target`). Nunca assuma nomes de campos — sempre confirme no spec.

## Gotchas críticos da API

### Discord IDs são strings
Snowflakes excedem `Number.MAX_SAFE_INTEGER`. Trate **sempre** como `string`:
```ts
// ✅
{ discord_user_id: "123456789012345678" }
// ❌ — perde precisão silenciosamente
{ discord_user_id: 123456789012345678 }
```

### Operações assíncronas (202)
Endpoints de longa duração retornam `202` imediatamente. Nunca bloqueie a UI aguardando; use polling no endpoint de status correspondente. Ver lista completa em [FRONTEND DOCUMENTAÇÃO.md](../FRONTEND%20DOCUMENTAÇÃO.md#operações-assíncronas-202-accepted).

### Dois modos de autenticação
O servidor opera em `AUTH_MODE=local` (username/password) **ou** `AUTH_MODE=discord` (OAuth2 redirect). O frontend deve suportar ambos. Em modo `discord`, o JWT chega como `?token=` na URL de callback.

## Ambiente

```env
# .env.local
VITE_API_URL=http://localhost:3000
```

## Docker

```bash
# Desenvolvimento (hot-reload)
docker compose up

# Produção
VITE_API_URL=https://api.seudominio.com docker compose -f docker-compose.prod.yml up
```
