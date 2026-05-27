# DaemonLogs — Instruções Globais do Copilot

> Estas são as regras invariantes do projeto. Elas se aplicam a **todas** as interações.
> Regras específicas de módulo, integração e banco ficam nas instructions dedicadas em `.github/instructions/`.

---

## Stack

- **Runtime**: Node.js 22+ — ESM puro (`"type": "module"`, extensões `.js` em imports)
- **Framework API**: Fastify v5 (`fastify@^5`)
- **ORM**: Prisma + PostgreSQL
- **Auth**: `@fastify/jwt` + `@fastify/cookie`
- **Selfbot**: `discord.js-selfbot-v13`
- **TypeScript**: strict mode, path alias `@/*` → `src/*`
- **Build**: `tsup`

---

## Arquitetura Obrigatória de Módulo

```
Routes → Controller → Service → Repository → Prisma
```

Todo módulo fica em `src/modules/<nome>/` com:

```
routes.ts      # Fastify plugin com schema JSON Schema (obrigatório para Swagger)
controller.ts  # Extrai dados do request → chama service → monta response
service.ts     # Lógica de negócio → chama repository
repository.ts  # Único ponto de acesso ao Prisma (omitir apenas se stateless)
```

Módulos **stateless** (`utils`, `tools`) não têm `repository.ts` — ver instructions de cada um.

---

## Regras Absolutas (nunca violar)

### Imports e módulos
- Sempre usar extensão `.js` nos imports TypeScript: `import { foo } from './foo.js'`
- `prisma` só pode ser importado dentro de arquivos `repository.ts`
- Código `discord.js-selfbot-v13` só pode existir dentro de `src/selfbot/`

### Rotas Fastify
- **Toda rota precisa de schema JSON Schema** — sem schema = Swagger quebrado
- `handler:` sempre dentro das opções, nunca como 3º argumento (Fastify v5)
- Rotas protegidas: `onRequest: [fastify.authenticate]` — nunca `preHandler`
- Rate limit por rota: `config: { rateLimit: { max, timeWindow, ban? } }`
- Webhooks externos: **nunca** usar `fastify.authenticate`

### Erros
- Sempre usar `AppError(statusCode, 'CODIGO_SEMANTICO', 'mensagem')` de `src/utils/app-error.ts`
- Nunca lançar `new Error()` genérico
- Nunca revelar detalhes internos em mensagens de erro de usuário

### Segurança
- Comparações de tokens/códigos: sempre `crypto.timingSafeEqual()` — nunca `===`
- Geração de códigos aleatórios: sempre `crypto.randomBytes()` ou `crypto.randomInt()` — nunca `Math.random()`
- Senhas: sempre `bcrypt.hash(pwd, AUTH_CONFIG.salt_rounds)` — nunca plain text
- Tokens Discord (selfbot): armazenar plain string, **sem hash** (são usados diretamente para login)
- Discord IDs (Snowflake): sempre `String @db.VarChar(20)` no Prisma — nunca `Int` ou `BigInt`

### Planos e negócio
- Verificações de plano: sempre no **service**, nunca no controller
- Source of truth de premium: `premium_expires_at > new Date()` — não só `is_premium`
- Limites de plano: sempre ler de `src/config/plan-rules.ts` — nunca hardcodar

---

## Convenções de Resposta de Erro

```typescript
// AppError → handler global converte para:
{
  error: 'CODIGO_SEMANTICO',   // snake_UPPER_CASE
  message: 'Descrição humana',
  meta?: { ... }               // opcional: dados extras (ex: liberado_em)
}
```

Exemplos de códigos padronizados no projeto:
`INVALID_CREDENTIALS`, `IP_BLOCKED`, `COOLDOWN_ACTIVE`, `PREMIUM_REQUIRED`,
`TARGET_LIMIT_REACHED`, `NO_VALID_TOKEN`, `INVALID_SIGNATURE`, `NOT_FOUND`

---

## Configuração por Variáveis de Ambiente

Toda constante configurável lê de `process.env` com fallback seguro:
```typescript
const valorCentavos = Number(process.env.WOOVI_CHARGE_VALUE_CENTS ?? 3990)
```

Limites de plano e TTLs: centralizados em `src/config/plan-rules.ts` e `src/config/auth-config.ts`.

---

## Referências Rápidas

| Necessidade | Ver instrução |
|-------------|--------------|
| Criar rota/endpoint/módulo | `api.instructions.md` |
| Auth, sessão, JWT | `auth.instructions.md` |
| Discord OAuth2 | `discord-oauth.instructions.md` |
| Banco, Prisma, migrations | `database.instructions.md` |
| Freemium/Premium, planos | `premium.instructions.md` |
| Pagamentos Woovi PIX | `payments.instructions.md` |
| Pagamentos MisticPay | `misticpay.instructions.md` |
| Selfbot, discord.js | `selfbot.instructions.md` |
| My-token pessoal | `my-token.instructions.md` |
| Clear-chat, exclusão | `clear-chat.instructions.md` |
| Automações (tools) | `tools.instructions.md` |
| Utilitários Discord | `utils.instructions.md` |
| Rate limiting | `rate-limit.instructions.md` |
| Docker, .env | `docker.instructions.md` |
