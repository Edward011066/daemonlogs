import { useState } from "react"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { useAddTarget } from "@/hooks/useTargets"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"

export function AddTargetDialog() {
  const [open, setOpen] = useState(false)
  const [discordId, setDiscordId] = useState("")
  const add = useAddTarget()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = discordId.trim()
    if (!id) return
    try {
      await add.mutateAsync(id)
      toast.success("Alvo adicionado.")
      setDiscordId("")
      setOpen(false)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.error === "PREMIUM_REQUIRED")
          toast.error("Plano premium necessário para adicionar mais alvos.")
        else if (err.error === "TARGET_ALREADY_EXISTS")
          toast.error("Este alvo já está cadastrado.")
        else
          toast.error(err.message)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar alvo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar conta alvo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Discord ID do usuário</Label>
            <Input
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder="123456789012345678"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              ID numérico do perfil Discord. Plano freemium: máximo 3 alvos.
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
