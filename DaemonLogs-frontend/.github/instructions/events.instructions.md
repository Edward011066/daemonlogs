---
description: "Use when: editar feed de eventos, criar timeline de eventos, criar filtro de eventos, modelar payload de /events, renderizar tipo de evento, trabalhar em src/components/events/**, src/pages/EventsPage.tsx, src/hooks/useEvents.ts."
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

## Filtros

- Use exatamente os nomes da query string da spec, sem aliases
- Datas de `from` e `to` devem ser ISO 8601
- O enum de `tipo` deve sair de `src/types/index.ts` e refletir a spec atual

## O que a IA NUNCA deve fazer

- Reintroduzir campos antigos como `event_type`, `metadata`, `target_username` ou `target_discord_user_id`
- Inventar tipos em lowercase como `voice_join` ou `voice_move`
- Tratar `dados` como shape único e obrigatório para todo evento
- Acoplar a timeline a campos não documentados sem fallback seguro