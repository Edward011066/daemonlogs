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

// ── Targets ───────────────────────────────────────────────────────────────────

export interface Target {
  id: number
  discord_user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

// ── Events ────────────────────────────────────────────────────────────────────

export type EventType =
  | "voice_join"
  | "voice_leave"
  | "voice_move"
  | "message_edit"
  | "message_delete"
  | "mention"

export interface DiscordEvent {
  id: number
  event_type: EventType
  target_discord_user_id: string
  target_username: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface EventsResponse {
  items: DiscordEvent[]
  total: number
  page: number
  limit: number
}

// ── Servers ───────────────────────────────────────────────────────────────────

export interface DiscordServer {
  id: string
  name: string
  icon_url: string | null
  member_count: number
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
  }
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
    avatar: string | null
  }
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
