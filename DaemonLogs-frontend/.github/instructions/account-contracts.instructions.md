---
description: "Use when: editar tipos compartilhados da API, consumir /me, consumir /targets, consumir /my-token, consumir /me/referrals, ajustar dashboard, perfil, quota, target card, my-token panel, aplicar summary/detail, trabalhar em src/types/index.ts, src/hooks/useCurrentUser.ts, src/hooks/useMyToken.ts, src/hooks/useReferrals.ts, src/hooks/useTargets.ts, src/components/me/**, src/components/targets/**, src/pages/DashboardPage.tsx, src/pages/ProfilePage.tsx, src/components/events/EventFilters.tsx."
applyTo: "src/types/index.ts,src/hooks/useCurrentUser.ts,src/hooks/useMyToken.ts,src/hooks/useReferrals.ts,src/hooks/useTargets.ts,src/components/me/**,src/components/targets/**,src/pages/DashboardPage.tsx,src/pages/ProfilePage.tsx,src/components/events/EventFilters.tsx"
---

# Contratos de Conta, Alvos e Perfil

Fonte primária: [api-endpoints.json](../../api-endpoints.json)

## Regra central

Tipos crus em `src/types/index.ts` devem refletir o payload real da API. Se a UI quiser aliases amigáveis, derive no componente ou em mapper local.

## `/me`

- A spec documenta `clear_chat`, não `clear_chat_quota`
- Campos documentados dentro de `clear_chat`: `messages_deleted`, `messages_remaining`, `period_start_at`, `period_resets_at`
- `discord_login` existe e deve continuar sendo respeitado na UI

## `/me/referrals`

- A resposta é um objeto com `total` e `items`
- Não modele como `Referral[]` diretamente sem adaptação explícita

## `/targets`

- O POST documenta `username_global`; a spec anexada não documenta `display_name` nem `avatar_url`
- Para rotular o alvo na UI, prefira fallback local como `username_global ?? username ?? discord_user_id`
- Não promova `display_name` para contrato compartilhado sem validação explícita do backend

## `/my-token`

- A spec documenta `token`, `is_valid`, `created_at` e `updated_at`
- O payload documentado não inclui `discord_user`
- Não crie dependência nova em avatar/nome de usuário embutidos sem confirmação na spec

## Arquitetura de informação obrigatória

### `/me`

- Overview: `username`, `email`, `plan`, status de `my_token`, resumo de `clear_chat` e alertas realmente acionáveis.
- Detail: `referral_code`, `premium_expires_at`, `created_at`, flags operacionais e demais metadados.
- `clear_chat` deve destacar primeiro `messages_remaining` ou estado ilimitado; contadores e datas entram como suporte.

### `/me/referrals`

- Use `total` como métrica principal.
- `items` deve aparecer como preview curto ou lista segmentada, nunca como bloco longo misturado ao overview do perfil.
- Se a tela mostrar referrals e perfil juntos, referrals vira seção própria com carregamento sob demanda quando possível.

### `/targets`

- Master row/card: `username_global ?? username ?? discord_user_id`, `discord_user_id`, `created_at`.
- Detail: IDs completos, nomes alternativos, ações e navegação para eventos filtrados por `targetId`.
- Relação com `/events` sempre vira subview independente; nunca embuta eventos completos na lista de alvos.

### `/my-token`

- O token é dado técnico e sensível: mostre status primeiro, token mascarado por padrão quando a UX permitir, e revele/copie sob ação explícita.
- `created_at` e `updated_at` entram como metadado secundário.
- Não construa overview dependente de um objeto `discord_user` não documentado.

### Dashboard e Perfil

- Dashboard mostra visão geral, métricas agregadas e previews curtos. Relações detalhadas ficam para páginas ou seções próprias.
- Perfil deve separar overview, segurança, token e referrals em blocos distintos, evitando uma coluna longa com tudo misturado.
- Em qualquer componente que consuma esses contratos, priorize leitura humana antes de IDs internos e timestamps completos.

## Outros contratos relacionados

- `GET /utils/dm-channels` usa `recipient_id`, `recipient_username`, `recipient_global_name`, `recipient_avatar`
- Não invente coleções como `recipient_ids` quando a spec usa campos escalares

## O que a IA NUNCA deve fazer

- Renomear `clear_chat` para `clear_chat_quota` em tipos crus
- Tratar `/me/referrals` como array simples sem mapper
- Assumir `display_name`, `avatar_url` ou `discord_user` como parte garantida do contrato atual
- Espalhar aliases intuitivos por múltiplos módulos em vez de centralizar a adaptação