import { useState } from "react"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { useAddMonitoring } from "@/hooks/useMonitoring"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"

export function AddMonitoringDialog() {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState("")
  const add = useAddMonitoring()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return
    try {
      await add.mutateAsync(token.trim())
      toast.success("Conta de monitoramento adicionada.")
      setToken("")
      setOpen(false)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar conta de monitoramento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Token Discord (selfbot)</Label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token do Discord..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              O token será validado antes de ser salvo.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <AsyncButton type="submit" loading={add.isPending}>
              Adicionar
            </AsyncButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
