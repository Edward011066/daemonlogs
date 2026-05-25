---
description: "Use when: chamar API, criar hook de dados, criar query, criar mutation, tratar erro de requisição, trabalhar em src/lib/api.ts, src/hooks/**, src/lib/**."
applyTo: "src/lib/api.ts,src/hooks/**,src/lib/**"
---

# Integração com a API

Documentação completa: [FRONTEND DOCUMENTAÇÃO.md](../../FRONTEND%20DOCUMENTAÇÃO.md)
Spec OpenAPI: [api-endpoints.json](../../api-endpoints.json)

## Fonte primária de contrato

- `api-endpoints.json` é a fonte primária para path, query param, body, status code e nomes de campo.
- `FRONTEND.md` e `FRONTEND DOCUMENTAÇÃO.md` são contexto secundário para fluxo e UX.
- Se houver conflito entre texto e spec, a spec vence.
- Se a spec estiver incompleta para uma rota já usada no app, não invente campos. Procure consumidores/tipos já validados e use o menor contrato cru possível. Se a dúvida continuar, pare e peça confirmação.

## Tipos compartilhados devem espelhar a API crua

Em `src/types/index.ts`, preserve os nomes reais do payload quando o tipo representar a resposta do backend:

```ts
// ✅ nomes crus da API
type Event = { tipo: string; dados: unknown; conta_alvo: { discord_user_id: string } }
type Me = { clear_chat: { messages_deleted: number | null } | null }
type Target = { username_global: string | null }

// ❌ aliases intuitivos dentro do contrato cru
type Event = { eventType: string; metadata: unknown; target: { discordUserId: string } }
type Me = { clear_chat_quota: { deletions_used: number } }
type Target = { display_name: string; avatar_url: string | null }
```

Se a UI precisar de nomes amigáveis, derive localmente em mapper, selector ou componente.

## `apiFetch` — único ponto de acesso

Toda chamada à API passa por `src/lib/api.ts`. **Nunca use `fetch()` diretamente.**

```ts
// src/lib/api.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

export class ApiError {
  constructor(
    public readonly error: string,
    public readonly message: string,
    public readonly meta?: Record<string, unknown>,
    public readonly status?: number,
  ) {}
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 202 || res.status === 204) return null as T
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body.error ?? "UNKNOWN_ERROR", body.message ?? "Erro desconhecido", body.meta, res.status)
  }
  return res.json()
}
```

## Hooks de dados com TanStack Query

```ts
// src/hooks/useTargets.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch, ApiError } from "@/lib/api"
import type { Target } from "@/types"

export function useTargets() {
  return useQuery({
    queryKey: ["targets"],
    queryFn: () => apiFetch<Target[]>("/targets"),
  })
}

export function useAddTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (discord_user_id: string) =>
      apiFetch<Target>("/targets", {
        method: "POST",
        body: JSON.stringify({ discord_user_id }), // sempre string
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["targets"] }),
  })
}
```

## Tratamento de erros

O tipo de erro da API é `ApiError` com campo `error` (código snake_case) e `message` (legível):

```ts
// Em componentes com useMutation
const { mutate, error } = useAddTarget()

// Erro tipado — use o campo `error` para lógica, `message` para exibir ao usuário
if (error instanceof ApiError) {
  switch (error.error) {
    case "PREMIUM_REQUIRED":
      // exibir CTA de upgrade
      break
    case "COOLDOWN_ACTIVE":
      // exibir countdown
      break
    case "RATE_LIMIT_EXCEEDED":
      toast.error(`Aguarde ${error.meta?.retryAfter ?? 60}s antes de tentar novamente.`)
      break
    default:
      toast.error(error.message)
  }
}
```

## Operações assíncronas (202 Accepted)

Endpoints que retornam `202` processam em background. O padrão correto:

```ts
// 1. Mutation dispara a operação (retorna null — 202)
const startTool = useMutation({
  mutationFn: (body: CloseDmPayload) =>
    apiFetch("/tools/close-dm", { method: "POST", body: JSON.stringify(body) }),
  onSuccess: () => {
    // 2. Iniciar polling do status
    startPolling()
  },
})

// 3. Polling até active = false
const { data: status } = useQuery({
  queryKey: ["tools-status"],
  queryFn: () => apiFetch<{ active: boolean }>("/tools/status"),
  refetchInterval: (query) => (query.state.data?.active ? 2000 : false),
  enabled: isPolling,
})
```

**Endpoints que retornam 202** (não bloqueie a UI):
- `POST /tools/close-dm` — poll `GET /tools/status`
- `POST /tools/leave-server` — poll `GET /tools/status`
- `POST /tools/delete-relationships` — poll `GET /tools/status`
- `POST /clear-chat/channel` — não tem status endpoint; monitorar via `GET /me`
- `POST /clear-chat/server` — idem
- `POST /clear-chat/dms` — idem

## JWT — armazenamento

```ts
// src/lib/auth.ts — apenas estas funções manipulam o token
const KEY = "jwt_token"
export const getToken   = () => localStorage.getItem(KEY)
export const setToken   = (t: string) => localStorage.setItem(KEY, t)
export const clearToken = () => localStorage.removeItem(KEY)
```

## Autenticação — dois modos

O servidor opera em **um** dos modos abaixo (nunca ambos simultaneamente):

```ts
// AUTH_MODE=local — POST /auth/login
const { token } = await apiFetch<{ token: string }>("/auth/login", {
  method: "POST",
  body: JSON.stringify({ username, password }),
})
setToken(token)

// AUTH_MODE=discord — redirect do browser
window.location.href = `${import.meta.env.VITE_API_URL}/auth/discord`

// Página de callback — lê o token da URL
const token = new URLSearchParams(location.search).get("token")
if (token) setToken(decodeURIComponent(token))
```

## Discord IDs (Snowflakes)

Snowflakes têm 18-19 dígitos e excedem `Number.MAX_SAFE_INTEGER`. **Sempre `string`:**

```ts
// ✅
const body = { discord_user_id: "123456789012345678" }

// ❌ — perde precisão silenciosamente
const body = { discord_user_id: 123456789012345678 }

// Tipagem correta
interface Target {
  id: number            // ID interno do banco (número seguro)
  discord_user_id: string  // snowflake — sempre string
}
```

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
