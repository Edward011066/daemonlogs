---
description: "Use when: reestruturar UI, montar listagem ou detalhe de entidades, adaptar telas para alto volume, criar master-detail, definir lazy loading, paginação, infinite scroll, virtualização, trabalhar em src/pages/** e src/components/**."
applyTo: "src/pages/**,src/components/**"
---

# UI para dados densos e relações profundas

Fonte primária: [api-endpoints.json](../../api-endpoints.json)

## Fluxo obrigatório antes de desenhar a tela

- Consulte `api-endpoints.json` antes de escolher layout, filtros, tabs ou queries.
- Identifique a entidade principal da tela e quais campos representam valor imediato.
- Identifique relações `1->N`, arrays longos e blocos técnicos.
- Decida o que é **summary**, **detail**, **subview independente** e **drill-down técnico**.
- Defina fronteiras de lazy loading antes de renderizar listas secundárias.

## Estrutura obrigatória por entidade

### Nível 1 — Summary / master view

- Exiba primeiro os campos que ajudam o usuário a decidir se vale abrir o detalhe.
- Priorize nomes, usernames, `discord_user_id`, status, conteúdo textual curto, totais e timestamps.
- IDs técnicos secundários (`message_id`, `channel_id`, `guild_id`, hashes) ficam em chips, colunas auxiliares ou bloco técnico.

### Nível 2 — Detail surface

- Use drawer, sheet, dialog estruturado ou página dedicada.
- Desktop: prefira split view, side panel ou drawer quando a comparação com a lista fizer sentido.
- Mobile: prefira página ou dialog fullscreen em vez de painel comprimido.
- Se o projeto ainda não tiver um componente de drawer/sheet pronto, use dialog ou página dedicada em vez de expansão inline pesada.

### Nível 3 — Sections / subviews

- Toda relação `1->N` vai para seção própria: eventos, pagamentos, logs, referrals, sessions ou equivalente do domínio.
- Cada seção deve carregar sob demanda.
- Mostre no overview só uma prévia curta de 3 a 10 itens ou uma métrica agregada.

### Nível 4 — Drill-down técnico

- JSON, payloads extensos, IDs completos, blobs e listas auxiliares só aparecem em seção técnica explícita.
- Nunca faça desses dados o headline da entidade.

## Padrões obrigatórios

- Toda listagem grande usa master-detail.
- Nunca renderize listas dentro de listas dentro de listas na mesma superfície.
- Nunca coloque tabelas dentro de tabelas inline.
- Se uma resposta puder crescer muito, use paginação, infinite scroll ou virtualização.
- Se a API já entrega `page` e `limit`, preserve essa modelagem na UI.
- Se a API não entrega paginação para a coleção secundária, mostre preview limitado e deixe o restante atrás de uma ação explícita.

## Adaptação guiada pela API atual

### `/events`

- Summary: `tipo`, `conta_alvo.username ?? conta_alvo.discord_user_id`, preview de `dados.conteudo` quando existir, `created_at`, contexto humano como `guild_name` e `channel_name`.
- Detail: campos técnicos como `message_id`, `channel_id`, `guild_id`, histórico textual de edição/remoção e `dados` completos em área técnica.
- Não expanda todos os eventos simultaneamente na lista principal.

### `/targets`

- Summary: `username_global ?? username ?? discord_user_id`, `discord_user_id`, `created_at`.
- Detail: nomes alternativos, ações e navegação para eventos filtrados por `targetId`.
- Nunca embuta a timeline completa de eventos dentro da lista de alvos.

### `/me` e `/me/referrals`

- Overview: `username`, `email`, `plan`, status de `my_token`, resumo de `clear_chat`.
- Detail/subviews: referrals, segurança, datas e campos operacionais.
- `referrals.items` não deve ser despejado inteiro na mesma superfície do overview.

### `/utils/validate-discord-token`

- Overview: identidade principal, `user.id`, `guild_count`, `friend_count`, status de MFA.
- Subviews: servidores, amigos, sessões, pagamentos e configurações.
- As coleções profundas devem abrir em tab, dialog ou subview com scroll próprio.

## Nunca fazer

- Dump direto do payload da API na tela.
- Exibir relações profundas completas na listagem principal.
- Misturar overview, configuração e diagnóstico técnico no mesmo bloco visual.
- Fazer o usuário ler IDs e metadados antes de entender quem ou o que está sendo exibido.