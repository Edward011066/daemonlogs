import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EventType } from "@/types"

const EVENT_CLASSES: Record<EventType, string> = {
  voice_join:     "bg-info/10 text-info border-info/20",
  voice_leave:    "bg-info/10 text-info border-info/20",
  voice_move:     "bg-info/10 text-info border-info/20",
  message_edit:   "bg-warning/10 text-warning border-warning/20",
  message_delete: "bg-destructive/10 text-destructive border-destructive/20",
  mention:        "bg-accent/10 text-accent border-accent/20",
}

const EVENT_LABEL: Record<EventType, string> = {
  voice_join:     "Entrou em voz",
  voice_leave:    "Saiu de voz",
  voice_move:     "Movido em voz",
  message_edit:   "Mensagem editada",
  message_delete: "Mensagem deletada",
  mention:        "Menção",
}

interface EventBadgeProps {
  type: EventType
  className?: string
}

export function EventBadge({ type, className }: EventBadgeProps) {
  return (
    <Badge variant="outline" className={cn(EVENT_CLASSES[type], className)}>
      {EVENT_LABEL[type]}
    </Badge>
  )
}
