import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EventType } from "@/types"

const EVENT_CLASSES: Record<EventType, string> = {
  VOICE_JOIN:     "bg-info/10 text-info border-info/20",
  VOICE_LEAVE:    "bg-info/10 text-info border-info/20",
  VOICE_SWITCH:   "bg-info/10 text-info border-info/20",
  MESSAGE_SENT:   "bg-success/10 text-success border-success/20",
  MESSAGE_EDIT:   "bg-warning/10 text-warning border-warning/20",
  MESSAGE_DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  MENTION:        "bg-accent/10 text-accent border-accent/20",
}

const EVENT_LABEL: Record<EventType, string> = {
  VOICE_JOIN:     "Entrou em voz",
  VOICE_LEAVE:    "Saiu de voz",
  VOICE_SWITCH:   "Trocou de canal",
  MESSAGE_SENT:   "Mensagem enviada",
  MESSAGE_EDIT:   "Mensagem editada",
  MESSAGE_DELETE: "Mensagem deletada",
  MENTION:        "Menção",
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
