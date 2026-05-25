---
description: "Use when: implementar login, criar autenticação, gerenciar sessão, adicionar JWT, verificar token Discord, bloquear IP, regra de sessão única, ativar conta, reenviar email de ativação, sistema de indicações, referral code, is_admin, is_activated, AUTH_MODE, auth-config, auth_config, discord oauth, oauth2, trabalhar em módulo auth, src/modules/auth."
applyTo: "src/modules/auth/**"
---

# Auth e Sessões — Regras de Implementação

## AUTH_MODE — Configuração Central

O modo de autenticação é controlado pela variável `AUTH_MODE` no `.env` e lido via `src/config/auth-config.ts`:

```typescript
import { AUTH_CONFIG } from '../../config/auth-config.js'
// AUTH_CONFIG.mode === 'local' | 'discord'
```

| `AUTH_MODE` | Rotas ativas | SMTP necessário? |
|-------------|-------------|------------------|
| `local` (padrão) | `/auth/register`, `/auth/login`, `/auth/activate`, `/auth/forgot-password`, etc. | Sim (se `EMAIL_ENABLED=true`) |
| `discord` | `GET /auth/discord`, `GET /auth/discord/callback` | Não |

> Para o fluxo Discord OAuth2 completo, consulte `.github/instructions/discord-oauth.instructions.md`.

**Constantes não-críticas centralizadas em `src/config/auth-config.ts`:**
- `AUTH_CONFIG.session_ttl_ms` — TTL da sessão (24h). Usar em vez de hardcodar `24 * 60 * 60 * 1000`
- `AUTH_CONFIG.salt_rounds` — Rounds do bcrypt (12). Usar em vez de hardcodar `12`
- `AUTH_CONFIG.discord.*` — Configurações OAuth2 Discord

## Fluxo de Registro (obrigatório, nesta ordem)

```
POST /auth/register  { username, password, email, referral_code? }
  1. Se EMAIL_ENABLED=true → validateEmailDomain(email) — rejeita domínios bloqueados/não permitidos
  2. Verificar se username e email já existem (409 separados)
  3. Se referral_code fornecido → buscar usuário referenciado (404 se não existe)
  4. Hash bcrypt(password, 12)
  5. Gerar referral_code único (8 chars hex uppercase) para o novo usuário
  6. Criar usuário com is_activated=false (ou true se EMAIL_ENABLED=false)
  7. Se EMAIL_ENABLED=true → gerar código de ativação + salvar em email_verifications + sendActivationEmail
```

## Fluxo de Ativação de Conta

```
POST /auth/activate  { code: string }
  1. Buscar código em email_verifications (404 se não existe)
  2. Checar used=true (409 CODE_ALREADY_USED)
  3. Checar expires_at < now (410 CODE_EXPIRED)
  4. markEmailVerificationUsed(id)
  5. activateUsuario(usuario_id) → is_activated=true
  6. Se usuário tem referred_by_id → processReferral(referred_by_id)
```

### processReferral
```typescript
// src/modules/auth/service.ts
async function processReferral(referrerId: number) {
  const threshold = Number(process.env.REFERRAL_PREMIUM_THRESHOLD ?? 5)
  const updated = await incrementReferralCount(referrerId)  // retorna { referral_count, premium_expires_at }
  if (updated.referral_count >= threshold) {
    const base = updated.premium_expires_at > new Date() ? updated.premium_expires_at : new Date()
    const newExpires = new Date(base)
    newExpires.setDate(newExpires.getDate() + 30)
    await activateUserPremium(referrerId, newExpires)  // de plans/repository.ts
  }
}
```

## Fluxo de Login (obrigatório, nesta ordem)

```
POST /auth/login
  1. Buscar usuário por username (401 INVALID_CREDENTIALS se não existe)
  2. bcrypt.compare(password, hash) (401 INVALID_CREDENTIALS se falhar)
  3. Checar is_activated=false → 403 ACCOUNT_NOT_ACTIVATED
  4. Verificar sessão ativa: se IP diferente → 403 IP_BLOCKED + liberado_em (ISO 8601)
  5. Invalidar todas as sessões anteriores do usuário
  6. Criar nova sessão com JWT + IP
```

> Login **não** exige token Discord válido. Tokens de monitoramento são adicionados separadamente.

## Fluxo de Reset de Senha

```
POST /auth/forgot-password  { email }
  1. Se EMAIL_ENABLED=false → 400 EMAIL_DISABLED
  2. Buscar usuário por email — se não existir: retornar 200 silenciosamente
     (⚠️ OWASP A01: NUNCA revelar se o email está ou não cadastrado)
  3. deleteOldPasswordResetsForUser(usuario.id) — limpar resets anteriores
  4. Gerar código de 6 dígitos via crypto.randomInt(100000, 1000000) — NUNCA Math.random()
  5. Salvar em password_resets com expires_at = now + PASSWORD_RESET_TTL_MINUTES
  6. sendPasswordResetEmail(email, code)

POST /auth/verify-reset-code  { code: string (6 dígitos) }
  1. Buscar código em password_resets (404 INVALID_CODE se não existe)
  2. Checar used=true (409 CODE_ALREADY_USED)
  3. Checar expires_at < now (410 CODE_EXPIRED)
  4. Retornar 200 SEM marcar como usado — permite frontend exibir step de nova senha

POST /auth/reset-password  { code: string, new_password: string }
  1. Mesmas validações do verify-reset-code (404, 409, 410)
  2. markPasswordResetUsed(id) — consumir o código antes de qualquer outra operação
  3. bcrypt.hash(new_password, 12)
  4. updateUserPassword(usuario_id, hashedPassword)
```

