---
description: "Use when: criar página ou formulário de autenticação, configurar callback OAuth, proteger rotas, tratar AUTH_MODE no frontend, editar logout, trabalhar em src/pages/auth/**, src/components/auth/**, src/router.tsx, src/lib/auth.ts, src/components/layout/Header.tsx."
applyTo: "src/pages/auth/**,src/components/auth/**,src/router.tsx,src/lib/auth.ts,src/components/layout/Header.tsx"
---

# Autenticação — Roteamento e Fluxos

Documentação completa: [FRONTEND DOCUMENTAÇÃO.md](../../FRONTEND%20DOCUMENTAÇÃO.md#autenticação)

## Fonte primária

- Para rotas, query params, request/response e status codes, consulte primeiro [api-endpoints.json](../../api-endpoints.json).
- `FRONTEND.md` e `FRONTEND DOCUMENTAÇÃO.md` são apoio narrativo e podem ficar defasados.
- Se um endpoint de auth não estiver documentado na spec atual, trate-o como contrato não confirmado. Não crie novos usos nem novos campos com base apenas em prosa.

## Arquivos que realmente controlam auth neste frontend

- `src/router.tsx` — roteamento público, callback OAuth e proteção de páginas
- `src/lib/auth.ts` — leitura/escrita do JWT e `VITE_AUTH_MODE`
- `src/components/layout/Header.tsx` — ação de logout do usuário autenticado
- `src/pages/auth/**` e `src/components/auth/**` — telas e formulários

## AUTH_MODE — descoberta pelo frontend

`AUTH_MODE` é uma variável **do servidor**. O frontend lê o modo via `VITE_AUTH_MODE`:

```ts
// src/lib/auth.ts — adicione ao lado de getToken/setToken/clearToken
export type AuthMode = "local" | "discord"
export const getAuthMode = (): AuthMode =>
  (import.meta.env.VITE_AUTH_MODE as AuthMode) ?? "local"
```

```env
# .env.local
VITE_AUTH_MODE=local    # ou "discord"
VITE_API_URL=http://localhost:3000
```

## Estrutura de rotas

Todas as páginas de auth ficam sob `/auth/`. `AuthCallbackPage` deve ficar fora do `GuestRoute`, e as páginas protegidas devem ficar atrás de `ProtectedRoute`.

## LoginPage — um componente, dois modos

`LoginPage` escolhe entre `LocalLoginForm` e `DiscordLoginButton` com base em `getAuthMode()`.

`DiscordLoginButton` faz redirecionamento do browser (não usa `apiFetch`):

```tsx
// src/components/auth/DiscordLoginButton.tsx
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DiscordLoginButton() {
  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/discord`
  }
  return (
    <Button onClick={handleLogin} className="w-full">
      <LogIn className="h-4 w-4 mr-2" />
      Entrar com Discord
    </Button>
  )
}
```

## AuthCallbackPage — obrigatório no modo discord

Lê `?token=` da URL e armazena via `setToken`. Deve estar **fora** do `GuestRoute`.

**Nunca navegue para `/auth/callback` manualmente** — esse é o destino do redirect configurado no servidor (`DISCORD_OAUTH_FRONTEND_REDIRECT`).

## Fluxos locais

### Registro → Ativação

```
POST /auth/register → 201
  → redirecionar para /auth/activate?email=<email>
  (se EMAIL_ENABLED=false no servidor, a conta já está ativa —
   o login na página de ativação retornará sucesso sem pedir código)

POST /auth/activate  { email, code }  → 200
  → redirecionar para /auth/login

POST /auth/resend-activation  { email }  → 200
  → exibir toast "Código reenviado"
```

Na `ActivatePage`, leia o e-mail da query string:

### Recuperação de senha

```
POST /auth/forgot-password  { email }  → 200
  → SEMPRE exibir "Se o e-mail existir, um código foi enviado."
  → NÃO revelar se o e-mail existe ou não
  → redirecionar para /auth/reset-password

POST /auth/verify-reset-code  { code }  → 200  { valid: boolean }
  → se valid=true  → exibir campos nova senha
  → se valid=false → exibir erro, NÃO exibir campos de senha

POST /auth/reset-password  { code, new_password }  → 200
  → redirecionar para /auth/login
```

## Proteção de rotas

`ProtectedRoute` manda não autenticado para `/auth/login`. `GuestRoute` manda usuário logado para `/dashboard`.

## Erros específicos de auth

| Código | Situação | Ação |
|--------|----------|------|
| `SESSION_IP_BLOCKED` | Login de IP diferente no mesmo dia | Exibir `meta.retryAt` como data/hora formatada |
| `INVALID_CREDENTIALS` | Usuário ou senha errados | Mensagem genérica — não diferencie qual campo falhou |
| `ACCOUNT_NOT_ACTIVATED` | Conta criada sem ativação | Redirecionar para `/auth/activate` |
| `ACCOUNT_ALREADY_ACTIVATED` | Código de ativação já usado | Redirecionar para `/auth/login` |
| `INVALID_CODE` | Código errado | Exibir erro no campo de código |
| `CODE_EXPIRED` | Código expirado | Exibir erro + botão "Reenviar código" |

Sessões Discord OAuth **não** têm restrição de IP — `SESSION_IP_BLOCKED` é exclusivo do modo `local`.

## O que a IA NUNCA deve fazer

- Criar a rota `/auth/discord` no frontend — ela é do **servidor**; o frontend faz `window.location.href = ${VITE_API_URL}/auth/discord`
- Usar `useNavigate` dentro de `DiscordLoginButton` — o redirect é do browser, não do React Router
- Armazenar o JWT em `sessionStorage`, cookie ou estado React — somente `localStorage` via `setToken()`
- Colocar `AuthCallbackPage` dentro do `GuestRoute` — bloqueia o callback quando há token antigo
- Exibir formulários de `RegisterPage` ou `ForgotPasswordPage` na `LoginPage` em modo `discord`
- Revelar se um e-mail existe ou não na tela de recuperação de senha
