import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Activity, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { EventFilters } from "@/components/events/EventFilters"
import { EventBadge } from "@/components/events/EventBadge"
import { EventDetailSheet } from "@/components/events/EventDetailSheet"
import { useEvents, type EventsFilters } from "@/hooks/useEvents"
import type { DiscordEvent } from "@/types"

type RawData = Record<string, unknown>

function getRaw(event: DiscordEvent): RawData {
  return event.dados && typeof event.dados === "object" ? (event.dados as RawData) : {}
}

function sVal(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null
}

function firstStr(data: RawData, keys: string[]): string | null {
  for (const k of keys) {
    const v = sVal(data[k])
    if (v) return v
  }
  return null
}

function getEventPreview(event: DiscordEvent): string | null {
  const data = getRaw(event)
  switch (event.tipo) {
    case "MESSAGE_SENT":
    case "MENTION":
      return firstStr(data, ["conteudo", "content", "mensagem"])?.slice(0, 70) ?? null
    case "MESSAGE_EDIT":
      return (
        firstStr(data, ["conteudo_novo", "conteudo_editado", "content_after"])?.slice(0, 70) ??
        "Mensagem editada"
      )
    case "MESSAGE_DELETE":
      return (
        firstStr(data, ["conteudo_apagado", "deleted_content", "conteudo"])?.slice(0, 70) ??
        "Mensagem apagada"
      )
    case "VOICE_JOIN": {
      const c = sVal(data.canal_novo_nome)
      return c ? `→ ${c}` : null
    }
    case "VOICE_LEAVE": {
      const c = sVal(data.canal_anterior_nome)
      return c ? `← ${c}` : null
    }
    case "VOICE_SWITCH": {
      const f = sVal(data.canal_anterior_nome)
      const t = sVal(data.canal_novo_nome)
      return f && t ? `${f} → ${t}` : null
    }
    default:
      return null
  }
}

function getGuild(event: DiscordEvent): string | null {
  return sVal(getRaw(event).guild_name)
}

function getChannel(event: DiscordEvent): string | null {
  const data = getRaw(event)
  return sVal(data.channel_name) ?? sVal(data.canal_nome) ?? sVal(data.canal_novo_nome) ?? sVal(data.canal_anterior_nome)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const LIMIT = 25

export function EventsPage() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<EventsFilters>({
    page: 1,
    limit: LIMIT,
    targetId: searchParams.get("targetId") ?? undefined,
  })
  const [selectedEvent, setSelectedEvent] = useState<DiscordEvent | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data, isLoading, error } = useEvents(filters)

  const page = filters.page ?? 1
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const handleRowClick = (event: DiscordEvent) => {
    setSelectedEvent(event)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Eventos</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de atividade dos alvos monitorados
          </p>
        </div>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {total.toLocaleString("pt-BR")} eventos
          </span>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <EventFilters
          filters={filters}
          onChange={(f) => setFilters({ ...f, page: 1, limit: LIMIT })}
        />
      </div>

      {error && <ErrorAlert error={error} />}

      {isLoading ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <Skeleton className="h-5 w-28 shrink-0" />
              <Skeleton className="h-4 w-24 shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12 shrink-0" />
            </div>
          ))}
        </div>
      ) : data?.items.length ? (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            {data.items.map((event) => {
              const targetLabel = event.conta_alvo.username ?? event.conta_alvo.discord_user_id
              const preview = getEventPreview(event)
              const guild = getGuild(event)
              const channel = getChannel(event)
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleRowClick(event)}
                  className="group flex w-full items-start gap-3 border-b border-border bg-surface px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-2"
                >
                  <div className="shrink-0 pt-0.5">
                    <EventBadge type={event.tipo} showIcon className="text-[11px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                      <span className="text-sm font-medium text-foreground">{targetLabel}</span>
                      {guild && (
                        <span className="truncate text-xs text-muted-foreground">
                          · {guild}
                        </span>
                      )}
                      {channel && (
                        <span className="truncate text-xs text-accent/70">
                          #{channel}
                        </span>
                      )}
                    </div>
                    {preview && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{preview}</p>
                    )}
                  </div>
                  <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground">
                    {timeAgo(event.created_at)}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={Activity}
          title="Nenhum evento encontrado"
          description="Ajuste os filtros ou aguarde novos eventos dos alvos."
        />
      )}

      <EventDetailSheet event={selectedEvent} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
