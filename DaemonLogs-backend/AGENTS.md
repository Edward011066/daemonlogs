# DaemonLogs — Guia para Agentes de IA

## Visão Geral do Projeto

Sistema web de monitoramento de contas Discord. Usuários cadastrados adicionam **contas de monitoramento** (tokens Discord selfbot) e **contas alvo** (IDs de usuários Discord). As contas de monitoramento observam as contas alvo em tempo real e salvam eventos no banco de dados.

## Stack Técnica

| Camada | Tecnologia | Versão/Detalhe |
|--------|-----------|----------------|
| Runtime | Node.js + TypeScript | ESM, strict mode |
| API | Fastify | Swagger em `/api-docs` via `@fastify/swagger` + `@fastify/swagger-ui` |
| Banco | PostgreSQL + Prisma ORM | Migrations obrigatórias para qualquer mudança de schema |
| Discord | discord.js-selfbot-v13 | Selfbot, não bot oficial |
| Auth | JWT + bcrypt | Sessions por IP com limite 24h |
| Infra | Docker + Docker Compose | Todo o sistema containerizado |

## Estrutura de Diretórios

```
src/
├── modules/              # Cada módulo = routes + controller + service + repository
│   ├── auth/
│   ├── users/
│   ├── monitoring/       # Contas de monitoramento
│   ├── targets/          # Contas alvo
│   ├── servers/          # Servidores Discord
│   ├── messages/         # Mensagens salvas
│   └── events/           # Eventos de monitoramento (voice, edits, deletes, mentions)
├── selfbot/              # Tudo relacionado ao discord.js-selfbot-v13
│   ├── client-manager.ts # Gerencia múltiplos clientes selfbot
│   ├── events/           # Event handlers do selfbot (um arquivo por evento)
│   └── functions/        # Funções reutilizáveis do selfbot
├── plugins/              # Plugins Fastify (swagger, auth, prisma)
├── prisma/               # schema.prisma + migrations/
└── utils/                # Utilitários compartilhados
```

## Arquitetura Obrigatória de Módulos

```
Routes → Controller → Service → Repository → Prisma
```

- **Routes:** Apenas define endpoint, schema de validação e chama controller
- **Controller:** Apenas extrai dados do request e chama service. Nunca acessa Prisma diretamente
- **Service:** Lógica de negócio. Chama repository. Nunca acessa `req`/`reply` do Fastify
- **Repository:** Único ponto de acesso ao Prisma. Funções puras de CRUD

**Violações desta arquitetura são erros, não sugestões.**

## Regras Críticas do Projeto

### Banco de Dados
- Discord user IDs (ex: `1128502341000253550`) são `BigInt` → sempre armazenar como `String` no Prisma (`@db.VarChar(20)`)
- Tokens Discord: armazenar como `String` pura — **sem hash, sem criptografia**
- Passwords de usuários: **sempre** hash com bcrypt (`bcrypt.hash(password, 12)`)
- Toda tabela com dados deve ter `created_at DateTime @default(now())` e `updated_at DateTime @updatedAt`
- **Nunca editar** arquivos dentro de `prisma/migrations/` já aplicados
- Após qualquer mudança no `schema.prisma`: rodar `npx prisma migrate dev --name <descricao>`

### Selfbot (discord.js-selfbot-v13)
- **Nunca escrever código selfbot inline** em controllers, services ou qualquer outro lugar
- Toda interação com o selfbot deve chamar uma função de `src/selfbot/functions/`
- Cada evento Discord tem seu próprio arquivo em `src/selfbot/events/`
- O `ClientManager` em `src/selfbot/client-manager.ts` é o único ponto de criação de clientes
- Consulte a [documentação do pacote](https://www.npmjs.com/package/discord.js-selfbot-v13) para APIs disponíveis

### Auth e Sessões
- Apenas **1 sessão ativa por usuário** por vez
- Novo IP no mesmo dia → barrado com timestamp de quando poderá tentar novamente (24h)
- No login: verificar se existe ao menos 1 token `is_valid: true` vinculado ao usuário
- Token adicionado → validar imediatamente com selfbot antes de persistir com `is_valid: true`

### Deduplicação de Eventos
- Múltiplas contas de monitoramento não devem gerar **eventos duplicados** para o mesmo fato
- Usar chave de idempotência nos eventos (ex: `message_id` + `event_type`) com constraint `@unique` no Prisma

### API Fastify
- Toda rota deve ter schema JSON Schema para validação e geração automática do Swagger
- Erros: usar `reply.code(XXX).send({ error: 'mensagem' })` com códigos HTTP corretos
- Autenticação via JWT middleware aplicado como hook Fastify (`preHandler`)

### E.NV e ENV.EXAMPLE
Sempre devem ser atualizados para refletir as variáveis de ambiente necessárias para o projeto, incluindo chaves de API, segredos e configurações de porta. O `.env.example` serve como template para novos desenvolvedores configurarem suas próprias variáveis de ambiente.

## O que a IA NUNCA deve fazer

- Colocar lógica de negócio no Controller
- Acessar `prisma` fora do Repository
- Escrever código `discord.js-selfbot-v13` fora de `src/selfbot/`
- Criar funções duplicadas — sempre verificar se já existe em `src/selfbot/functions/` ou `src/utils/`
- Usar `any` no TypeScript sem justificativa explícita
- Hashear tokens Discord (apenas passwords recebem hash)
- Armazenar Discord IDs como `Int` ou `BigInt` no Prisma — usar `String`
- Adicionar lógica de sessão/auth fora de `src/modules/auth/`
- Gerar migrações com `prisma db push` — usar sempre `prisma migrate dev`
- Criar endpoints sem schema de validação (quebra o Swagger)

## Arquivos Gerados — Nunca Editar Diretamente

- `prisma/migrations/**` (arquivos já aplicados)
- `src/generated/**` (se houver geração de código)
- Qualquer arquivo CSS/JS compilado em `dist/` ou `build/`
