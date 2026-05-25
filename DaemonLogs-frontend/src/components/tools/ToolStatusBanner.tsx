import { Loader2, X } from "lucide-react"
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
    <div className="flex items-center gap-3 rounded-md border border-warning/20 bg-warning/5 px-4 py-2.5 text-sm text-warning">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      <span className="flex-1">Processo de automação em andamento...</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-warning hover:text-warning/80"
        onClick={handleCancel}
        disabled={cancel.isPending}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
