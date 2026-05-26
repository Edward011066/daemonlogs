// ── Auth ──────────────────────────────────────────────────────────────────────

export type Plan = "freemium" | "premium" | "admin"

export interface ClearChatQuota {
  deletions_used: number
  deletions_limit: number
  window_hours: number
  resets_at: string | null
}

export interface MyTokenStatus {
  has_token: boolean
  is_valid: boolean
}

export interface User {
  id: number
  username: string
  email: string
  is_admin: boolean
  plan: Plan
  premium_expires_at: string | null
  referral_code: string
  referral_count: number
  clear_chat_quota: ClearChatQuota
  my_token: MyTokenStatus
  discord_login: boolean
}

export interface Referral {
  id: number
  username: string
  created_at: string
}

// ── Monitoring ────────────────────────────────────────────────────────────────

export interface MonitoringAccount {
  id: number
  is_valid: boolean
  created_at: string
}

export interface MonitoringStats {
  my_active: number
  total_active: number
}

// ── Targets ───────────────────────────────────────────────────────────────────

export interface Target {
  id: number
  discord_user_id: string
  username: string
  username_global: string | null
  usuario_id: number
  created_at: string
  updated_at: string
}

// ── Events ────────────────────────────────────────────────────────────────────

export type EventType =
  | "VOICE_JOIN"
  | "VOICE_LEAVE"
  | "VOICE_SWITCH"
  | "MESSAGE_SENT"
  | "MESSAGE_EDIT"
  | "MESSAGE_DELETE"
  | "MENTION"

/** Referência a um usuário Discord embutida nos dados de evento */
export interface DiscordUserRef {
  username: string
  discord_user_id: string
}

/** Dados brutos de VOICE_JOIN */
export interface VoiceJoinDados {
  guild_id: string
  guild_name: string
  timestamp: string
  canal_novo_id: string
  canal_novo_nome: string
  usuarios_presentes: DiscordUserRef[]
}

/** Dados brutos de VOICE_LEAVE */
export interface VoiceLeaveDados {
  guild_id: string
  guild_name: string
  timestamp: string
  canal_anterior_id: string
  canal_anterior_nome: string
  usuarios_que_ficaram: DiscordUserRef[]
}

/** Dados brutos de VOICE_SWITCH */
export interface VoiceSwitchDados {
  guild_id: string
  guild_name: string
  timestamp: string
  canal_anterior_id: string
  canal_anterior_nome: string
  canal_novo_id: string
  canal_novo_nome: string
}

/** Dados brutos de MESSAGE_SENT / MESSAGE_EDIT / MESSAGE_DELETE / MENTION */
export interface MessageDados {
  guild_id?: string
  guild_name?: string
  channel_id?: string
  channel_name?: string
  timestamp?: string
  message_id?: string
  link_mensagem?: string
  conteudo?: string
  conteudo_apagado?: string
  conteudo_anterior?: string
  conteudo_antigo?: string
  conteudo_novo?: string
  conteudo_editado?: string
  content?: string
  deleted_content?: string
  content_before?: string
  content_after?: string
}

export type EventDados =
  | VoiceJoinDados
  | VoiceLeaveDados
  | VoiceSwitchDados
  | MessageDados

/**
 * Evento Discord retornado pela API (campo "tipo", "dados", "conta_alvo").
 * IMPORTANTE: os campos refletem a resposta real do servidor — não alterar.
 */
export interface DiscordEvent {
  id: number
  tipo: EventType
  dados: (EventDados & Record<string, unknown>) | null
  created_at: string
  conta_alvo: {
    discord_user_id: string
    username: string | null
  }
}

export interface EventsResponse {
  items: DiscordEvent[]
  total: number
  page: number
  limit: number
}

// ── Servers ───────────────────────────────────────────────────────────────────

export interface DiscordServer {
  id: number
  guild_id: string
  server_name: string
  created_at: string
}

export interface ServersResponse {
  total: number
  items: DiscordServer[]
}

// ── Messages ──────────────────────────────────────────────────────────────────

export interface Message {
  id: number
  discord_user_id: string
  channel_id: string
  content: string
  created_at: string
}

// ── Payments ──────────────────────────────────────────────────────────────────

export type PaymentStatus = "ACTIVE" | "COMPLETED" | "EXPIRED"

export interface PaymentInitiated {
  correlationId: string
  qrCodeImage: string
  brCode: string
  valorCentavos: number
  chargeExpiresAt: string
}

export interface PaymentStatusResponse {
  id: number
  correlation_id: string
  valor_centavos: number
  status: PaymentStatus
  premium_expires_at: string | null
  created_at: string
}

// ── My Token ──────────────────────────────────────────────────────────────────

export interface MyToken {
  token: string
  is_valid: boolean
  discord_user: {
    id: string
    username: string
    avatar: string | null
  } | null
}

// ── Tools ─────────────────────────────────────────────────────────────────────

export interface ToolsStatus {
  active: boolean
}

// ── Utils ─────────────────────────────────────────────────────────────────────

export interface DiscordUserInfo {
  valid: boolean
  user: {
    id: string
    username: string
    discriminator: string
    global_name: string | null
    avatar: string | null
    email: string | null
    phone: string | null
    mfa_enabled: boolean
    guild_count: number
    guilds: Array<{ id: string; name: string }>
    friend_count: number
    friends: Array<{
      id: string
      username: string
      global_name: string | null
      avatar: string | null
      discriminator: string
    }>
    // Campos estendidos — podem ou não ser retornados pela API
    bio?: string | null
    authenticator_types?: number[]
    age_verification_status?: number
    user_sessions?: Array<{
      id_hash: string
      approx_last_used_time: string | null
      client_info: {
        os: string | null
        platform: string | null
        location: string | null
      }
    }>
    payment_sources?: Array<{
      id: string
      type: number
      invalid: boolean
      flags: number
      deleted_at: string | null
      brand: string | null
      last_4: string | null
      expires_month: number | null
      expires_year: number | null
      email: string | null
      billing_address: { name: string; country: string } | null
      country: string | null
      payment_gateway: number
      payment_gateway_source_id: string | null
      default: boolean
    }>
    email_settings?: {
      categories: Record<string, boolean>
      initialized: boolean
    } | null
  } | null
}

export interface GuildChannel {
  id: string
  name: string
  type: number
}

export interface DmChannel {
  id: string
  recipient_ids: string[]
}
