---
description: "Use when: integrar endpoint da API, criar hook de dados, criar query ou mutation, usar apiFetch, tratar ApiError, lidar com 202/polling, trabalhar em src/hooks/**, src/lib/api.ts, src/lib/api-error-copy.ts, src/lib/error-display.tsx."
applyTo: "src/hooks/**,src/lib/api.ts,src/lib/api-error-copy.ts,src/lib/error-display.tsx"
---

# Integração com a API

Documentação completa: [FRONTEND DOCUMENTAÇÃO.md](../../FRONTEND%20DOCUMENTAÇÃO.md)
Spec OpenAPI: [api-endpoints.json](../../api-endpoints.json)

## Fonte primária de contrato

- `api-endpoints.json` é a fonte primária para path, query param, body, status code e nomes de campo.
- `FRONTEND.md` e `FRONTEND DOCUMENTAÇÃO.md` são contexto secundário para fluxo e UX.
- Se houver conflito entre texto e spec, a spec vence.
- Se a spec estiver incompleta para uma rota já usada no app, use o menor contrato cru já validado e pare antes de inventar campos.

## Regras centrais do data layer

- Confirme o endpoint na spec antes de criar ou alterar hook, query key, mutation ou tipo compartilhado.
- Preserve nomes crus do backend nos contratos compartilhados; aliases amigáveis ficam em mapper, selector ou componente.
- Use query keys estáveis e reflita filtros reais do endpoint.
- Carregamento sob demanda pertence ao data layer via `enabled`, query keys específicas ou `refetchInterval`.

## `apiFetch` — único ponto de acesso

- Toda chamada à API passa por `src/lib/api.ts`.
- Se alterar o tratamento de `401`, preserve a limpeza do token e a compatibilidade com o fluxo de auth definido em `src/lib/auth.ts` e `src/router.tsx`.

```ts
return useQuery({
  queryKey: ["targets"],
  queryFn: () => apiFetch<Target[]>("/targets"),
})

return useMutation({
  mutationFn: (discord_user_id: string) =>
    apiFetch<Target>("/targets", {
      method: "POST",
      body: JSON.stringify({ discord_user_id }),
    }),
})
```

## Tratamento de erros

Use `ApiError.error` para lógica e `ApiError.message` para exibição:

```ts
if (error instanceof ApiError) {
  switch (error.error) {
    case "PREMIUM_REQUIRED":
      break
    case "COOLDOWN_ACTIVE":
      break
    default:
      toast.error(error.message)
  }
}
```

## Operações assíncronas (`202 Accepted`)

- `POST /tools/close-dm` — poll `GET /tools/status`
- `POST /tools/leave-server` — poll `GET /tools/status`
- `POST /tools/delete-relationships` — poll `GET /tools/status`
- `POST /clear-chat/channel` — acompanhar via `GET /me`
- `POST /clear-chat/server` — acompanhar via `GET /me`
- `POST /clear-chat/dms` — acompanhar via `GET /me`

```ts
const { data: status } = useQuery({
  queryKey: ["tools", "status"],
  queryFn: () => apiFetch<{ active: boolean }>("/tools/status"),
  refetchInterval: (query) => (query.state.data?.active ? 2000 : false),
  enabled: isPolling,
})
```

## O que a IA NUNCA deve fazer

- Chamar `fetch()` ou `axios` diretamente
- Renomear campos crus do backend dentro do contrato compartilhado
- Bloquear a UI aguardando um `202` terminar na mesma requisição
- Espalhar armazenamento de JWT ou lógica de sessão fora de `src/lib/auth.ts` e `src/lib/api.ts`

## Query keys — convenção

```ts
// Simples
queryKey: ["targets"]
queryKey: ["events"]
queryKey: ["me"]

// Com filtros
queryKey: ["events", { from, to, limit }]
queryKey: ["payments", "status", correlationId]

// Nunca use strings construídas: queryKey: [`events-${from}`]
```

## O que a IA NUNCA deve fazer

- Tratar `FRONTEND.md` ou `FRONTEND DOCUMENTAÇÃO.md` como autoridade maior que `api-endpoints.json`
- Renomear campos crus da API dentro de tipos compartilhados sem um mapper explícito
- Inventar campos ausentes na spec, especialmente em `/me`, `/targets`, `/my-token`, `/me/referrals` e `/events`
- Espalhar contratos especulativos do backend por múltiplos componentes só porque um consumer local usa um alias intuitivo
