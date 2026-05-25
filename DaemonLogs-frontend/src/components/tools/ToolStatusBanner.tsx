import { Loader2, StopCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCancelTool, useToolsStatus } from "@/hooks/useTools"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"

export function ToolStatusBanner() {
  const { data: status } = useToolsStatus()
  const cancel = useCancelTool()

  if (!status?.active) return null

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync()
      toast.success("Processo cancelado.")
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-warning/20 bg-warning/10 px-6 py-2.5">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-warning" />
      <span className="flex-1 text-sm font-medium text-warning">
        Processo de automação em andamento...
      </span>
      <Button
        size="sm"
        variant="destructive"
        className="gap-1.5 font-bold uppercase tracking-wide"
        onClick={handleCancel}
        disabled={cancel.isPending}
      >
        {cancel.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <StopCircle className="h-3.5 w-3.5" />
        )}
        Parar
      </Button>
    </div>
  )
}
