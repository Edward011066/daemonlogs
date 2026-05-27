---
description: "Use when: estruturar página de entidade, separar summary/detail/subviews, reduzir dump visual de payload, definir lazy loading visual, trabalhar em src/pages/DashboardPage.tsx, src/pages/EventsPage.tsx, src/pages/MonitoringPage.tsx, src/pages/PaymentsPage.tsx, src/pages/ProfilePage.tsx, src/pages/TargetsPage.tsx, src/pages/ToolsPage.tsx, src/components/events/**, src/components/me/**, src/components/monitoring/**, src/components/payments/**, src/components/targets/**, src/components/tools/**."
applyTo: "src/pages/DashboardPage.tsx,src/pages/EventsPage.tsx,src/pages/MonitoringPage.tsx,src/pages/PaymentsPage.tsx,src/pages/ProfilePage.tsx,src/pages/TargetsPage.tsx,src/pages/ToolsPage.tsx,src/components/events/**,src/components/me/**,src/components/monitoring/**,src/components/payments/**,src/components/targets/**,src/components/tools/**"
---

# UI para dados densos e relações profundas

Fonte primária: [api-endpoints.json](../../api-endpoints.json)

## Fluxo obrigatório antes de desenhar a tela

- Consulte `api-endpoints.json` antes de escolher layout, filtros, tabs ou queries.
- Identifique a entidade principal da tela e quais campos representam valor imediato.
- Separe o que é `summary`, `detail`, relação `1->N` e bloco técnico.
- Defina fronteiras de lazy loading antes de renderizar listas secundárias.

## Estrutura obrigatória por entidade

### Nível 1 — Summary / master view

- Exiba primeiro os campos que ajudam o usuário a decidir se vale abrir o detalhe.
- IDs técnicos, hashes e timestamps completos ficam como metadado secundário.

### Nível 2 — Detail surface

- Use drawer, sheet, dialog estruturado ou página dedicada.
- Preserve comparação com a lista em desktop quando isso ajudar a tarefa.

### Nível 3 — Sections / subviews

- Relações `1->N`, logs, eventos, pagamentos e blocos longos ficam em seção própria.
- Cada seção secundária deve carregar sob demanda.

### Nível 4 — Drill-down técnico

- JSON, payloads extensos, IDs completos e listas auxiliares só aparecem em área técnica explícita.

## Padrões obrigatórios

- Toda listagem grande usa master-detail.
- Nunca renderize listas dentro de listas profundas na mesma área principal.
- Preserve paginação do servidor quando o endpoint já expuser `page` e `limit`.
- Coleções secundárias devem aparecer como preview curto, contagem ou CTA para abrir detalhe.

## Nunca fazer

- Dump direto do payload da API na tela.
- Exibir relações profundas completas na listagem principal.
- Misturar overview, configuração e diagnóstico técnico no mesmo bloco visual.
- Fazer o usuário ler IDs e metadados antes de entender quem ou o que está sendo exibido.