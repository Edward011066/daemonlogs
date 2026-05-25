import { useState } from "react"
import { KeyRound, RefreshCw, Trash2, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { StatusDot } from "@/components/shared/StatusDot"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { useMyToken, useAddMyToken, useDeleteMyToken, useRotateMyToken } from "@/hooks/useMyToken"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import { showErrorToast } from "@/lib/error-display"

export function MyTokenPanel() {
  const { data: myToken, isLoading } = useMyToken()
  const addToken = useAddMyToken()
  const deleteToken = useDeleteMyToken()
  const rotateToken = useRotateMyToken()
  const [newToken, setNewToken] = useState("")
  const [mode, setMode] = useState<"idle" | "add" | "rotate">("idle")

  const handleAdd = async () => {
    if (!newToken.trim()) return
    try {
      await addToken.mutateAsync(newToken.trim())
      toast.success("Token adicionado.")
      setNewToken("")
      setMode("idle")
    } catch (err) {
      if (err instanceof ApiError) showErrorToast(err)
    }
  }

  const handleRotate = async () => {
    if (!newToken.trim()) return
    try {
      await rotateToken.mutateAsync(newToken.trim())
      toast.success("Token rotacionado.")
      setNewToken("")
      setMode("idle")
    } catch (err) {
      if (err instanceof ApiError) showErrorToast(err)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteToken.mutateAsync()
      toast.success("Token removido.")
    } catch (err) {
      if (err instanceof ApiError) showErrorToast(err)
    }
  }

  return (
    <Card className="bg-surface">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Meu token Discord
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : myToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {myToken.discord_user.avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${myToken.discord_user.id}/${myToken.discord_user.avatar}.png?size=32`}
                  alt={myToken.discord_user.username}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{myToken.discord_user.username}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <StatusDot active={myToken.is_valid} />
                  {myToken.is_valid ? "Token válido" : "Token inválido"}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => setMode(mode === "rotate" ? "idle" : "rotate")}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Rotacionar
              </Button>
              <AsyncButton
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-destructive hover:text-destructive"
                loading={deleteToken.isPending}
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </AsyncButton>
            </div>

            {mode === "rotate" && (
              <div className="space-y-2">
                <Label className="text-xs">Novo token</Label>
                <Input
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="Novo token Discord..."
                  className="font-mono text-xs"
                />
                <AsyncButton
                  size="sm"
                  className="w-full"
                  loading={rotateToken.isPending}
                  onClick={handleRotate}
                >
                  Confirmar rotação
                </AsyncButton>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Nenhum token cadastrado.</p>
            {mode === "add" ? (
              <div className="space-y-2">
                <Label className="text-xs">Token Discord</Label>
                <Input
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="Token do Discord..."
                  className="font-mono text-xs"
                />
                <AsyncButton
                  size="sm"
                  className="w-full"
                  loading={addToken.isPending}
                  onClick={handleAdd}
                >
                  Adicionar
                </AsyncButton>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="w-full" onClick={() => setMode("add")}>
                Adicionar token
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
