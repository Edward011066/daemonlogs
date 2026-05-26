# DaemonLogs — Frontend

React 18 + Vite + TypeScript frontend para a API REST de monitoramento Discord.
Contrato primário da API: [api-endpoints.json](../api-endpoints.json).
Documentação complementar: [FRONTEND DOCUMENTAÇÃO.md](../FRONTEND%20DOCUMENTAÇÃO.md) e [FRONTEND.md](../FRONTEND.md).

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
6. **Nunca invente endpoints ou campos de API** — consulte `api-endpoints.json` primeiro. `FRONTEND DOCUMENTAÇÃO.md` e `FRONTEND.md` são apoio secundário.
7. **Sem emoji de caractere Unicode** — use exclusivamente ícones `lucide-react`.
8. **Cores via tokens** — nunca escreva `#bd93f9` ou `rgba(...)` em JSX; use as classes Tailwind configuradas.
9. **Consulte `api-endpoints.json` SEMPRE** — antes de criar qualquer hook, query, mutation, tipo compartilhado ou chamada `apiFetch()`, abra `api-endpoints.json` e verifique o path exato, os campos de request/response e os status codes. Os campos retornados pela API **podem diferir** dos nomes intuitivos (ex: `tipo` em vez de `event_type`, `dados` em vez de `metadata`, `conta_alvo` em vez de `target`, `clear_chat` em vez de `clear_chat_quota`).
10. **Quando a spec estiver incompleta, não invente** — procure consumidores e tipos já validados no repositório e use o menor contrato cru possível. Se a dúvida persistir, pare e peça confirmação em vez de espalhar campos especulativos como `display_name`, `avatar_url` ou `discord_user` em tipos compartilhados.

## Fonte de Verdade da API

- `api-endpoints.json` define **paths, query params, request bodies, response fields e status codes**.
- `FRONTEND DOCUMENTAÇÃO.md` e `FRONTEND.md` servem como contexto de fluxo, UX e operação, mas **não substituem** o contrato da spec.
- Se houver conflito entre a spec e a documentação textual, **a spec vence**.
- Se a spec não trouxer schema suficiente para uma rota já usada no app, não promova campos intuitivos para `src/types/index.ts` sem validação explícita.

## Arquitetura obrigatória de UI para dados densos

Ao implementar ou reestruturar qualquer tela alimentada pela API, siga este fluxo **antes** de desenhar componentes:

1. Abra `api-endpoints.json` e identifique a entidade principal da tela.
2. Liste os campos de primeiro impacto que merecem aparecer no resumo inicial.
3. Identifique relações `1->N`, coleções grandes e blocos técnicos do payload.
4. Defina onde acontece a separação entre **summary**, **detail**, **tabs/subviews** e **drill-down**.
5. Defina fronteiras de carregamento sob demanda antes de renderizar listas ou relações profundas.

### Progressive Disclosure é obrigatório

Nunca renderize todos os campos de uma entidade de uma vez. Toda UI deve separar informações em níveis:

- **Nível 1 — Summary/List view:** nome, status, usernames, IDs externos principais, timestamps relevantes e métricas curtas.
- **Nível 2 — Detail surface:** drawer, sheet, dialog estruturado ou página dedicada.
- **Nível 3 — Tabs/sections:** overview, eventos, pagamentos, logs, settings ou equivalentes do domínio.
- **Nível 4 — Drill-down técnico:** tabelas detalhadas, IDs secundários, payloads extensos, blocos técnicos e JSON.

### Entity-Centric Navigation

- Toda entidade principal deve ser tratada como um objeto navegável.
- Relações profundas nunca devem ser expandidas integralmente na lista principal.
- Se o payload trouxer dados aninhados extensos, a lista principal mostra só contexto suficiente para decidir se vale abrir o detalhe.

### Master -> Detail é o padrão padrão

- Toda listagem deve usar uma superfície leve e filtrável como master view.
- O detalhe deve abrir em drawer/sheet/dialog ou navegar para uma página própria quando o contexto exigir mais espaço.
- Relações `1->N` devem virar subviews independentes com paginação, virtualização ou lazy fetch quando aplicável.

### Performance-first rendering

- Nunca renderize arrays extensos diretamente no DOM só porque vieram na resposta.
- Prefira paginação, infinite scroll ou virtualização em listas potencialmente grandes.
- Carregue coleções secundárias somente quando a seção correspondente for aberta.
- Em telas de alto volume, exiba primeiro o que ajuda a triagem: usuário, `discord_user_id`, conteúdo textual, status, totais, data/hora e contexto humano.
- IDs técnicos como `message_id`, `channel_id`, `guild_id`, hashes e campos operacionais devem aparecer como metadado secundário, nunca como headline.

### O que a IA deve entregar ao propor UI

Sempre explicite, em código e estrutura de componentes:

- qual é a master view da entidade
- qual é a surface de detail
- quais seções carregam sob demanda
- quais campos entram no summary e quais ficam no detalhe
- como a UI evita dump visual do payload bruto

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
