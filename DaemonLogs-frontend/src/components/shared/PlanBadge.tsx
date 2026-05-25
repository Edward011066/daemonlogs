import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Plan } from "@/types"

const PLAN_CLASSES: Record<Plan, string> = {
  freemium: "bg-muted/20 text-muted-foreground border-muted/30",
  premium:  "bg-warning/10 text-warning border-warning/20",
  admin:    "bg-accent/10 text-accent border-accent/20",
}

const PLAN_LABEL: Record<Plan, string> = {
  freemium: "Freemium",
  premium:  "Premium",
  admin:    "Admin",
}

interface PlanBadgeProps {
  plan: Plan
  className?: string
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(PLAN_CLASSES[plan], className)}
    >
      {PLAN_LABEL[plan]}
    </Badge>
  )
}
