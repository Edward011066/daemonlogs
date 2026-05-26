import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  Hash,
  Server,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"
import { EventBadge, EVENT_ICON, EVENT_DOT_CLASSES } from "./EventBadge"
import type { DiscordEvent, DiscordUserRef, VoiceJoinDados, VoiceLeaveDados, VoiceSwitchDados } from "@/types"

type EventData = Record<string, unknown>

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `há ${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `há ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d}d`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function getRawData(event: DiscordEvent): EventData {
  return event.dados && typeof event.dados === "object"
    ? (event.dados as EventData)
    : {}
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function getStringByKeys(data: EventData, keys: string[]): string | null {
  for (const key of keys) {
    const value = getString(data[key])
    if (value) return value
  }
  return null
}

function getUsers(value: unknown): DiscordUserRef[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []

    const data = item as Record<string, unknown>
    const username = getString(data.username)
    const discordUserId = getString(data.discord_user_id)

    if (!username || !discordUserId) return []

    return [{ username, discord_user_id: discordUserId }]
  })
}

function getTargetLabel(event: DiscordEvent) {
  return event.conta_alvo.username ?? event.conta_alvo.discord_user_id
}

function getEventTimestamp(event: DiscordEvent) {
  return getString(getRawData(event).timestamp) ?? event.created_at
}

function truncateText(value: string, max = 180) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}...`
}

function getMessageDetails(event: DiscordEvent) {
  const data = getRawData(event)

  return {
    guildName: getStringByKeys(data, ["guild_name"]),
    channelName: getStringByKeys(data, ["channel_name", "canal_nome"]),
    content: getStringByKeys(data, ["conteudo", "content", "mensagem"]),
    deletedContent: getStringByKeys(data, ["conteudo_apagado", "deleted_content", "content_deleted"]),
    beforeContent: getStringByKeys(data, ["conteudo_anterior", "conteudo_antigo", "content_before"]),
    afterContent: getStringByKeys(data, ["conteudo_novo", "conteudo_editado", "content_after"]),
    messageId: getStringByKeys(data, ["message_id"]),
    guildId: getStringByKeys(data, ["guild_id"]),
    channelId: getStringByKeys(data, ["channel_id"]),
    link: getStringByKeys(data, ["link_mensagem", "message_link"]),
  }
}

function SummaryRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  )
}

function DetailBlock({
  title,
  value,
  tone = "default",
}: {
  title: string
  value: string
  tone?: "default" | "danger" | "warning" | "success"
}) {
  const toneClass =
    tone === "danger"
      ? "border-destructive/20 bg-destructive/5"
      : tone === "warning"
        ? "border-warning/20 bg-warning/5"
        : tone === "success"
          ? "border-success/20 bg-success/5"
          : "border-border bg-surface-2"

  return (
    <div className={cn("rounded-lg border p-3", toneClass)}>
      <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="whitespace-pre-wrap break-words font-mono text-xs text-foreground/90">{value}</p>
    </div>
  )
}

function UserChip({ user }: { user: DiscordUserRef }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      {user.username}
    </span>
  )
}

function EventSummary({ event }: { event: DiscordEvent }) {
  const data = getRawData(event)
  const timestamp = getEventTimestamp(event)

  if (event.tipo === "VOICE_JOIN") {
    const voice = data as unknown as VoiceJoinDados
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {voice.guild_name && <SummaryRow icon={Server}>{voice.guild_name}</SummaryRow>}
          {voice.canal_novo_nome && <SummaryRow icon={Hash}>{voice.canal_novo_nome}</SummaryRow>}
          <SummaryRow icon={Users}>{getUsers(data.usuarios_presentes).length} na call</SummaryRow>
          <SummaryRow icon={Clock3}>{formatDate(timestamp)}</SummaryRow>
        </div>
      </div>
    )
  }

  if (event.tipo === "VOICE_LEAVE") {
    const voice = data as unknown as VoiceLeaveDados
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {voice.guild_name && <SummaryRow icon={Server}>{voice.guild_name}</SummaryRow>}
          {voice.canal_anterior_nome && <SummaryRow icon={Hash}>{voice.canal_anterior_nome}</SummaryRow>}
          <SummaryRow icon={Users}>{getUsers(data.usuarios_que_ficaram).length} ficaram</SummaryRow>
          <SummaryRow icon={Clock3}>{formatDate(timestamp)}</SummaryRow>
        </div>
      </div>
    )
  }

  if (event.tipo === "VOICE_SWITCH") {
    const voice = data as unknown as VoiceSwitchDados
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {voice.guild_name && <SummaryRow icon={Server}>{voice.guild_name}</SummaryRow>}
        <SummaryRow icon={Hash}>{`${voice.canal_anterior_nome} -> ${voice.canal_novo_nome}`}</SummaryRow>
        <SummaryRow icon={Clock3}>{formatDate(timestamp)}</SummaryRow>
      </div>
    )
  }

  const message = getMessageDetails(event)
  const summary =
    event.tipo === "MESSAGE_EDIT"
      ? message.afterContent ?? message.beforeContent ?? message.content ?? "Mensagem editada"
      : event.tipo === "MESSAGE_DELETE"
        ? message.deletedContent ?? message.content ?? "Mensagem apagada"
        : message.content ?? "Evento de mensagem"

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {message.guildName && <SummaryRow icon={Server}>{message.guildName}</SummaryRow>}
        {message.channelName && <SummaryRow icon={Hash}>{message.channelName}</SummaryRow>}
        <SummaryRow icon={Clock3}>{formatDate(timestamp)}</SummaryRow>
      </div>
      <p className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-foreground/90">
        {truncateText(summary)}
      </p>
    </div>
  )
}

