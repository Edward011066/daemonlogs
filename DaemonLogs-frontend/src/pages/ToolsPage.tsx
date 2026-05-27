import { useDeferredValue, useEffect, useState } from "react"
import {
  Copy,
  Inbox,
  KeyRound,
  LogOut,
  MessageCircleOff,
  MessageSquareOff,
  Server,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { CopyButton } from "@/components/shared/CopyButton"
import { ToolCard } from "@/components/tools/ToolCard"
import { ToolConfirmDialog } from "@/components/tools/ToolConfirmDialog"
import { DiscordTokenResult } from "@/components/tools/DiscordTokenResult"
import { useMyToken } from "@/hooks/useMyToken"
import { useGuildChannels } from "@/hooks/useDiscordUtils"
import {
  useCloseDm,
  useDeleteRelationships,
  useLeaveServer,
  useListDmChannels,
  useValidateDiscordToken,
} from "@/hooks/useTools"
import { useClearChatDms, useClearChatChannel, useClearChatServer } from "@/hooks/useClearChat"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import { showErrorToast } from "@/lib/error-display"
import type { DiscordUserInfo, OpenDmChannel } from "@/types"

const parseIds = (raw: string): string[] =>
  raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)

const textareaClass =
  "min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

type ModalStep = "form" | "confirm"

type DiscordAccountPreview = NonNullable<DiscordUserInfo["user"]>
type DiscordFriend = DiscordAccountPreview["friends"][number]
type DiscordGuild = DiscordAccountPreview["guilds"][number]

interface PreviewItem {
  id: string
  primary: string
  secondary?: string | null
}

interface PreviewListProps {
  items: PreviewItem[]
  emptyMessage: string
  selectedIds?: string[]
  onToggle?: (id: string) => void
  heightClassName?: string
}

function getDmName(channel: OpenDmChannel) {
  return channel.recipient_global_name ?? channel.recipient_username ?? "DM sem nome"
}

function toDmPreviewItem(channel: OpenDmChannel): PreviewItem {
  const secondaryParts = []

  if (channel.recipient_username && channel.recipient_global_name && channel.recipient_global_name !== channel.recipient_username) {
    secondaryParts.push(`@${channel.recipient_username}`)
  }

  if (channel.recipient_id) {
    secondaryParts.push(`User ID ${channel.recipient_id}`)
  }

  return {
    id: channel.id,
    primary: getDmName(channel),
    secondary: secondaryParts.join(" • ") || null,
  }
}

function toFriendPreviewItem(friend: DiscordFriend): PreviewItem {
  return {
    id: friend.id,
    primary: friend.global_name ?? friend.username,
    secondary: friend.global_name && friend.global_name !== friend.username ? `@${friend.username}` : null,
  }
}

function toGuildPreviewItem(guild: DiscordGuild): PreviewItem {
  return {
    id: guild.id,
    primary: guild.name,
    secondary: null,
  }
}

function summarizePreviewItems(items: PreviewItem[]) {
  if (!items.length) return "nenhum contato"
  if (items.length === 1) return items[0].primary
  if (items.length === 2) return `${items[0].primary} e ${items[1].primary}`

  return `${items[0].primary}, ${items[1].primary}, ${items[2].primary} e mais ${items.length - 3}`
}

