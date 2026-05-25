import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Mic,
  MicOff,
  ArrowRightLeft,
  MessageSquare,
  Pencil,
  Trash2,
  AtSign,
  type LucideIcon,
} from "lucide-react"
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

export const EVENT_ICON: Record<EventType, LucideIcon> = {
  VOICE_JOIN:     Mic,
  VOICE_LEAVE:    MicOff,
  VOICE_SWITCH:   ArrowRightLeft,
  MESSAGE_SENT:   MessageSquare,
  MESSAGE_EDIT:   Pencil,
  MESSAGE_DELETE: Trash2,
  MENTION:        AtSign,
}

export const EVENT_DOT_CLASSES: Record<EventType, string> = {
  VOICE_JOIN:     "bg-info/20 text-info",
  VOICE_LEAVE:    "bg-info/20 text-info",
  VOICE_SWITCH:   "bg-info/20 text-info",
  MESSAGE_SENT:   "bg-success/20 text-success",
  MESSAGE_EDIT:   "bg-warning/20 text-warning",
  MESSAGE_DELETE: "bg-destructive/20 text-destructive",
  MENTION:        "bg-accent/20 text-accent",
}

interface EventBadgeProps {
  type: EventType
  className?: string
  showIcon?: boolean
}

export function EventBadge({ type, className, showIcon = false }: EventBadgeProps) {
  const Icon = EVENT_ICON[type]
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", EVENT_CLASSES[type], className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {EVENT_LABEL[type]}
    </Badge>
  )
}
