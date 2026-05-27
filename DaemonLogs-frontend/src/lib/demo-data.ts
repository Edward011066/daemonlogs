import type {
  DiscordEvent,
  DiscordPublicUser,
  DiscordServer,
  GuildChannelsResponse,
  MonitoringAccount,
  MonitoringStats,
  MyToken,
  OpenDmChannel,
  PaymentStatusResponse,
  Referral,
  ServerLookupResponse,
  Target,
  ToolsStatus,
  User,
} from "@/types"

const now = Date.now()

const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString()
const hoursAgo = (hours: number) => new Date(now - hours * 3_600_000).toISOString()
const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString()
const hoursFromNow = (hours: number) => new Date(now + hours * 3_600_000).toISOString()
const daysFromNow = (days: number) => new Date(now + days * 86_400_000).toISOString()

// Todos os dados de demonstração ficam centralizados aqui para facilitar ajustes futuros.
export const demoUser: User = {
  id: 999,
  username: "demo_operator",
  email: "demo@daemonlogs.local",
  is_admin: false,
  plan: "freemium",
  premium_expires_at: null,
  referral_code: "DEMO24",
  referral_count: 3,
  clear_chat_quota: {
    deletions_used: 184,
    deletions_limit: 500,
    window_hours: 24,
    resets_at: hoursFromNow(5),
  },
  my_token: {
    has_token: true,
    is_valid: true,
  },
  discord_login: false,
}

export const demoMyToken: MyToken = {
  token: "mfa.demo.monitoring.token",
  is_valid: true,
  discord_user: {
    id: "900000000000000001",
    username: "scout_hub",
    avatar: null,
  },
}

export const demoReferrals: Referral[] = [
  { id: 1, username: "livia", created_at: daysAgo(2) },
  { id: 2, username: "guilherme", created_at: daysAgo(5) },
  { id: 3, username: "marina", created_at: daysAgo(8) },
]

export const demoMonitoringAccounts: MonitoringAccount[] = [
  { id: 101, username: "scout_hub", is_valid: true, created_at: daysAgo(9) },
  { id: 102, username: "relay_watch", is_valid: true, created_at: daysAgo(6) },
  { id: 103, username: "alt_grid", is_valid: true, created_at: daysAgo(3) },
  { id: 104, username: "night_probe", is_valid: false, created_at: hoursAgo(14) },
]

export const demoMonitoringStats: MonitoringStats = {
  my_active: demoMonitoringAccounts.filter((account) => account.is_valid).length,
  total_active: 18,
}

export const demoTargets: Target[] = [
  {
    id: 201,
    discord_user_id: "178945612340987654",
    username: "voidsignal",
    username_global: "Void Signal",
    usuario_id: 999,
    created_at: daysAgo(12),
    updated_at: hoursAgo(9),
  },
  {
    id: 202,
    discord_user_id: "286734561209876543",
    username: "mika_core",
    username_global: "Mika",
    usuario_id: 999,
    created_at: daysAgo(7),
    updated_at: hoursAgo(4),
  },
  {
    id: 203,
    discord_user_id: "398761245609876543",
    username: "noctisfeed",
    username_global: null,
    usuario_id: 999,
    created_at: daysAgo(4),
    updated_at: hoursAgo(2),
  },
  {
    id: 204,
    discord_user_id: "470123456789012345",
    username: "iris_trace",
    username_global: "Iris Trace",
    usuario_id: 999,
    created_at: daysAgo(2),
    updated_at: minutesAgo(50),
  },
]

export const demoServers: { total: number; items: DiscordServer[] } = {
  total: 428,
  items: [
    { id: 1, guild_id: "110001000100010001", server_name: "Pict", created_at: daysAgo(2) },
    { id: 2, guild_id: "110001000100010002", server_name: "NM", created_at: daysAgo(4) },
    { id: 3, guild_id: "110001000100010003", server_name: "CDO • amizades • Brasil", created_at: daysAgo(6) },
    { id: 4, guild_id: "110001000100010004", server_name: "metc marcha", created_at: daysAgo(7) },
    { id: 5, guild_id: "110001000100010005", server_name: "Cria Hub", created_at: daysAgo(1) },
    { id: 6, guild_id: "110001000100010006", server_name: "After Hours", created_at: hoursAgo(18) },
    { id: 7, guild_id: "110001000100010007", server_name: "Lurkers", created_at: hoursAgo(12) },
    { id: 8, guild_id: "110001000100010008", server_name: "Atlas Core", created_at: hoursAgo(9) },
    { id: 9, guild_id: "110001000100010009", server_name: "Rift Social", created_at: hoursAgo(7) },
    { id: 10, guild_id: "110001000100010010", server_name: "Shadow Vault", created_at: hoursAgo(5) },
    { id: 11, guild_id: "110001000100010011", server_name: "Signal Feed", created_at: hoursAgo(3) },
    { id: 12, guild_id: "110001000100010012", server_name: "Night Transit", created_at: minutesAgo(75) },
  ],
}

