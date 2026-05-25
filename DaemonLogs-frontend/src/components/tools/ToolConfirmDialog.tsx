import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AsyncButton } from "@/components/shared/AsyncButton"
import type { ReactNode } from "react"

interface ToolConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  warningText?: string
  confirmLabel?: string
  destructive?: boolean
  disabled?: boolean
  isPending: boolean
  onConfirm: () => void
  children?: ReactNode
}

export function ToolConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  warningText,
  confirmLabel = "Executar",
  destructive,
  disabled,
  isPending,
  onConfirm,
  children,
}: ToolConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isPending) onOpenChange(next) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {warningText && (
            <div className="flex gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{warningText}</p>
            </div>
          )}

          {children}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <AsyncButton
            variant={destructive ? "destructive" : "default"}
            size="sm"
            loading={isPending}
            disabled={disabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