function PreviewList({
  items,
  emptyMessage,
  selectedIds,
  onToggle,
  heightClassName = "h-48",
}: PreviewListProps) {
  if (!items.length) {
    return (
      <div className="rounded-md border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <ScrollArea className={`${heightClassName} rounded-md border border-border bg-surface-2`}>
      <div className="space-y-1 p-2">
        {items.map((item) => {
          const checked = selectedIds?.includes(item.id) ?? false
          const content = (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{item.primary}</p>
                {item.secondary && (
                  <p className="truncate text-[11px] text-muted-foreground">{item.secondary}</p>
                )}
              </div>
              <span className="pl-2 text-right font-mono text-[10px] text-muted-foreground">
                {item.id}
              </span>
            </>
          )

          if (onToggle) {
            return (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-background/70"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                  className="h-3.5 w-3.5 accent-accent"
                />
                {content}
              </label>
            )
          }

          return (
            <div key={item.id} className="flex items-center gap-2 rounded-md px-2 py-1.5">
              {content}
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

export function ToolsPage() {
  const closeDm = useCloseDm()
  const leaveServer = useLeaveServer()
  const deleteRel = useDeleteRelationships()
  const listDms = useListDmChannels()
  const dmChannelLookup = useListDmChannels()
  const validateDiscordToken = useValidateDiscordToken()
  const accountPreview = useValidateDiscordToken()
  const clearDms = useClearChatDms()
  const clearChannel = useClearChatChannel()
  const clearServer = useClearChatServer()
  const { data: myToken } = useMyToken()

  // ── Fechar DMs ──
  const [closeDmOpen, setCloseDmOpen] = useState(false)
  const [closeDmIgnored, setCloseDmIgnored] = useState("")

  // ── Sair de servidores ──
  const [leaveServerOpen, setLeaveServerOpen] = useState(false)
  const [leaveServerIgnored, setLeaveServerIgnored] = useState("")
  const [leaveServerStep, setLeaveServerStep] = useState<ModalStep>("form")

  // ── Remover amizades ──
  const [deleteRelOpen, setDeleteRelOpen] = useState(false)
  const [deleteRelIgnored, setDeleteRelIgnored] = useState("")
  const [deleteRelStep, setDeleteRelStep] = useState<ModalStep>("form")

  // ── Listar DMs abertas ──
  const [listDmsIncludeChannel, setListDmsIncludeChannel] = useState(false)
  const [listDmsResultOpen, setListDmsResultOpen] = useState(false)

  // ── Limpar DMs ──
  const [clearDmsOpen, setClearDmsOpen] = useState(false)
  const [clearDmsStep, setClearDmsStep] = useState<ModalStep>("form")
  const [clearDmsIgnoredIds, setClearDmsIgnoredIds] = useState<string[]>([])

  // ── Limpar canal ──
  const [clearChannelOpen, setClearChannelOpen] = useState(false)
  const [clearChannelId, setClearChannelId] = useState("")
  const [clearChannelStep, setClearChannelStep] = useState<ModalStep>("form")

  // ── Limpar servidor ──
  const [clearServerOpen, setClearServerOpen] = useState(false)
  const [clearServerGuildId, setClearServerGuildId] = useState("")
  const [clearServerIgnored, setClearServerIgnored] = useState("")
  const deferredClearServerGuildId = useDeferredValue(clearServerGuildId.trim())
  const clearServerLookupId =
    clearServerOpen && /^[0-9]{17,20}$/.test(deferredClearServerGuildId)
      ? deferredClearServerGuildId
      : ""
  const guildChannels = useGuildChannels(clearServerLookupId)
  const guildChannelsError = guildChannels.error instanceof ApiError ? guildChannels.error : null
  const dmChannelLookupError = dmChannelLookup.error instanceof ApiError ? dmChannelLookup.error : null
  const accountPreviewError = accountPreview.error instanceof ApiError ? accountPreview.error : null
  const ignoredGuildIds = parseIds(leaveServerIgnored)
  const ignoredUserIds = parseIds(deleteRelIgnored)
  const previewDmChannels = dmChannelLookup.data?.channels ?? []
  const clearDmsTargetItems = previewDmChannels
    .filter((channel) => !clearDmsIgnoredIds.includes(channel.id))
    .map(toDmPreviewItem)
  const clearChannelTarget = previewDmChannels.find((channel) => channel.id === clearChannelId.trim())
  const accountPreviewUser = accountPreview.data?.user ?? null
  const leaveServerTargetItems = (accountPreviewUser?.guilds ?? [])
    .filter((guild) => !ignoredGuildIds.includes(guild.id))
    .map(toGuildPreviewItem)
  const deleteRelationshipTargetItems = (accountPreviewUser?.friends ?? [])
    .filter((friend) => !ignoredUserIds.includes(friend.id))
    .map(toFriendPreviewItem)

  // ── Validar token Discord ──
  const [discordTokenInput, setDiscordTokenInput] = useState("")

  useEffect(() => {
    if (!(clearDmsOpen || clearChannelOpen)) return
    if (dmChannelLookup.data || dmChannelLookup.isPending) return

    void dmChannelLookup.mutateAsync().catch(() => {})
  }, [clearDmsOpen, clearChannelOpen, dmChannelLookup.data, dmChannelLookup.isPending, dmChannelLookup.mutateAsync])

  useEffect(() => {
    if (!(leaveServerOpen || deleteRelOpen)) return
    if (!myToken?.token || accountPreview.data || accountPreview.isPending) return

    void accountPreview.mutateAsync(myToken.token).catch(() => {})
  }, [leaveServerOpen, deleteRelOpen, myToken?.token, accountPreview.data, accountPreview.isPending, accountPreview.mutateAsync])

  const handleListDms = async () => {
    try {
      await listDms.mutateAsync()
      setListDmsResultOpen(true)
    } catch (err) {
      if (err instanceof ApiError) showErrorToast(err)
    }
  }

  const handleLeaveServerOpenChange = (next: boolean) => {
    setLeaveServerOpen(next)
    if (!next) setLeaveServerStep("form")
  }

  const handleDeleteRelOpenChange = (next: boolean) => {
    setDeleteRelOpen(next)
    if (!next) setDeleteRelStep("form")
  }

  const handleClearDmsOpenChange = (next: boolean) => {
    setClearDmsOpen(next)
    if (!next) {
      setClearDmsStep("form")
      setClearDmsIgnoredIds([])
    }
  }

  const handleClearChannelOpenChange = (next: boolean) => {
    setClearChannelOpen(next)
    if (!next) setClearChannelStep("form")
  }

  const toggleClearDmIgnored = (channelId: string) => {
    setClearDmsIgnoredIds((current) =>
      current.includes(channelId)
        ? current.filter((id) => id !== channelId)
        : [...current, channelId],
    )
  }

  const handleLeaveServerConfirm = () => {
    if (leaveServerStep === "form") {
      if (accountPreviewUser && leaveServerTargetItems.length === 0) {
        toast.error("Nenhum servidor restante para sair.")
        return
      }

      setLeaveServerStep("confirm")
      return
    }

    void run(
      () => leaveServer.mutateAsync({ ignored_guild_ids: ignoredGuildIds }),
      "Processo de sair de servidores iniciado.",
      () => {
        setLeaveServerOpen(false)
        setLeaveServerIgnored("")
        setLeaveServerStep("form")
      },
    )
  }

  const handleDeleteRelationshipsConfirm = () => {
    if (deleteRelStep === "form") {
      if (accountPreviewUser && deleteRelationshipTargetItems.length === 0) {
        toast.error("Nenhum usuário restante para remover.")
        return
      }

      setDeleteRelStep("confirm")
      return
    }

    void run(
      () => deleteRel.mutateAsync({ ignored_user_ids: ignoredUserIds }),
      "Processo de remover amizades iniciado.",
      () => {
        setDeleteRelOpen(false)
        setDeleteRelIgnored("")
        setDeleteRelStep("form")
      },
    )
  }

  const handleClearDmsConfirm = () => {
    if (clearDmsStep === "form") {
      if (!previewDmChannels.length) {
        toast.error("Nenhuma DM aberta foi encontrada para limpar.")
        return
      }

      if (clearDmsTargetItems.length === 0) {
        toast.error("Selecione ao menos uma DM para limpar.")
        return
      }

      setClearDmsStep("confirm")
      return
    }

    void run(
      () => clearDms.mutateAsync({ ignored_channel_ids: clearDmsIgnoredIds }),
      "Limpeza de DMs iniciada.",
      () => {
        setClearDmsOpen(false)
        setClearDmsStep("form")
        setClearDmsIgnoredIds([])
      },
    )
  }

  const handleClearChannelConfirm = () => {
    if (clearChannelStep === "form") {
      setClearChannelStep("confirm")
      return
    }

    void run(
      () => clearChannel.mutateAsync(clearChannelId.trim()),
      "Limpeza do canal iniciada.",
      () => {
        setClearChannelOpen(false)
        setClearChannelId("")
        setClearChannelStep("form")
      },
    )
  }

  const run = async (
    fn: () => Promise<unknown>,
    successMsg: string,
    onSuccess: () => void,
  ) => {
    try {
      await fn()
      toast.success(successMsg)
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError) showErrorToast(err)
    }
  }

  const toggleIgnoredChannel = (channelId: string) => {
    const next = new Set(parseIds(clearServerIgnored))

    if (next.has(channelId)) {
      next.delete(channelId)
    } else {
      next.add(channelId)
    }

    setClearServerIgnored(Array.from(next).join("\n"))
  }

  const handleValidateDiscordToken = async () => {
    if (!discordTokenInput.trim()) {
      toast.error("Informe um token Discord para validar.")
      return
    }

    try {
      const result = await validateDiscordToken.mutateAsync(discordTokenInput.trim())
      if (result.valid) {
        toast.success("Token válido. Dados do usuário carregados.")
      } else {
        toast.error("O token informado não é válido.")
      }
    } catch (err) {
      if (err instanceof ApiError) showErrorToast(err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Ferramentas</h1>
        <p className="text-sm text-muted-foreground">
          Automações de limpeza e gestão de conta Discord
        </p>
      </div>

      {/* ── Automações de conta ── */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground">Automações de conta</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ToolCard
            title="Fechar DMs"
            description="Fecha todas as conversas diretas abertas. Você pode ignorar DMs específicas."
            icon={MessageSquareOff}
            isPending={false}
            onRun={() => setCloseDmOpen(true)}
          />

          <ToolCard
            title="Sair de servidores"
            description="Sai de todos os servidores que você participa. Você pode ignorar servidores específicos."
            icon={LogOut}
            destructive
            isPending={false}
            onRun={() => setLeaveServerOpen(true)}
          />

          <ToolCard
            title="Remover amizades"
            description="Remove todas as relações (amigos, bloqueados). Você pode ignorar usuários específicos."
            icon={Trash2}
            destructive
            isPending={false}
            onRun={() => setDeleteRelOpen(true)}
          />

          <ToolCard
            title="Listar DMs abertas"
            description="Consulta as conversas diretas abertas usando o token configurado."
            icon={Inbox}
            actionLabel="Listar DMs"
            isPending={listDms.isPending}
            onRun={handleListDms}
          >
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={listDmsIncludeChannel}
                  onChange={(e) => setListDmsIncludeChannel(e.target.checked)}
                  className="h-3.5 w-3.5 accent-accent"
                />
                <span className="text-xs text-muted-foreground">Incluir ID do canal</span>
              </label>
          </ToolCard>
        </div>
      </div>

      <Separator />

      {/* ── Limpar mensagens ── */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground">Limpar mensagens</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <ToolCard
            title="Limpar DMs"
            description="Apaga suas mensagens de todas as DMs abertas. Você pode ignorar DMs específicas."
            icon={MessageCircleOff}
            isPending={false}
            onRun={() => setClearDmsOpen(true)}
          />

          <ToolCard
            title="Limpar canal"
            description="Apaga suas mensagens de um canal específico pelo ID."
            icon={MessageCircleOff}
            isPending={false}
            onRun={() => setClearChannelOpen(true)}
          />

          <ToolCard
            title="Limpar servidor"
            description="Apaga suas mensagens em todos os canais de um servidor. Você pode ignorar canais específicos."
            icon={Server}
            isPending={false}
            onRun={() => setClearServerOpen(true)}
          />
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground">Utilitários</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Validar token Discord</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Consulta o endpoint utilitário da API e mostra um resumo completo da conta
                associada ao token informado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Token Discord</Label>
                <Input
                  type="password"
                  value={discordTokenInput}
                  onChange={(e) => setDiscordTokenInput(e.target.value)}
                  placeholder="Cole aqui o token para validar"
                  className="font-mono text-xs"
                />
              </div>

              <AsyncButton
                className="w-full"
                loading={validateDiscordToken.isPending}
                onClick={handleValidateDiscordToken}
              >
                Validar token
              </AsyncButton>

              {validateDiscordToken.data && (
                <DiscordTokenResult data={validateDiscordToken.data} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ════════════════ Dialogs ════════════════ */}

      {/* Listar DMs abertas — resultados */}
      <Dialog open={listDmsResultOpen} onOpenChange={setListDmsResultOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Inbox className="h-4 w-4" />
              DMs abertas
              {listDms.data && (
                <Badge variant="outline" className="ml-1 text-[11px]">
                  {listDms.data.channels.length}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {listDms.data && listDms.data.channels.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma DM aberta encontrada.
            </p>
          )}

          {listDms.data && listDms.data.channels.length > 0 && (
            <>
              {/* Cópia em massa */}
              <div className="flex gap-2 border-b border-border pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => {
                    const ids = listDms.data!.channels
                      .map((ch) => ch.recipient_id)
                      .filter(Boolean)
                      .join(", ")
                    navigator.clipboard.writeText(ids)
                    toast.success("IDs de usuários copiados!")
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar User IDs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => {
                    const ids = listDms.data!.channels.map((ch) => ch.id).join(", ")
                    navigator.clipboard.writeText(ids)
                    toast.success("IDs de canais copiados!")
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar Canal IDs
                </Button>
              </div>

              <ScrollArea className="h-[60vh]">
              <div className="space-y-1.5 pr-3">
                {listDms.data.channels.map((ch) => (
                  <div
                    key={ch.id}
                    className="rounded-md border border-border bg-surface px-3 py-2"
                  >
                    {/* Recipient info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {(ch.recipient_global_name ?? ch.recipient_username) && (
                          <p className="truncate text-xs font-medium text-foreground">
                            {ch.recipient_global_name ?? ch.recipient_username}
                          </p>
                        )}
                        {ch.recipient_username && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            @{ch.recipient_username}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* IDs */}
                    <div className="mt-1.5 space-y-1">
                      {ch.recipient_id && (
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                            User ID
                          </span>
                          <div className="flex items-center gap-0.5">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {ch.recipient_id}
                            </span>
                            <CopyButton value={ch.recipient_id} />
                          </div>
                        </div>
                      )}
                      {listDmsIncludeChannel && (
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                            Canal ID
                          </span>
                          <div className="flex items-center gap-0.5">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {ch.id}
                            </span>
                            <CopyButton value={ch.id} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Fechar DMs */}
      <ToolConfirmDialog
        open={closeDmOpen}
        onOpenChange={setCloseDmOpen}
        title="Fechar todas as DMs"
        description="Esta ação irá fechar todas as conversas diretas abertas na sua conta Discord. O processo roda em background e pode levar alguns minutos."
        warningText="As mensagens não são deletadas, mas os canais de DM serão fechados. Você pode ignorar DMs específicas preenchendo os IDs abaixo."
        isPending={closeDm.isPending}
        onConfirm={() =>
          run(
            () => closeDm.mutateAsync({ ignored_channel_ids: parseIds(closeDmIgnored) }),
            "Processo de fechar DMs iniciado.",
            () => { setCloseDmOpen(false); setCloseDmIgnored("") },
          )
        }
      >
        <div className="space-y-1.5">
          <Label className="text-xs">IDs de DMs a ignorar (opcional)</Label>
          <p className="text-xs text-muted-foreground">Um ID por linha ou separados por vírgula.</p>
          <textarea
            className={textareaClass}
            placeholder={"123456789012345678\n987654321098765432"}
            value={closeDmIgnored}
            onChange={(e) => setCloseDmIgnored(e.target.value)}
          />
        </div>
      </ToolConfirmDialog>

      {/* Sair de servidores */}
      <ToolConfirmDialog
        open={leaveServerOpen}
        onOpenChange={handleLeaveServerOpenChange}
        title="Sair de todos os servidores"
        description={leaveServerStep === "form"
          ? "Esta ação irá sair de todos os servidores Discord que você participa. O processo roda em background e pode levar alguns minutos."
          : "Você sairá dos servidores abaixo. Tem certeza?"
        }
        warningText={leaveServerStep === "form"
          ? "Ação irreversível. Para entrar novamente em um servidor você precisará de um convite. Você pode ignorar servidores específicos preenchendo os IDs abaixo."
          : undefined
        }
        destructive
        isPending={leaveServer.isPending}
        confirmLabel={leaveServerStep === "form" ? "Continuar" : "Confirmar saída"}
        disabled={leaveServerStep === "confirm" && !!accountPreviewUser && leaveServerTargetItems.length === 0}
        onConfirm={handleLeaveServerConfirm}
        contentClassName="sm:max-w-lg"
      >
        {leaveServerStep === "form" ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">IDs de servidores a ignorar (opcional)</Label>
              <p className="text-xs text-muted-foreground">Um ID por linha ou separados por vírgula.</p>
              <textarea
                className={textareaClass}
                placeholder={"123456789012345678\n987654321098765432"}
                value={leaveServerIgnored}
                onChange={(e) => setLeaveServerIgnored(e.target.value)}
              />
            </div>

            {accountPreview.isPending && (
              <div className="rounded-md border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
                Carregando seus servidores para montar a confirmação...
              </div>
            )}

            {accountPreviewError && (
              <div className="rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
                {accountPreviewError.message}
              </div>
            )}
          </div>
        ) : accountPreviewUser ? (
          <PreviewList
            items={leaveServerTargetItems}
            emptyMessage="Nenhum servidor restante para sair com os filtros atuais."
            heightClassName="h-56"
          />
        ) : (
          <div className="rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
            Não foi possível carregar a lista de servidores agora. A ação seguirá usando apenas os IDs ignorados informados.
          </div>
        )}
      </ToolConfirmDialog>

      {/* Remover amizades */}
      <ToolConfirmDialog
        open={deleteRelOpen}
        onOpenChange={handleDeleteRelOpenChange}
        title="Remover todas as amizades"
        description={deleteRelStep === "form"
          ? "Esta ação irá remover todos os amigos e desfazer todos os bloqueios na sua conta Discord. O processo roda em background e pode levar alguns minutos."
          : "Os usuários abaixo terão a amizade removida. Tem certeza?"
        }
        warningText={deleteRelStep === "form"
          ? "Ação irreversível. Você perderá todos os amigos e precisará adicioná-los novamente. Você pode ignorar usuários específicos preenchendo os IDs abaixo."
          : undefined
        }
        destructive
        isPending={deleteRel.isPending}
        confirmLabel={deleteRelStep === "form" ? "Continuar" : "Confirmar remoção"}
        disabled={deleteRelStep === "confirm" && !!accountPreviewUser && deleteRelationshipTargetItems.length === 0}
        onConfirm={handleDeleteRelationshipsConfirm}
        contentClassName="sm:max-w-lg"
      >
        {deleteRelStep === "form" ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">IDs de usuários a ignorar (opcional)</Label>
              <p className="text-xs text-muted-foreground">Um ID por linha ou separados por vírgula.</p>
              <textarea
                className={textareaClass}
                placeholder={"123456789012345678\n987654321098765432"}
                value={deleteRelIgnored}
                onChange={(e) => setDeleteRelIgnored(e.target.value)}
              />
            </div>

            {accountPreview.isPending && (
              <div className="rounded-md border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
                Carregando seus contatos para montar a confirmação...
              </div>
            )}

            {accountPreviewError && (
              <div className="rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
                {accountPreviewError.message}
              </div>
            )}
          </div>
        ) : accountPreviewUser ? (
          <PreviewList
            items={deleteRelationshipTargetItems}
            emptyMessage="Nenhum usuário restante para remover com os filtros atuais."
            heightClassName="h-56"
          />
        ) : (
          <div className="rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
            Não foi possível carregar a lista de usuários agora. A ação seguirá usando apenas os IDs ignorados informados.
          </div>
        )}
      </ToolConfirmDialog>

      {/* Limpar DMs */}
      <ToolConfirmDialog
        open={clearDmsOpen}
        onOpenChange={handleClearDmsOpenChange}
        title="Limpar mensagens de todos os DMs"
        description={clearDmsStep === "form"
          ? "Esta ação irá apagar suas mensagens de todos os canais de DM abertos. O processo roda em background."
          : `Todas as suas mensagens com ${summarizePreviewItems(clearDmsTargetItems)} serão excluídas. Tem certeza?`
        }
        warningText={clearDmsStep === "form" ? (
          <p>
            As mensagens apagadas não podem ser recuperadas. Marque abaixo as DMs que você não quer limpar. <strong>Prefira deixar apenas as DM que deseja limpar abertas e inicie a limpeza sem usar opção de ignorar dms.</strong>
          </p>
        ) : undefined}
        isPending={clearDms.isPending}
        confirmLabel={clearDmsStep === "form" ? "Continuar" : "Confirmar limpeza"}
        disabled={clearDmsStep === "form" ? dmChannelLookup.isPending || !previewDmChannels.length : clearDmsTargetItems.length === 0}
        onConfirm={handleClearDmsConfirm}
        contentClassName="sm:max-w-lg"
      >
        {clearDmsStep === "form" ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">DMs abertas</Label>
              <p className="text-xs text-muted-foreground">
                Marque as DMs que você não quer limpar.
              </p>
            </div>

            {dmChannelLookup.isPending ? (
              <div className="rounded-md border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
                Carregando DMs abertas...
              </div>
            ) : dmChannelLookupError ? (
              <div className="rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
                {dmChannelLookupError.message}
              </div>
            ) : (
              <PreviewList
                items={previewDmChannels.map(toDmPreviewItem)}
                selectedIds={clearDmsIgnoredIds}
                onToggle={toggleClearDmIgnored}
                emptyMessage="Nenhuma DM aberta encontrada."
                heightClassName="h-56"
              />
            )}
          </div>
        ) : (
          <PreviewList
            items={clearDmsTargetItems}
            emptyMessage="Nenhuma DM restante para limpar com os filtros atuais."
            heightClassName="h-56"
          />
        )}
      </ToolConfirmDialog>

      {/* Limpar canal */}
      <ToolConfirmDialog
        open={clearChannelOpen}
        onOpenChange={handleClearChannelOpenChange}
        title="Limpar mensagens de um canal"
        description={clearChannelStep === "form"
          ? "Esta ação irá apagar suas mensagens de um canal específico. Informe o ID do canal abaixo."
          : clearChannelTarget
            ? `Todas as suas mensagens com o usuário ${getDmName(clearChannelTarget)} serão excluídas. Tem certeza?`
            : `Todas as suas mensagens do canal ${clearChannelId.trim()} serão excluídas. Tem certeza?`
        }
        warningText={clearChannelStep === "form" ? "As mensagens apagadas não podem ser recuperadas." : undefined}
        isPending={clearChannel.isPending}
        disabled={!clearChannelId.trim()}
        confirmLabel={clearChannelStep === "form" ? "Continuar" : "Limpar canal"}
        onConfirm={handleClearChannelConfirm}
      >
        {clearChannelStep === "form" ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Channel ID <span className="text-destructive">*</span>
              </Label>
              <Input
                value={clearChannelId}
                onChange={(e) => setClearChannelId(e.target.value)}
                placeholder="123456789012345678"
                className="h-8 font-mono text-xs"
              />
            </div>

            <div className="rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
              Atenção, não forneça o id do usuário, deve ser o ID do canal.
            </div>
          </div>
        ) : clearChannelTarget ? (
          <PreviewList
            items={[toDmPreviewItem(clearChannelTarget)]}
            emptyMessage="Canal não encontrado."
            heightClassName="h-auto"
          />
        ) : (
          <div className="rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
            Não foi possível identificar um usuário para este canal. O processo usará apenas o Channel ID informado.
          </div>
        )}
      </ToolConfirmDialog>

      {/* Limpar servidor */}
      <ToolConfirmDialog
        open={clearServerOpen}
        onOpenChange={setClearServerOpen}
        title="Limpar mensagens de um servidor"
        description="Esta ação irá apagar suas mensagens em todos os canais de texto de um servidor. Informe o ID do servidor abaixo."
        warningText="As mensagens apagadas não podem ser recuperadas. A operação percorre todos os canais de texto do servidor. Você pode ignorar canais específicos preenchendo os IDs abaixo."
        isPending={clearServer.isPending}
        disabled={!clearServerGuildId.trim()}
        confirmLabel="Limpar servidor"
        onConfirm={() =>
          run(
            () =>
              clearServer.mutateAsync({
                guild_id: clearServerGuildId.trim(),
                ignored_channel_ids: parseIds(clearServerIgnored),
              }),
            "Limpeza do servidor iniciada.",
            () => {
              setClearServerOpen(false)
              setClearServerGuildId("")
              setClearServerIgnored("")
            },
          )
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">
              ID do servidor <span className="text-destructive">*</span>
            </Label>
            <Input
              value={clearServerGuildId}
              onChange={(e) => setClearServerGuildId(e.target.value)}
              placeholder="123456789012345678"
              className="h-8 font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Ao informar um ID do servidor válido, carregamos os canais para facilitar a seleção dos ignorados.
            </p>
          </div>

          {clearServerLookupId && guildChannels.isFetching && (
            <div className="rounded-md border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
              Carregando canais do servidor...
            </div>
          )}

          {guildChannels.data && (
            <div className="space-y-2 rounded-md border border-border bg-surface p-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Canais de {guildChannels.data.guild_name}</p>
                <p className="text-xs text-muted-foreground">
                  Marque os canais que devem ser ignorados durante a limpeza.
                </p>
              </div>

              <ScrollArea className="h-40 rounded-md border border-border bg-surface-2">
                <div className="space-y-1 p-2">
                  {guildChannels.data.channels.map((channel) => {
                    const checked = parseIds(clearServerIgnored).includes(channel.id)

                    return (
                      <label
                        key={channel.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-background/70"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleIgnoredChannel(channel.id)}
                          className="h-3.5 w-3.5 accent-accent"
                        />
                        <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                          {channel.name}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {channel.id}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {guildChannelsError && (
            <div className="rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
              {guildChannelsError.message}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">IDs de canais a ignorar (opcional)</Label>
            <p className="text-xs text-muted-foreground">Um ID por linha ou separados por vírgula.</p>
            <textarea
              className={textareaClass}
              placeholder={"123456789012345678\n987654321098765432"}
              value={clearServerIgnored}
              onChange={(e) => setClearServerIgnored(e.target.value)}
            />
          </div>
        </div>
      </ToolConfirmDialog>
    </div>
  )
}
