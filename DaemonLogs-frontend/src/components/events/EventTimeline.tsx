import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Hash, Server, Users } from "lucide-react"
import { EventBadge, EVENT_ICON, EVENT_DOT_CLASSES } from "./EventBadge"
import type { DiscordEvent, EventType, VoiceJoinDados, VoiceLeaveDados, VoiceSwitchDados, DiscordUserRef } from "@/types"

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// ─── sub-components ───────────────────────────────────────────────────────────

function UserChip({ user }: { user: DiscordUserRef }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      {user.username}
    </span>
  )
}

function VoiceEventBody({ tipo, dados }: { tipo: EventType; dados: Record<string, unknown> }) {
  if (tipo === "VOICE_JOIN") {
    const d = dados as unknown as VoiceJoinDados
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Server className="h-3.5 w-3.5 text-accent/70" />
            {d.guild_name}
          </span>
          <span className="flex items-center gap-1">
            <Hash className="h-3.5 w-3.5 text-info/70" />
            {d.canal_novo_nome}
          </span>
        </div>
        {d.usuarios_presentes?.length > 0 && (
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {d.usuarios_presentes.length} na call
            </span>
            <div className="flex flex-wrap gap-1">
              {d.usuarios_presentes.map((u) => (
                <UserChip key={u.discord_user_id} user={u} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (tipo === "VOICE_LEAVE") {
    const d = dados as unknown as VoiceLeaveDados
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Server className="h-3.5 w-3.5 text-accent/70" />
            {d.guild_name}
          </span>
          <span className="flex items-center gap-1">
            <Hash className="h-3.5 w-3.5 text-info/70" />
            {d.canal_anterior_nome}
          </span>
        </div>
        {d.usuarios_que_ficaram?.length > 0 && (
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {d.usuarios_que_ficaram.length} que ficaram
            </span>
            <div className="flex flex-wrap gap-1">
              {d.usuarios_que_ficaram.map((u) => (
                <UserChip key={u.discord_user_id} user={u} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (tipo === "VOICE_SWITCH") {
    const d = dados as unknown as VoiceSwitchDados
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Server className="h-3.5 w-3.5 text-accent/70" />
          {d.guild_name}
        </span>
        <span className="flex items-center gap-1">
          <Hash className="h-3.5 w-3.5 text-muted-foreground/60" />
          {d.canal_anterior_nome}
        </span>
        <span className="text-muted-foreground/50">→</span>
        <span className="flex items-center gap-1">
          <Hash className="h-3.5 w-3.5 text-info/70" />
          {d.canal_novo_nome}
        </span>
      </div>
    )
  }

  // MESSAGE_* / MENTION
  const d = dados as Record<string, unknown>
  return (
    <div className="space-y-1.5">
      {(d.guild_name || d.channel_name) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {d.guild_name && (
            <span className="flex items-center gap-1">
              <Server className="h-3.5 w-3.5 text-accent/70" />
              {String(d.guild_name)}
            </span>
          )}
          {d.channel_name && (
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5 text-info/70" />
              {String(d.channel_name)}
            </span>
          )}
        </div>
      )}
      {d.content && (
        <p className="rounded border border-border bg-surface-2 px-3 py-2 text-xs text-foreground/80 font-mono">
          {String(d.content)}
        </p>
      )}
    </div>
  )
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({ event, isLast }: { event: DiscordEvent; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = EVENT_ICON[event.tipo]
  const dotClass = EVENT_DOT_CLASSES[event.tipo]

  const hasDetails =
    event.tipo === "VOICE_JOIN" ||
    event.tipo === "VOICE_LEAVE" ||
    event.tipo === "VOICE_SWITCH" ||
    event.tipo === "MESSAGE_SENT" ||
    event.tipo === "MESSAGE_EDIT" ||
    event.tipo === "MESSAGE_DELETE" ||
    event.tipo === "MENTION"

  return (
    <div className="relative flex gap-4">
      {/* Linha vertical */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
      )}

      {/* Ícone */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border",
          dotClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 pb-6">
        <div className="rounded-lg border border-border bg-surface px-4 py-3 shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <EventBadge type={event.tipo} showIcon />
              <span className="text-sm font-medium text-foreground">
                {event.conta_alvo.username}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs text-muted-foreground"
                title={formatDate(event.created_at)}
              >
                {timeAgo(event.created_at)}
              </span>
              <span className="hidden text-xs text-muted-foreground/60 sm:inline">
                {formatDate(event.created_at)}
              </span>
            </div>
          </div>

          {/* Body principal */}
          {hasDetails && (
            <div className="mt-3">
              <VoiceEventBody tipo={event.tipo} dados={event.dados} />
            </div>
          )}

          {/* Toggle dados brutos */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="h-3 w-3" /> Recolher dados brutos</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> Ver dados brutos</>
            )}
          </button>

          {expanded && (
            <pre className="mt-2 overflow-x-auto rounded border border-border bg-surface-2 p-3 text-xs text-muted-foreground font-mono leading-relaxed">
              {JSON.stringify(event.dados, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── EventTimeline ────────────────────────────────────────────────────────────

interface EventTimelineProps {
  events: DiscordEvent[]
}

export function EventTimeline({ events }: EventTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <EventCard key={event.id} event={event} isLast={i === events.length - 1} />
      ))}
    </div>
  )
}
