# DaemonLogs — Frontend

React 18 + Vite + TypeScript frontend para a API REST de monitoramento Discord.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Estilos | Tailwind CSS + `clsx` + `tailwind-merge` |
| Componentes | shadcn/ui (Radix UI) |
| State remoto | TanStack Query v5 |
| Roteamento | React Router v6 |
| Ícones | `lucide-react` |

## Superfícies centrais

- `src/components/ui/` é gerado pelo shadcn/ui — não edite manualmente.
- `src/lib/api.ts` é o único ponto de acesso HTTP.
- `src/lib/auth.ts` centraliza leitura/escrita do JWT.
- `src/types/index.ts` contém contratos compartilhados crus da API.

## Guardrails globais

1. Busque antes de criar: reutilize componentes, hooks e tipos existentes.
2. Nunca recrie primitives do shadcn/ui; importe de `@/components/ui/*`.
3. Use `cn()` para classes condicionais; evite `style={}` para cor ou layout estático.
4. Nunca chame `fetch()` diretamente; use `apiFetch()` de `@/lib/api`.
5. Consulte `api-endpoints.json` antes de criar ou alterar hook, query, mutation, tipo compartilhado ou chamada `apiFetch()`.
6. Em `src/types/index.ts`, preserve os nomes crus do backend; aliases amigáveis ficam em mapper, selector ou componente.
7. Discord IDs são sempre `string`.
8. Endpoints `202 Accepted` não bloqueiam a UI; use polling ou a reconsulta documentada para acompanhar o processamento.
9. O frontend deve suportar `AUTH_MODE=local` e `AUTH_MODE=discord`; no modo Discord o JWT chega por `?token=`.
10. Se a spec estiver incompleta, use o menor contrato já validado no app e peça confirmação antes de inventar campos.
11. A Landing Page e suas superfícies públicas devem usar apenas dados reais da API; nunca injete mocks ou respostas demo em `src/pages/LandingPage.tsx`, `src/components/shared/ServersMarquee.tsx`, `src/components/shared/ServerMonitoringLookupCard.tsx`, `src/hooks/useServers.ts` ou `src/hooks/useTargetsAmount.ts`, mesmo em guest mode.

## Fonte de verdade

- `api-endpoints.json` define paths, query params, request bodies, response fields e status codes.
- `FRONTEND DOCUMENTAÇÃO.md` e `FRONTEND.md` são apoio secundário.
- Em conflito entre texto e spec, a spec vence.

## Gotchas críticos

### Snowflakes do Discord

Snowflakes excedem `Number.MAX_SAFE_INTEGER`. Trate sempre como `string`.

### Operações assíncronas

Ferramentas e clear-chat podem retornar `202` e concluir em background. Modele a UI para iniciar a ação e acompanhar o status, não para bloquear até terminar.

### Tipos compartilhados

Não promova campos intuitivos ou aliases para `src/types/index.ts` sem validação explícita da spec ou de um consumer já confirmado.
