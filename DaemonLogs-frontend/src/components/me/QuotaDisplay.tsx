import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2 } from "lucide-react"
import type { ClearChatQuota } from "@/types"
import { cn } from "@/lib/utils"

interface QuotaDisplayProps {
  quota: ClearChatQuota
}

export function QuotaDisplay({ quota }: QuotaDisplayProps) {
  const pct = Math.min(100, (quota.deletions_used / quota.deletions_limit) * 100)
  const isCritical = pct >= 80

  return (
    <Card className="bg-surface">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
          Quota de deleções (24h)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {quota.deletions_used} / {quota.deletions_limit} mensagens
          </span>
          {quota.resets_at && (
            <span>
              Renova às{" "}
              {new Date(quota.resets_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full transition-all", isCritical ? "bg-destructive" : "bg-accent")}
            style={{ width: `${pct}%` }}
          />
        </div>
        {isCritical && (
          <p className="text-xs text-destructive">
            Quota quase esgotada. Aguarde a renovação.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