export const demoTargetsAmount = {
  total: 1842,
}

export const demoEvents: DiscordEvent[] = [
  {
    id: 9001,
    tipo: "MESSAGE_SENT",
    created_at: minutesAgo(8),
    conta_alvo: { discord_user_id: demoTargets[0].discord_user_id, username: demoTargets[0].username },
    dados: {
      guild_id: demoServers.items[0].guild_id,
      guild_name: demoServers.items[0].server_name,
      channel_id: "220001000100010001",
      channel_name: "geral",
      timestamp: minutesAgo(8),
      message_id: "330001000100010001",
      link_mensagem: `https://discord.com/channels/${demoServers.items[0].guild_id}/220001000100010001/330001000100010001`,
      conteudo: "Fechou, vou entrar na call daqui a pouco. Se a staff aparecer me avisa na hora.",
    },
  },
  {
    id: 9002,
    tipo: "MESSAGE_EDIT",
    created_at: minutesAgo(14),
    conta_alvo: { discord_user_id: demoTargets[1].discord_user_id, username: demoTargets[1].username },
    dados: {
      guild_id: demoServers.items[3].guild_id,
      guild_name: demoServers.items[3].server_name,
      channel_id: "220001000100010002",
      channel_name: "chat-noturno",
      timestamp: minutesAgo(14),
      message_id: "330001000100010002",
      conteudo_anterior: "acho que nao vao entrar hoje",
      conteudo_novo: "acho que vao entrar hoje sim, so estao demorando",
      link_mensagem: `https://discord.com/channels/${demoServers.items[3].guild_id}/220001000100010002/330001000100010002`,
    },
  },
  {
    id: 9003,
    tipo: "MESSAGE_DELETE",
    created_at: minutesAgo(21),
    conta_alvo: { discord_user_id: demoTargets[2].discord_user_id, username: demoTargets[2].username },
    dados: {
      guild_id: demoServers.items[5].guild_id,
      guild_name: demoServers.items[5].server_name,
      channel_id: "220001000100010003",
      channel_name: "confissoes",
      timestamp: minutesAgo(21),
      message_id: "330001000100010003",
      conteudo_apagado: "apaga isso depois, mandei sem querer aqui",
    },
  },
  {
    id: 9004,
    tipo: "MENTION",
    created_at: minutesAgo(27),
    conta_alvo: { discord_user_id: demoTargets[3].discord_user_id, username: demoTargets[3].username },
    dados: {
      guild_id: demoServers.items[8].guild_id,
      guild_name: demoServers.items[8].server_name,
      channel_id: "220001000100010004",
      channel_name: "alertas",
      timestamp: minutesAgo(27),
      message_id: "330001000100010004",
      conteudo: "@iris_trace entra aqui agora, preciso falar contigo em privado.",
    },
  },
  {
    id: 9005,
    tipo: "VOICE_JOIN",
    created_at: minutesAgo(33),
    conta_alvo: { discord_user_id: demoTargets[0].discord_user_id, username: demoTargets[0].username },
    dados: {
      guild_id: demoServers.items[1].guild_id,
      guild_name: demoServers.items[1].server_name,
      timestamp: minutesAgo(33),
      canal_novo_id: "440001000100010001",
      canal_novo_nome: "Sala 2",
      usuarios_presentes: [
        { username: "voidsignal", discord_user_id: demoTargets[0].discord_user_id },
        { username: "relay_watch", discord_user_id: "910000000000000102" },
        { username: "mika_core", discord_user_id: demoTargets[1].discord_user_id },
      ],
    },
  },
  {
    id: 9006,
    tipo: "VOICE_SWITCH",
    created_at: minutesAgo(46),
    conta_alvo: { discord_user_id: demoTargets[1].discord_user_id, username: demoTargets[1].username },
    dados: {
      guild_id: demoServers.items[6].guild_id,
      guild_name: demoServers.items[6].server_name,
      timestamp: minutesAgo(46),
      canal_anterior_id: "440001000100010002",
      canal_anterior_nome: "AFK",
      canal_novo_id: "440001000100010003",
      canal_novo_nome: "Squad",
      usuarios_canal_anterior: [
        { username: "alt_grid", discord_user_id: "910000000000000103" },
      ],
      usuarios_canal_novo: [
        { username: "mika_core", discord_user_id: demoTargets[1].discord_user_id },
        { username: "iris_trace", discord_user_id: demoTargets[3].discord_user_id },
      ],
    },
  },
  {
    id: 9007,
    tipo: "VOICE_LEAVE",
    created_at: hoursAgo(2),
    conta_alvo: { discord_user_id: demoTargets[2].discord_user_id, username: demoTargets[2].username },
    dados: {
      guild_id: demoServers.items[4].guild_id,
      guild_name: demoServers.items[4].server_name,
      timestamp: hoursAgo(2),
      canal_anterior_id: "440001000100010004",
      canal_anterior_nome: "Reunião",
      usuarios_que_ficaram: [
        { username: "night_probe", discord_user_id: "910000000000000104" },
        { username: "iris_trace", discord_user_id: demoTargets[3].discord_user_id },
      ],
    },
  },
  {
    id: 9008,
    tipo: "MESSAGE_SENT",
    created_at: hoursAgo(4),
    conta_alvo: { discord_user_id: demoTargets[3].discord_user_id, username: demoTargets[3].username },
    dados: {
      guild_id: demoServers.items[11].guild_id,
      guild_name: demoServers.items[11].server_name,
      channel_id: "220001000100010005",
      channel_name: "late-chat",
      timestamp: hoursAgo(4),
      message_id: "330001000100010005",
      conteudo: "Amanhã eu sumo desse servidor, então pega tudo hoje e salva o que for importante.",
    },
  },
]

