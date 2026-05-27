import { useDeferredValue, useState } from "react"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { useAddTarget } from "@/hooks/useTargets"
import { useDiscordUserLookup } from "@/hooks/useDiscordUtils"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"

export function AddTargetDialog() {
  const [open, setOpen] = useState(false)
  const [discordId, setDiscordId] = useState("")
  const add = useAddTarget()
  const deferredDiscordId = useDeferredValue(discordId.trim())
  const lookupId = open && /^[0-9]{17,20}$/.test(deferredDiscordId) ? deferredDiscordId : ""
  const userLookup = useDiscordUserLookup(lookupId)
  const userLookupError = userLookup.error instanceof ApiError ? userLookup.error : null

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

            {!!discordId.trim() && !lookupId && (
              <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
                Use um Discord ID com 17 a 20 dígitos para carregar o preview automaticamente.
              </div>
            )}

            {userLookup.isFetching && (
              <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
                Buscando informações públicas dessa conta...
              </div>
            )}

            {userLookup.data && (
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Preview do alvo
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {userLookup.data.username_global ?? userLookup.data.username}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>@{userLookup.data.username}</span>
                  <span className="font-mono">{userLookup.data.id}</span>
                </div>
              </div>
            )}

            {userLookupError && (
              <div className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
                {userLookupError.status === 503
                  ? "O preview público está indisponível no momento. Você ainda pode adicionar o alvo pelo ID."
                  : userLookupError.message}
              </div>
            )}
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
