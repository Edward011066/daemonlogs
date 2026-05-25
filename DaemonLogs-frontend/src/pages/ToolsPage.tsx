import { MessageSquareOff, LogOut, Trash2, MessageCircleOff } from "lucide-react"
import { ToolStatusBanner } from "@/components/tools/ToolStatusBanner"
import { ToolCard } from "@/components/tools/ToolCard"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { useCloseDm, useLeaveServer, useDeleteRelationships } from "@/hooks/useTools"
import { useClearChatDms, useClearChatChannel } from "@/hooks/useClearChat"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import { showErrorToast } from "@/lib/error-display"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ToolsPage() {
  const closeDm = useCloseDm()
  const leaveServer = useLeaveServer()
  const deleteRel = useDeleteRelationships()
  const clearDms = useClearChatDms()
  const clearChannel = useClearChatChannel()
  const [channelId, setChannelId] = useState("")

  const run = async (fn: () => Promise<unknown>, successMsg: string) => {
    try {
      await fn()
      toast.success(successMsg)
    } catch (err) {
      if (err instanceof ApiError) showErrorToast(err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Ferramentas</h1>
        <p className="text-sm text-muted-foreground">Automações de limpeza e gestão de conta Discord</p>
      </div>

      <ToolStatusBanner />

      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground">Automações de conta</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <ToolCard
            title="Fechar DMs"
            description="Fecha todas as conversas diretas abertas."
            icon={MessageSquareOff}
            onRun={() => run(() => closeDm.mutateAsync({}), "Processo de fechar DMs iniciado.")}
            isPending={closeDm.isPending}
          />
          <ToolCard
            title="Sair de servidores"
            description="Sai de todos os servidores que você participa."
            icon={LogOut}
            onRun={() => run(() => leaveServer.mutateAsync({}), "Processo de sair de servidores iniciado.")}
            isPending={leaveServer.isPending}
            destructive
          />
          <ToolCard
            title="Remover amizades"
            description="Remove todas as relações (amigos, bloqueados)."
            icon={Trash2}
            onRun={() => run(() => deleteRel.mutateAsync({}), "Processo de remover amizades iniciado.")}
            isPending={deleteRel.isPending}
            destructive
          />
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground">Limpar mensagens</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-surface">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageCircleOff className="h-4 w-4 text-muted-foreground" />
                Limpar DMs
              </CardTitle>
              <CardDescription className="text-xs">
                Remove suas mensagens de todas as DMs abertas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AsyncButton
                variant="default"
                size="sm"
                className="w-full"
                loading={clearDms.isPending}
                onClick={() => run(() => clearDms.mutateAsync({}), "Limpeza de DMs iniciada.")}
              >
                Executar
              </AsyncButton>
            </CardContent>
          </Card>

          <Card className="bg-surface">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageCircleOff className="h-4 w-4 text-muted-foreground" />
                Limpar canal
              </CardTitle>
              <CardDescription className="text-xs">
                Remove suas mensagens de um canal específico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Channel ID</Label>
                <Input
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="123456789012345678"
                  className="h-8 font-mono text-xs"
                />
              </div>
              <AsyncButton
                variant="default"
                size="sm"
                className="w-full"
                loading={clearChannel.isPending}
                disabled={!channelId.trim()}
                onClick={() =>
                  run(() => clearChannel.mutateAsync(channelId.trim()), "Limpeza do canal iniciada.")
                }
              >
                Executar
              </AsyncButton>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
