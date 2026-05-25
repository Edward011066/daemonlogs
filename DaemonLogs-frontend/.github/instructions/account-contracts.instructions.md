---
description: "Use when: editar tipos compartilhados da API, consumir /me, consumir /targets, consumir /my-token, consumir /me/referrals, ajustar dashboard, perfil, quota, target card, my-token panel, trabalhar em src/types/index.ts, src/hooks/useCurrentUser.ts, src/hooks/useMyToken.ts, src/hooks/useReferrals.ts, src/hooks/useTargets.ts, src/components/me/**, src/components/targets/**, src/pages/DashboardPage.tsx, src/pages/ProfilePage.tsx, src/components/events/EventFilters.tsx."
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

## Outros contratos relacionados

- `GET /utils/dm-channels` usa `recipient_id`, `recipient_username`, `recipient_global_name`, `recipient_avatar`
- Não invente coleções como `recipient_ids` quando a spec usa campos escalares

## O que a IA NUNCA deve fazer

- Renomear `clear_chat` para `clear_chat_quota` em tipos crus
- Tratar `/me/referrals` como array simples sem mapper
- Assumir `display_name`, `avatar_url` ou `discord_user` como parte garantida do contrato atual
- Espalhar aliases intuitivos por múltiplos módulos em vez de centralizar a adaptação