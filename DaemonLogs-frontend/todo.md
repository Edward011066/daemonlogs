# DaemonLogs Frontend — TODO

## Fase 1: Setup do Projeto
- [x] Scaffold Vite + React + TypeScript (arquivos de config criados)
- [x] `package.json` com todas as dependências
- [x] `vite.config.ts` com alias `@/`
- [x] `tailwind.config.ts` com tema Dracula
- [x] `components.json` (shadcn/ui)
- [x] `src/index.css` com variáveis CSS do tema
- [ ] `npm install` — instalar dependências
- [ ] `npx shadcn@latest add` — adicionar componentes UI

## Fase 2: Foundation
- [x] `src/lib/utils.ts` — `cn()`
- [x] `src/lib/api.ts` — `apiFetch` + `ApiError`
- [x] `src/lib/auth.ts` — `getToken`, `setToken`, `clearToken`, `getAuthMode`
- [x] `src/types/index.ts` — todas as interfaces TypeScript
- [x] `src/main.tsx`
- [x] `src/App.tsx`
- [x] `src/router.tsx`

## Fase 3: Hooks de Dados
- [x] `src/hooks/useCurrentUser.ts` — GET /me
- [x] `src/hooks/useMonitoring.ts` — GET/POST/DELETE /monitoring
- [x] `src/hooks/useTargets.ts` — GET/POST/DELETE /targets
- [x] `src/hooks/useEvents.ts` — GET /events (com filtros)
- [x] `src/hooks/useTools.ts` — status + cancel + 3 automações
- [x] `src/hooks/useClearChat.ts` — channel/server/dms/cancel
- [x] `src/hooks/useMyToken.ts` — GET/POST/DELETE/PATCH /my-token
- [x] `src/hooks/usePayments.ts` — initiate + status (polling) + history

## Fase 4: Componentes Compartilhados
- [x] `src/components/shared/StatusDot.tsx`
- [x] `src/components/shared/PlanBadge.tsx`
- [x] `src/components/shared/AsyncButton.tsx`
- [x] `src/components/shared/CopyButton.tsx`
- [x] `src/components/shared/EmptyState.tsx`
- [x] `src/components/shared/ErrorAlert.tsx`

## Fase 5: Autenticação
- [x] `src/components/auth/ProtectedRoute.tsx`
- [x] `src/components/auth/GuestRoute.tsx`
- [x] `src/components/auth/LocalLoginForm.tsx`
- [x] `src/components/auth/DiscordLoginButton.tsx`
- [x] `src/components/auth/RegisterForm.tsx`
- [x] `src/components/auth/ActivateForm.tsx`
- [x] `src/components/auth/ForgotPasswordForm.tsx`
- [x] `src/components/auth/ResetPasswordForm.tsx`
- [x] `src/pages/auth/LoginPage.tsx`
- [x] `src/pages/auth/RegisterPage.tsx`
- [x] `src/pages/auth/ActivatePage.tsx`
- [x] `src/pages/auth/ForgotPasswordPage.tsx`
- [x] `src/pages/auth/ResetPasswordPage.tsx`
- [x] `src/pages/auth/AuthCallbackPage.tsx`

## Fase 6: Layout Base
- [x] `src/components/layout/AppShell.tsx`
- [x] `src/components/layout/Sidebar.tsx`
- [x] `src/components/layout/Header.tsx`

## Fase 7: Dashboard
- [x] `src/pages/DashboardPage.tsx`
- [x] `src/components/me/QuotaDisplay.tsx`

## Fase 8: Monitoramento
- [x] `src/pages/MonitoringPage.tsx`
- [x] `src/components/monitoring/MonitoringCard.tsx`
- [x] `src/components/monitoring/AddMonitoringDialog.tsx`

## Fase 9: Alvos
- [x] `src/pages/TargetsPage.tsx`
- [x] `src/components/targets/TargetCard.tsx`
- [x] `src/components/targets/AddTargetDialog.tsx`

## Fase 10: Eventos
- [x] `src/pages/EventsPage.tsx`
- [x] `src/components/events/EventBadge.tsx`
- [x] `src/components/events/EventsTable.tsx`
- [x] `src/components/events/EventFilters.tsx`

## Fase 11: Ferramentas (Tools + Clear-Chat)
- [x] `src/pages/ToolsPage.tsx`
- [x] `src/components/tools/ToolCard.tsx`
- [x] `src/components/tools/ToolStatusBanner.tsx`
- [x] `src/hooks/useClearChat.ts`

## Fase 12: My-Token
- [x] `src/components/me/MyTokenPanel.tsx`

## Fase 13: Pagamentos PIX
- [x] `src/pages/PaymentsPage.tsx`
- [x] `src/components/payments/PixQRCode.tsx`
- [x] `src/components/payments/PaymentHistory.tsx`

## Fase 14: Perfil do Usuário
- [x] `src/pages/ProfilePage.tsx`
- [x] `src/components/me/ChangePasswordForm.tsx`
- [x] `src/components/me/ReferralSection.tsx`

## Pendente / Próximos Passos
- [ ] Testes unitários (Vitest)
- [ ] Testes E2E (Playwright)
- [ ] Internacionalização (i18n) se necessário
- [ ] PWA / Service Worker
- [ ] Otimização de bundle / code splitting por rota