export const demoPayments: PaymentStatusResponse[] = [
  {
    id: 301,
    correlation_id: "pix-demo-completed-001",
    valor_centavos: 2990,
    status: "COMPLETED",
    premium_expires_at: daysFromNow(30),
    created_at: daysAgo(11),
  },
  {
    id: 302,
    correlation_id: "pix-demo-active-002",
    valor_centavos: 2990,
    status: "ACTIVE",
    premium_expires_at: null,
    created_at: minutesAgo(35),
  },
  {
    id: 303,
    correlation_id: "pix-demo-expired-003",
    valor_centavos: 2990,
    status: "EXPIRED",
    premium_expires_at: null,
    created_at: daysAgo(18),
  },
]

export const demoToolsStatus: ToolsStatus = {
  active: false,
}

export const demoDiscordUsers: DiscordPublicUser[] = demoTargets.map((target) => ({
  id: target.discord_user_id,
  username: target.username,
  username_global: target.username_global,
  avatar: null,
}))

export const demoGuildChannels: GuildChannelsResponse[] = demoServers.items.slice(0, 4).map((server, index) => ({
  guild_id: server.guild_id,
  guild_name: server.server_name,
  channels: [
    {
      id: `55000100010001${String(index).padStart(2, "0")}1`,
      name: "geral",
      type: "GUILD_TEXT",
      position: 0,
      parent_id: null,
    },
    {
      id: `55000100010001${String(index).padStart(2, "0")}2`,
      name: "prints",
      type: "GUILD_TEXT",
      position: 1,
      parent_id: null,
    },
    {
      id: `55000100010001${String(index).padStart(2, "0")}3`,
      name: "voice-log",
      type: "GUILD_TEXT",
      position: 2,
      parent_id: null,
    },
  ],
}))

export const demoDmChannels: OpenDmChannel[] = [
  {
    id: "660001000100010001",
    recipient_id: demoTargets[0].discord_user_id,
    recipient_username: demoTargets[0].username,
    recipient_global_name: demoTargets[0].username_global,
    recipient_avatar: null,
  },
  {
    id: "660001000100010002",
    recipient_id: demoTargets[1].discord_user_id,
    recipient_username: demoTargets[1].username,
    recipient_global_name: demoTargets[1].username_global,
    recipient_avatar: null,
  },
]

export const demoServerLookupFallback = (guildId: string): ServerLookupResponse => ({
  monitored: false,
  server: {
    id: 0,
    guild_id: guildId,
    server_name: "Servidor não encontrado",
    created_at: new Date(now).toISOString(),
  },
})