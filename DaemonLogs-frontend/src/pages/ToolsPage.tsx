import { useState } from "react"
import {
  KeyRound,
  LogOut,
  Mail,
  MessageCircleOff,
  MessageSquareOff,
  Phone,
  Server,
  ShieldCheck,
  Trash2,
  User,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { ToolConfirmDialog } from "@/components/tools/ToolConfirmDialog"
import {
  useCloseDm,
  useDeleteRelationships,
  useLeaveServer,
  useValidateDiscordToken,
} from "@/hooks/useTools"
import { useClearChatDms, useClearChatChannel, useClearChatServer } from "@/hooks/useClearChat"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import { showErrorToast } from "@/lib/error-display"

const parseIds = (raw: string): string[] =>
  raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)

const textareaClass =
  "min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

export function ToolsPage() {
  const closeDm = useCloseDm()
  const leaveServer = useLeaveServer()
  const deleteRel = useDeleteRelationships()
  const validateDiscordToken = useValidateDiscordToken()
  const clearDms = useClearChatDms()
  const clearChannel = useClearChatChannel()
  const clearServer = useClearChatServer()

  // ── Fechar DMs ──
  const [closeDmOpen, setCloseDmOpen] = useState(false)
  const [closeDmIgnored, setCloseDmIgnored] = useState("")

  // ── Sair de servidores ──
  const [leaveServerOpen, setLeaveServerOpen] = useState(false)
  const [leaveServerIgnored, setLeaveServerIgnored] = useState("")

  // ── Remover amizades ──
  const [deleteRelOpen, setDeleteRelOpen] = useState(false)
  const [deleteRelIgnored, setDeleteRelIgnored] = useState("")

  // ── Limpar DMs ──
  const [clearDmsOpen, setClearDmsOpen] = useState(false)
  const [clearDmsIgnored, setClearDmsIgnored] = useState("")

  // ── Limpar canal ──
  const [clearChannelOpen, setClearChannelOpen] = useState(false)
  const [clearChannelId, setClearChannelId] = useState("")

  // ── Limpar servidor ──
  const [clearServerOpen, setClearServerOpen] = useState(false)
  const [clearServerGuildId, setClearServerGuildId] = useState("")
  const [clearServerIgnored, setClearServerIgnored] = useState("")

  // ── Validar token Discord ──
  const [discordTokenInput, setDiscordTokenInput] = useState("")

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

  const validatedUser = validateDiscordToken.data?.user

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
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <MessageSquareOff className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Fechar DMs</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Fecha todas as conversas diretas abertas. Você pode ignorar DMs específicas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => setCloseDmOpen(true)}>
                Executar
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Sair de servidores</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Sai de todos os servidores que você participa. Você pode ignorar servidores
                específicos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={() => setLeaveServerOpen(true)}
              >
                Executar
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Remover amizades</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Remove todas as relações (amigos, bloqueados). Você pode ignorar usuários
                específicos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={() => setDeleteRelOpen(true)}
              >
                Executar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* ── Limpar mensagens ── */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground">Limpar mensagens</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <MessageCircleOff className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Limpar DMs</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Apaga suas mensagens de todas as DMs abertas. Você pode ignorar DMs específicas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => setClearDmsOpen(true)}>
                Executar
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <MessageCircleOff className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Limpar canal</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Apaga suas mensagens de um canal específico pelo ID.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => setClearChannelOpen(true)}>
                Executar
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Limpar servidor</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Apaga suas mensagens em todos os canais de um servidor. Você pode ignorar canais
                específicos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => setClearServerOpen(true)}>
                Executar
              </Button>
            </CardContent>
          </Card>
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
                <div className="space-y-4 rounded-xl border border-border bg-background/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={validateDiscordToken.data.valid
                        ? "border-success/20 bg-success/10 text-success"
                        : "border-destructive/20 bg-destructive/10 text-destructive"
                      }
                    >
                      {validateDiscordToken.data.valid ? "Token válido" : "Token inválido"}
                    </Badge>

                    {validatedUser?.mfa_enabled && (
                      <Badge variant="outline" className="border-accent/20 bg-accent/10 text-accent">
                        MFA ativo
                      </Badge>
                    )}
                  </div>

                  {validatedUser ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-border bg-surface-2 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {validatedUser.global_name ?? validatedUser.username}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          @{validatedUser.username}
                          {validatedUser.discriminator ? `#${validatedUser.discriminator}` : ""}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {validatedUser.id}
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border border-border bg-surface-2 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Servidores</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">{validatedUser.guild_count}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface-2 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Amigos</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">{validatedUser.friend_count}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface-2 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">E-mail</p>
                          <p className="mt-1 truncate text-sm text-foreground">{validatedUser.email ?? "-"}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface-2 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Telefone</p>
                          <p className="mt-1 text-sm text-foreground">{validatedUser.phone ?? "-"}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="rounded-lg border border-border bg-surface-2 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
                            <Server className="h-3.5 w-3.5 text-muted-foreground" />
                            Servidores detectados
                          </div>
                          {validatedUser.guilds.length ? (
                            <ul className="space-y-1.5 text-xs text-muted-foreground">
                              {validatedUser.guilds.slice(0, 5).map((guild) => (
                                <li key={guild.id} className="flex items-center justify-between gap-2 rounded-md bg-background/70 px-2 py-1.5">
                                  <span className="truncate text-foreground/90">{guild.name}</span>
                                  <span className="font-mono text-[11px]">{guild.id}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-muted-foreground">Nenhum servidor listado.</p>
                          )}
                        </div>

                        <div className="rounded-lg border border-border bg-surface-2 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            Amigos detectados
                          </div>
                          {validatedUser.friends.length ? (
                            <ul className="space-y-1.5 text-xs text-muted-foreground">
                              {validatedUser.friends.slice(0, 5).map((friend) => (
                                <li key={friend.id} className="rounded-md bg-background/70 px-2 py-1.5">
                                  <p className="truncate text-foreground/90">
                                    {friend.global_name ?? friend.username}
                                  </p>
                                  <p className="truncate text-[11px] text-muted-foreground">
                                    @{friend.username}
                                    {friend.discriminator ? `#${friend.discriminator}` : ""}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-muted-foreground">Nenhum amigo listado.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          MFA: {validatedUser.mfa_enabled ? "ativo" : "inativo"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {validatedUser.email ?? "sem e-mail informado"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {validatedUser.phone ?? "sem telefone informado"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      A API não retornou dados de usuário para este token.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ════════════════ Dialogs ════════════════ */}

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
        onOpenChange={setLeaveServerOpen}
        title="Sair de todos os servidores"
        description="Esta ação irá sair de todos os servidores Discord que você participa. O processo roda em background e pode levar alguns minutos."
        warningText="Ação irreversível. Para entrar novamente em um servidor você precisará de um convite. Você pode ignorar servidores específicos preenchendo os IDs abaixo."
        destructive
        isPending={leaveServer.isPending}
        onConfirm={() =>
          run(
            () => leaveServer.mutateAsync({ ignored_guild_ids: parseIds(leaveServerIgnored) }),
            "Processo de sair de servidores iniciado.",
            () => { setLeaveServerOpen(false); setLeaveServerIgnored("") },
          )
        }
      >
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
      </ToolConfirmDialog>

      {/* Remover amizades */}
      <ToolConfirmDialog
        open={deleteRelOpen}
        onOpenChange={setDeleteRelOpen}
        title="Remover todas as amizades"
        description="Esta ação irá remover todos os amigos e desfazer todos os bloqueios na sua conta Discord. O processo roda em background e pode levar alguns minutos."
        warningText="Ação irreversível. Você perderá todos os amigos e precisará adicioná-los novamente. Você pode ignorar usuários específicos preenchendo os IDs abaixo."
        destructive
        isPending={deleteRel.isPending}
        onConfirm={() =>
          run(
            () => deleteRel.mutateAsync({ ignored_user_ids: parseIds(deleteRelIgnored) }),
            "Processo de remover amizades iniciado.",
            () => { setDeleteRelOpen(false); setDeleteRelIgnored("") },
          )
        }
      >
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
      </ToolConfirmDialog>

      {/* Limpar DMs */}
      <ToolConfirmDialog
        open={clearDmsOpen}
        onOpenChange={setClearDmsOpen}
        title="Limpar mensagens de todos os DMs"
        description="Esta ação irá apagar suas mensagens de todos os canais de DM abertos. O processo roda em background."
        warningText="As mensagens apagadas não podem ser recuperadas. Você pode ignorar DMs específicas preenchendo os IDs abaixo."
        isPending={clearDms.isPending}
        onConfirm={() =>
          run(
            () => clearDms.mutateAsync({ ignored_channel_ids: parseIds(clearDmsIgnored) }),
            "Limpeza de DMs iniciada.",
            () => { setClearDmsOpen(false); setClearDmsIgnored("") },
          )
        }
      >
        <div className="space-y-1.5">
          <Label className="text-xs">IDs de DMs a ignorar (opcional)</Label>
          <p className="text-xs text-muted-foreground">Um ID por linha ou separados por vírgula.</p>
          <textarea
            className={textareaClass}
            placeholder={"123456789012345678\n987654321098765432"}
            value={clearDmsIgnored}
            onChange={(e) => setClearDmsIgnored(e.target.value)}
          />
        </div>
      </ToolConfirmDialog>

      {/* Limpar canal */}
      <ToolConfirmDialog
        open={clearChannelOpen}
        onOpenChange={setClearChannelOpen}
        title="Limpar mensagens de um canal"
        description="Esta ação irá apagar suas mensagens de um canal específico. Informe o ID do canal abaixo."
        warningText="As mensagens apagadas não podem ser recuperadas."
        isPending={clearChannel.isPending}
        disabled={!clearChannelId.trim()}
        confirmLabel="Limpar canal"
        onConfirm={() =>
          run(
            () => clearChannel.mutateAsync(clearChannelId.trim()),
            "Limpeza do canal iniciada.",
            () => { setClearChannelOpen(false); setClearChannelId("") },
          )
        }
      >
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
              Guild ID <span className="text-destructive">*</span>
            </Label>
            <Input
              value={clearServerGuildId}
              onChange={(e) => setClearServerGuildId(e.target.value)}
              placeholder="123456789012345678"
              className="h-8 font-mono text-xs"
            />
          </div>
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
