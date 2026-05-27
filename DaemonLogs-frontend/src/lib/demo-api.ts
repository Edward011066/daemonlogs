import type { DiscordPublicUser, DiscordUserInfo, GuildChannelsResponse, ServerLookupResponse } from "@/types"
import {
  demoDiscordUsers,
  demoDmChannels,
  demoEvents,
  demoGuildChannels,
  demoMonitoringAccounts,
  demoMonitoringStats,
  demoMyToken,
  demoPayments,
  demoReferrals,
  demoDiscordTokenValidation,
  demoServerLookupFallback,
  demoServers,
  demoTargets,
  demoTargetsAmount,
  demoToolsStatus,
  demoUser,
} from "./demo-data"

function cloneDemoValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function parseJsonBody(options: RequestInit): Record<string, unknown> {
  if (!options.body || typeof options.body !== "string") return {}

  try {
    return JSON.parse(options.body) as Record<string, unknown>
  } catch {
    return {}
  }
}

function resolveEvents(searchParams: URLSearchParams) {
  const targetId = searchParams.get("targetId")
  const tipo = searchParams.get("tipo")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const page = Number(searchParams.get("page") ?? "1") || 1
  const limit = Number(searchParams.get("limit") ?? "50") || 50

  let items = [...demoEvents]

  if (targetId) {
    items = items.filter((event) => event.conta_alvo.discord_user_id === targetId)
  }

  if (tipo) {
    items = items.filter((event) => event.tipo === tipo)
  }

  if (from) {
    const fromTime = new Date(from).getTime()
    if (!Number.isNaN(fromTime)) {
      items = items.filter((event) => new Date(event.created_at).getTime() >= fromTime)
    }
  }

  if (to) {
    const toTime = new Date(to).getTime()
    if (!Number.isNaN(toTime)) {
      items = items.filter((event) => new Date(event.created_at).getTime() <= toTime)
    }
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const start = Math.max(0, (page - 1) * limit)

  return {
    total: items.length,
    page,
    limit,
    items: cloneDemoValue(items.slice(start, start + limit)),
  }
}

function resolveServerLookup(options: RequestInit): ServerLookupResponse {
  const body = parseJsonBody(options)
  const guildId = typeof body.guild_id === "string" ? body.guild_id : ""
  const server = demoServers.items.find((item) => item.guild_id === guildId)

  if (server) {
    return cloneDemoValue({ monitored: true, server })
  }

  return cloneDemoValue(demoServerLookupFallback(guildId))
}

function resolveDiscordUser(pathname: string): DiscordPublicUser {
  const discordUserId = pathname.split("/").pop() ?? ""
  const user = demoDiscordUsers.find((item) => item.id === discordUserId)

  return cloneDemoValue(
    user ?? {
      id: discordUserId,
      username: "usuario_demo",
      username_global: "Usuário Demo",
      avatar: null,
    },
  )
}

function resolveGuildChannels(pathname: string): GuildChannelsResponse {
  const guildId = pathname.split("/").pop() ?? ""
  const guild = demoGuildChannels.find((item) => item.guild_id === guildId)

  return cloneDemoValue(
    guild ?? {
      guild_id: guildId,
      guild_name: "Servidor demo",
      channels: [],
    },
  )
}

function resolveValidateDiscordToken(options: RequestInit): DiscordUserInfo {
  const body = parseJsonBody(options)
  const token = typeof body.token === "string" ? body.token.trim() : ""

  if (!token || /invalid|expirado|expired/i.test(token)) {
    return cloneDemoValue({ valid: false, user: null })
  }

  return cloneDemoValue(demoDiscordTokenValidation)
}

export function resolveDemoApiResponse<T>(
  path: string,
  options: RequestInit = {},
): T | undefined {
  const method = (options.method ?? "GET").toUpperCase()
  const url = new URL(path, "https://demo.daemonlogs.local")
  const { pathname, searchParams } = url

  if (method === "GET") {
    switch (pathname) {
      case "/me":
        return cloneDemoValue(demoUser) as T
      case "/me/referrals":
        return cloneDemoValue(demoReferrals) as T
      case "/my-token":
        return cloneDemoValue(demoMyToken) as T
      case "/monitoring":
        return cloneDemoValue(demoMonitoringAccounts) as T
      case "/monitoring/stats":
        return cloneDemoValue(demoMonitoringStats) as T
      case "/targets":
        return cloneDemoValue(demoTargets) as T
      case "/targets-amount":
        return cloneDemoValue(demoTargetsAmount) as T
      case "/events":
        return resolveEvents(searchParams) as T
      case "/servers":
        return cloneDemoValue(demoServers) as T
      case "/payments":
        return cloneDemoValue(demoPayments) as T
      case "/tools/status":
        return cloneDemoValue(demoToolsStatus) as T
      case "/utils/dm-channels":
        return cloneDemoValue({ channels: demoDmChannels }) as T
      default:
        break
    }

    if (pathname.startsWith("/payments/status/")) {
      const correlationId = pathname.split("/").pop() ?? ""
      const payment = demoPayments.find((item) => item.correlation_id === correlationId)
      return cloneDemoValue(payment ?? demoPayments[1]) as T
    }

    if (pathname.startsWith("/utils/discord-user/")) {
      return resolveDiscordUser(pathname) as T
    }

    if (pathname.startsWith("/utils/guild-channels/")) {
      return resolveGuildChannels(pathname) as T
    }
  }

  if (method === "POST" && pathname === "/servers") {
    return resolveServerLookup(options) as T
  }

  if (method === "POST" && pathname === "/utils/validate-discord-token") {
    return resolveValidateDiscordToken(options) as T
  }

  return undefined
}