import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { EventsFilters } from "@/hooks/useEvents"
import type { EventType } from "@/types"

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "VOICE_JOIN",     label: "Entrou em voz" },
  { value: "VOICE_LEAVE",    label: "Saiu de voz" },
  { value: "VOICE_SWITCH",   label: "Trocou de canal" },
  { value: "MESSAGE_SENT",   label: "Mensagem enviada" },
  { value: "MESSAGE_EDIT",   label: "Mensagem editada" },
  { value: "MESSAGE_DELETE", label: "Mensagem deletada" },
  { value: "MENTION",        label: "Menção" },
]

interface EventFiltersProps {
  filters: EventsFilters
  onChange: (f: EventsFilters) => void
}

export function EventFilters({ filters, onChange }: EventFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Tipo</Label>
        <Select
          value={filters.tipo ?? "all"}
          onValueChange={(v) => onChange({ ...filters, tipo: v === "all" ? undefined : (v as EventType), page: 1 })}
        >
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">De</Label>
        <Input
          type="date"
          className="h-8 w-36 text-xs"
          value={filters.from ? filters.from.split("T")[0] : ""}
          onChange={(e) =>
            onChange({ ...filters, from: e.target.value ? `${e.target.value}T00:00:00Z` : undefined, page: 1 })
          }
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Até</Label>
        <Input
          type="date"
          className="h-8 w-36 text-xs"
          value={filters.to ? filters.to.split("T")[0] : ""}
          onChange={(e) =>
            onChange({ ...filters, to: e.target.value ? `${e.target.value}T23:59:59Z` : undefined, page: 1 })
          }
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-muted-foreground"
        onClick={() => onChange({})}
      >
        Limpar
      </Button>
    </div>
  )
}
