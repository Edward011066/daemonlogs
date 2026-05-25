---
description: "Use when: criar página de login, criar formulário de registro, criar formulário de ativação, criar recuperação de senha, criar callback OAuth, configurar roteamento de autenticação, implementar rota protegida, tratar AUTH_MODE, criar DiscordLoginButton, criar GuestRoute, criar ProtectedRoute, trabalhar em src/pages/auth/**, src/components/auth/**."
applyTo: "src/pages/auth/**,src/components/auth/**"
---

# Autenticação — Roteamento e Fluxos

Documentação completa: [FRONTEND DOCUMENTAÇÃO.md](../../FRONTEND%20DOCUMENTAÇÃO.md#autenticação)

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

Todas as páginas de auth ficam sob `/auth/`. Configure no router principal:

```tsx
// src/router.tsx
import { createBrowserRouter } from "react-router-dom"

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <GuestRoute />,           // redireciona logados para /
    children: [
      { path: "login",           element: <LoginPage /> },
      { path: "register",        element: <RegisterPage /> },
      { path: "activate",        element: <ActivatePage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password",  element: <ResetPasswordPage /> },
    ],
  },
  // AuthCallbackPage fica FORA do GuestRoute — precisa executar mesmo com token
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  {
    path: "/",
    element: <ProtectedRoute />,       // redireciona não-logados para /auth/login
    children: [/* rotas protegidas */],
  },
])
```

## LoginPage — um componente, dois modos

```tsx
// src/pages/auth/LoginPage.tsx
import { getAuthMode } from "@/lib/auth"

export function LoginPage() {
  const mode = getAuthMode()
  return mode === "discord" ? <DiscordLoginButton /> : <LocalLoginForm />
}
```

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

Lê `?token=` da URL e armazena via `setToken`. Deve estar **fora** do `GuestRoute`:

```tsx
// src/pages/auth/AuthCallbackPage.tsx
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { setToken } from "@/lib/auth"

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token")
    if (token) {
      setToken(decodeURIComponent(token))
      navigate("/", { replace: true })
    } else {
      navigate("/auth/login", { replace: true })
    }
  }, [navigate])

  return <div className="flex h-screen items-center justify-center text-muted-foreground">Autenticando...</div>
}
```

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

```tsx
const [params] = useSearchParams()
const email = params.get("email") ?? ""
```

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

```tsx
// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom"
import { getToken } from "@/lib/auth"

export function ProtectedRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/auth/login" replace />
}

// src/components/auth/GuestRoute.tsx
export function GuestRoute() {
  return getToken() ? <Navigate to="/" replace /> : <Outlet />
}
```

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
- Chamar `fetch()` ou `axios` diretamente — sempre `apiFetch()` de `@/lib/api`
- Armazenar o JWT em `sessionStorage`, cookie ou estado React — somente `localStorage` via `setToken()`
- Colocar `AuthCallbackPage` dentro do `GuestRoute` — bloqueia o callback quando há token antigo
- Exibir formulários de `RegisterPage` ou `ForgotPasswordPage` na `LoginPage` em modo `discord`
- Revelar se um e-mail existe ou não na tela de recuperação de senha