function EventDetails({ event }: { event: DiscordEvent }) {
  const data = getRawData(event)

  if (event.tipo === "VOICE_JOIN") {
    const voice = data as unknown as VoiceJoinDados
    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          {voice.guild_name && <DetailBlock title="Servidor" value={voice.guild_name} />}
          {voice.canal_novo_nome && <DetailBlock title="Canal" value={voice.canal_novo_nome} tone="success" />}
        </div>
        {getUsers(data.usuarios_presentes).length > 0 && (
          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">Usuários presentes</p>
            <div className="flex flex-wrap gap-1.5">
              {getUsers(data.usuarios_presentes).map((user) => (
                <UserChip key={user.discord_user_id} user={user} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (event.tipo === "VOICE_LEAVE") {
    const voice = data as unknown as VoiceLeaveDados
    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          {voice.guild_name && <DetailBlock title="Servidor" value={voice.guild_name} />}
          {voice.canal_anterior_nome && <DetailBlock title="Canal anterior" value={voice.canal_anterior_nome} tone="warning" />}
        </div>
        {getUsers(data.usuarios_que_ficaram).length > 0 && (
          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">Quem ficou na call</p>
            <div className="flex flex-wrap gap-1.5">
              {getUsers(data.usuarios_que_ficaram).map((user) => (
                <UserChip key={user.discord_user_id} user={user} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (event.tipo === "VOICE_SWITCH") {
    const voice = data as unknown as VoiceSwitchDados
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {voice.guild_name && <DetailBlock title="Servidor" value={voice.guild_name} />}
        {voice.canal_anterior_nome && <DetailBlock title="Saiu de" value={voice.canal_anterior_nome} tone="warning" />}
        {voice.canal_novo_nome && <DetailBlock title="Entrou em" value={voice.canal_novo_nome} tone="success" />}
      </div>
    )
  }

  const message = getMessageDetails(event)
  const details = [
    message.guildName ? { title: "Servidor", value: message.guildName } : null,
    message.channelName ? { title: "Canal", value: message.channelName } : null,
    message.messageId ? { title: "Message ID", value: message.messageId } : null,
    message.guildId ? { title: "Guild ID", value: message.guildId } : null,
    message.channelId ? { title: "Channel ID", value: message.channelId } : null,
  ].filter(Boolean) as { title: string; value: string }[]

  const deletedValue = event.tipo === "MESSAGE_DELETE"
    ? message.deletedContent ?? message.content
    : message.deletedContent

  return (
    <div className="space-y-3">
      {details.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {details.map((detail) => (
            <DetailBlock key={detail.title} title={detail.title} value={detail.value} />
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {message.content && event.tipo !== "MESSAGE_DELETE" && (
          <DetailBlock title="Conteúdo" value={message.content} tone="success" />
        )}
        {deletedValue && (
          <DetailBlock title="Conteúdo apagado" value={deletedValue} tone="danger" />
        )}
        {message.beforeContent && (
          <DetailBlock title="Antes" value={message.beforeContent} tone="warning" />
        )}
        {message.afterContent && (
          <DetailBlock title="Depois" value={message.afterContent} tone="success" />
        )}
      </div>

      {message.link && (
        <a
          href={message.link}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir mensagem
        </a>
      )}
    </div>
  )
}

function EventCard({
  event,
  isLast,
  expanded,
  onToggle,
}: {
  event: DiscordEvent
  isLast: boolean
  expanded: boolean
  onToggle: () => void
}) {
  const Icon = EVENT_ICON[event.tipo]
  const dotClass = EVENT_DOT_CLASSES[event.tipo]

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onToggle()
    }
  }

  return (
    <div className="relative flex gap-4">
      {!isLast && <div className="absolute bottom-0 left-[19px] top-10 w-px bg-border" />}

      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border",
          dotClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 pb-6">
        <div
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          className={cn(
            "rounded-lg border border-border bg-surface px-4 py-3 shadow-sm transition-colors",
            expanded ? "border-accent/30" : "hover:border-accent/20 hover:bg-surface/90",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <EventBadge type={event.tipo} showIcon />
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {getTargetLabel(event)}
                </span>
              </div>

              <EventSummary event={event} />
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span title={formatDate(getEventTimestamp(event))}>{timeAgo(getEventTimestamp(event))}</span>
              <span className="hidden sm:inline">{formatDate(getEventTimestamp(event))}</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>

          {expanded && (
            <div className="mt-4 border-t border-border pt-4">
              <EventDetails event={event} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface EventTimelineProps {
  events: DiscordEvent[]
}

export function EventTimeline({ events }: EventTimelineProps) {
  const [expandedId, setExpandedId] = useState<number | null>(events[0]?.id ?? null)

  useEffect(() => {
    if (!events.length) {
      setExpandedId(null)
      return
    }

    setExpandedId((current) => (events.some((event) => event.id === current) ? current : events[0].id))
  }, [events])

  return (
    <div className="space-y-0">
      {events.map((event, index) => (
        <EventCard
          key={event.id}
          event={event}
          isLast={index === events.length - 1}
          expanded={expandedId === event.id}
          onToggle={() => setExpandedId((current) => (current === event.id ? null : event.id))}
        />
      ))}
    </div>
  )
}
