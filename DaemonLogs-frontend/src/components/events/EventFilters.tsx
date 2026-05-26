import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useTargets } from "@/hooks/useTargets"
import type { EventsFilters } from "@/hooks/useEvents"
import type { EventType } from "@/types"
import { CalendarDays, X } from "lucide-react"

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "VOICE_JOIN",     label: "Entrou em voz" },
  { value: "VOICE_LEAVE",    label: "Saiu de voz" },
  { value: "VOICE_SWITCH",   label: "Trocou de canal" },
  { value: "MESSAGE_SENT",   label: "Mensagem enviada" },
  { value: "MESSAGE_EDIT",   label: "Mensagem editada" },
  { value: "MESSAGE_DELETE", label: "Mensagem deletada" },
  { value: "MENTION",        label: "Menção" },
]

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

function daysAgoISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split("T")[0]
}

interface EventFiltersProps {
  filters: EventsFilters
  onChange: (f: EventsFilters) => void
}

export function EventFilters({ filters, onChange }: EventFiltersProps) {
  const { data: targets } = useTargets()

  const hasActiveFilters =
    !!filters.targetId || !!filters.tipo || !!filters.from || !!filters.to

  return (
    <div className="space-y-3">
      {/* Atalhos de período */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          Período rápido:
        </span>
        {[
          { label: "Hoje",      from: todayISO(),      to: todayISO() },
          { label: "7 dias",   from: daysAgoISO(6),   to: todayISO() },
          { label: "30 dias",  from: daysAgoISO(29),  to: todayISO() },
        ].map(({ label, from, to }) => {
          const fromISO = `${from}T00:00:00Z`
          const toISO   = `${to}T23:59:59Z`
          const isActive = filters.from === fromISO && filters.to === toISO
          return (
            <Button
              key={label}
              variant="outline"
              size="sm"
              className={`h-7 px-3 text-xs ${
                isActive
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              onClick={() =>
                onChange({ ...filters, from: fromISO, to: toISO, page: 1 })
              }
            >
              {label}
            </Button>
          )
        })}
      </div>

      {/* Filtros principais */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Alvo */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Alvo</Label>
          <Select
            value={filters.targetId ?? "all"}
            onValueChange={(v) =>
              onChange({ ...filters, targetId: v === "all" ? undefined : v, page: 1 })
            }
          >
            <SelectTrigger className="h-8 w-52 text-xs">
              <SelectValue placeholder="Todos os alvos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os alvos</SelectItem>
              {targets?.map((t) => (
                <SelectItem key={t.discord_user_id} value={t.discord_user_id}>
                  {t.username_global ?? t.username ?? t.discord_user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <Select
            value={filters.tipo ?? "all"}
            onValueChange={(v) =>
              onChange({ ...filters, tipo: v === "all" ? undefined : (v as EventType), page: 1 })
            }
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* De */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">De</Label>
          <Input
            type="date"
            className="h-8 w-36 text-xs"
            value={filters.from ? filters.from.split("T")[0] : ""}
            onChange={(e) =>
              onChange({
                ...filters,
                from: e.target.value ? `${e.target.value}T00:00:00Z` : undefined,
                page: 1,
              })
            }
          />
        </div>

        {/* Até */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Até</Label>
          <Input
            type="date"
            className="h-8 w-36 text-xs"
            value={filters.to ? filters.to.split("T")[0] : ""}
            onChange={(e) =>
              onChange({
                ...filters,
                to: e.target.value ? `${e.target.value}T23:59:59Z` : undefined,
                page: 1,
              })
            }
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange({})}
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
