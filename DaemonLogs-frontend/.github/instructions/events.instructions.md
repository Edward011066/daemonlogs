---
description: "Use when: editar feed de eventos, criar filtro ou paginação de /events, modelar payload de /events, renderizar tipos de evento, trabalhar em src/components/events/**, src/pages/EventsPage.tsx, src/hooks/useEvents.ts."
applyTo: "src/components/events/**,src/pages/EventsPage.tsx,src/hooks/useEvents.ts"
---

# Eventos — Contrato e UI

Fonte primária: [api-endpoints.json](../../api-endpoints.json)

## Contrato de `/events`

- Query params válidos: `targetId`, `tipo`, `page`, `limit`, `from`, `to`
- O filtro de alvo usa `targetId = conta_alvo.discord_user_id`
- Cada item da lista usa os campos crus `id`, `tipo`, `dados`, `created_at`, `conta_alvo`
- Os tipos de evento são os enums da spec: `MESSAGE_SENT`, `MESSAGE_EDIT`, `MESSAGE_DELETE`, `VOICE_JOIN`, `VOICE_LEAVE`, `VOICE_SWITCH`, `MENTION`

```ts
type RawEvent = {
  id: number
  tipo: EventType
  dados: Record<string, unknown> | null
  created_at: string
  conta_alvo: {
    discord_user_id: string
    username: string | null
  }
}
```

## `dados` é variável por tipo

- Nunca assuma que todos os eventos têm o mesmo shape
- Para eventos de mensagem, a própria spec descreve chaves como `conteudo` e `link_mensagem`; não renomeie para `content` no contrato cru sem mapper explícito
- Para eventos de voz, trate nomes de canal/servidor e listas de usuários como opcionais no rendering
- A UI deve degradar com elegância quando uma chave não existir ou `dados` vier `null`

## Arquitetura visual obrigatória

### Master view

- O nível principal precisa ser leve e escaneável.
- Mostre primeiro `tipo`, alvo (`conta_alvo.username ?? conta_alvo.discord_user_id`), preview textual curto quando existir e `created_at`.
- `guild_name` e `channel_name` podem entrar como contexto secundário.
- Nunca exponha `message_id`, `guild_id`, `channel_id` e o bloco completo de `dados` como headline.

### Detail view

- O detalhe deve abrir em drawer, dialog estruturado ou página dedicada.
- Organize o conteúdo em grupos como **Overview**, **Contexto** e **Técnico**.
- Conteúdo completo de mensagem, IDs, links e payloads mais extensos ficam no detalhe.
- Se não houver endpoint dedicado de detalhe, derive a visualização a partir do item já carregado, mas não expanda todos os itens de uma vez.

### Volume e paginação

- Preserve a paginação do servidor com `page` e `limit`; o limite máximo documentado é 100.
- Em volume alto, mantenha apenas um detalhe ativo por vez ou navegue para página/surface própria.
- Não renderize arrays profundos de `dados` diretamente na lista principal; transforme-os em contagens, preview curto ou seção própria no detalhe.

## Filtros

- Use exatamente os nomes da query string da spec, sem aliases
- Datas de `from` e `to` devem ser ISO 8601
- O enum de `tipo` deve sair de `src/types/index.ts` e refletir a spec atual
- Quando um seletor de alvo consumir `/targets` para filtrar `/events`, rotule cada opção com `username_global ?? username ?? discord_user_id`

## O que a IA NUNCA deve fazer

- Reintroduzir campos antigos como `event_type`, `metadata`, `target_username` ou `target_discord_user_id`
- Inventar tipos em lowercase como `voice_join` ou `voice_move`
- Tratar `dados` como shape único e obrigatório para todo evento
- Acoplar a timeline a campos não documentados sem fallback seguro