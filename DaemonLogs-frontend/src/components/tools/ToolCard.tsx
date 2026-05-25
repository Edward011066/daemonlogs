import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { useToolsStatus } from "@/hooks/useTools"
import type { LucideIcon } from "lucide-react"

interface ToolCardProps {
  title: string
  description: string
  icon: LucideIcon
  onRun: () => void
  isPending: boolean
  destructive?: boolean
}

export function ToolCard({ title, description, icon: Icon, onRun, isPending, destructive }: ToolCardProps) {
  const { data: status } = useToolsStatus()
  const disabled = !!status?.active

  return (
    <Card className="bg-surface">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <AsyncButton
          variant={destructive ? "destructive" : "default"}
          size="sm"
          className="w-full"
          loading={isPending}
          disabled={disabled && !isPending}
          onClick={onRun}
        >
          Executar
        </AsyncButton>
        {disabled && !isPending && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Aguarde o processo atual terminar.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