> **Segurança crítica:** `forgot-password` retorna HTTP 200 mesmo quando o email não está cadastrado. Essa resposta genérica é intencional e obrigatória — previne enumeração de usuários (OWASP A01). Não alterar para retornar 404.

## Campo is_admin — Acesso Irrestrito

- `is_admin=true` é definido **diretamente no banco** pelo dono do projeto — não existe endpoint para isso
- Usuários admin bypassam todas as verificações de plano (`assertCanAddTarget` retorna imediatamente)
- `is_admin` é carregado do banco em **cada requisição autenticada** via `src/plugins/auth.ts`
- Disponível em `request.user.is_admin` em qualquer controller

```typescript
// src/plugins/auth.ts — após jwtVerify() e validação de sessão
const dbUser = await prisma.usuarios.findUnique({ where: { id: sub }, select: { is_admin: true } })
request.user = { sub, ip, is_admin: dbUser?.is_admin ?? false }
```

## Validação de Domínio de Email

- Lógica em `src/utils/email-validator.ts` — função `validateEmailDomain(email)`
- Listas configuráveis via `.env`: `ALLOWED_EMAIL_DOMAINS` e `BLOCKED_EMAIL_DOMAINS` (separados por vírgula)
- Quando `EMAIL_ENABLED=false`: skip de toda validação + ativação automática (modo debug)

## JWT

- Payload: `{ sub: usuarioId, ip: ipDaRequisicao }`
- `request.user` após authenticate: `{ sub, ip, is_admin }` — `is_admin` vem do banco, não do JWT

## Variáveis de Ambiente Necessárias

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `AUTH_MODE` | `local` | `local` (email/senha) ou `discord` (OAuth2 — dispensa SMTP) |
| `EMAIL_ENABLED` | `true` | `false` desativa email e auto-ativa contas (apenas `AUTH_MODE=local`) |
| `SMTP_HOST` | — | Host SMTP (apenas `AUTH_MODE=local`) |
| `SMTP_PORT` | `587` | Porta SMTP |
| `SMTP_SECURE` | `false` | `true` para TLS (porta 465) |
| `SMTP_USER` | — | Usuário SMTP |
| `SMTP_PASS` | — | Senha de app SMTP |
| `SMTP_FROM` | `noreply@SMTP_HOST` | Remetente dos emails |
| `ACTIVATION_CODE_TTL_MINUTES` | `60` | Validade do código de ativação |
| `PASSWORD_RESET_TTL_MINUTES` | `15` | Validade do código de reset de senha (TTL curto — segurança) |
| `ALLOWED_EMAIL_DOMAINS` | `gmail.com,...` | Domínios permitidos |
| `BLOCKED_EMAIL_DOMAINS` | `10minutemail.com,...` | Domínios bloqueados |
| `REFERRAL_PREMIUM_THRESHOLD` | `5` | Indicações para ganhar premium |
| `APP_URL` | `http://localhost:3000` | URL base para links nos emails |
| `DISCORD_CLIENT_ID` | — | App ID Discord (apenas `AUTH_MODE=discord`) |
| `DISCORD_CLIENT_SECRET` | — | Secret Discord — **nunca logar** (apenas `AUTH_MODE=discord`) |
| `DISCORD_REDIRECT_URI` | `…/auth/discord/callback` | Deve bater com o Discord Developer Portal |
| `DISCORD_OAUTH_FRONTEND_REDIRECT` | `http://localhost:5173` | Frontend que recebe `?token=JWT` |

## Erros Padronizados

| Situação | HTTP | Código |
|----------|------|--------|
| Credenciais inválidas | 401 | `INVALID_CREDENTIALS` |
| Conta não ativada | 403 | `ACCOUNT_NOT_ACTIVATED` |
| IP bloqueado | 403 | `IP_BLOCKED` + `liberado_em` |
| JWT expirado/inválido | 401 | `UNAUTHORIZED` |
| IP diverge | 401 | `IP_MISMATCH` |
| Email de domínio inválido | 422 | `INVALID_EMAIL_DOMAIN` |
| Código inválido (ativação/reset) | 404 | `INVALID_CODE` |
| Código expirado | 410 | `CODE_EXPIRED` |
| Código já usado | 409 | `CODE_ALREADY_USED` |
| Rota local chamada no modo discord | 400 | `AUTH_MODE_DISCORD` |
| State CSRF inválido (Discord OAuth) | 400 | `INVALID_STATE` |

## O que a IA NUNCA deve fazer

- Armazenar password em plain text — sempre bcrypt com salt rounds ≥ 12
- Criar mais de uma sessão ativa por usuário simultaneamente
- Omitir a verificação de IP no JWT middleware (exceto sessões `discord_oauth`)
- Validar token Discord fora de `src/selfbot/functions/validate-token`
- Permitir login com `is_activated=false`
- Criar endpoint para definir `is_admin=true` — sempre via banco direto
- Usar `===` para comparar tokens de segurança — usar `crypto.timingSafeEqual`
- Hardcodar listas de domínios — sempre ler de `process.env`
- Contar indicação na criação do usuário — contar apenas na **ativação** da conta
- Hardcodar `24 * 60 * 60 * 1000` ou `12` — usar `AUTH_CONFIG.session_ttl_ms` e `AUTH_CONFIG.salt_rounds`
- Registrar rotas locais E OAuth2 simultaneamente — condicional por `AUTH_CONFIG.mode`
- Criar rota `/auth/discord` quando `AUTH_MODE=local` — rota simplesmente não existe

