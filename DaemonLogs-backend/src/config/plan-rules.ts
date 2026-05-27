export const PLAN_RULES = {
  freemium: {
    max_targets: 2,
    cooldown_hours: 24,
    requires_active_monitoring: true,
  },
  premium: {
    max_targets: Infinity,
    cooldown_hours: 0,
    requires_active_monitoring: false,
  },
  server_count_premium: {
    enabled: true,
    min_unique_servers: 3,
    premium_days: 7,
  },
  my_token_cooldown_hours: Number(process.env.MY_TOKEN_COOLDOWN_HOURS ?? 24),
  clear_chat: {
    premium_only: false,          // false para freemium também pode usar
    freemium_max_deletions: 500,  // default(500) mensagens excluídas por período
    freemium_cooldown_hours: 24,  // default(24) janela do período
    base_delete_delay_ms: 600,    // default(600) delay base entre exclusões (simula comportamento humano)
    search_delay_ms: 1000,        // default(1000) delay entre buscas de batch
  },  tools: {
    premium_only: false,          // false = freemium também pode usar automações
    action_delay_ms: 600,         // delay entre ações individuais (fechar DM, sair de servidor, remover relação)
  },} as const


