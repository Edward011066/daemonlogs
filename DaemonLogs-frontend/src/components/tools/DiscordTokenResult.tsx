import { useState } from "react"
import {
  Clock,
  CreditCard,
  Globe,
  Inbox,
  Monitor,
  Server,
  Shield,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CopyButton } from "@/components/shared/CopyButton"
import { cn } from "@/lib/utils"
import type { DiscordUserInfo } from "@/types"

// ── Helpers ──────────────────────────────────────────────────────────────────

type DiscordUser = NonNullable<DiscordUserInfo["user"]>

function getAvatarUrl(userId: string, avatarHash: string | null): string | null {
  if (!avatarHash) return null
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`
}

function paymentTypeLabel(type: number): string {
  switch (type) {
    case 1: return "Cartão de crédito/débito"
    case 2: return "PayPal"
    case 3: return "Google Pay"
    case 4: return "Apple Pay"
    default: return `Tipo ${type}`
  }
}

function ageVerificationLabel(status: number): string {
  switch (status) {
    case 0: return "Não verificado"
    case 1: return "Verificado (18+)"
    default: return `Status ${status}`
  }
}

function authTypeLabel(type: number): string {
  switch (type) {
    case 1: return "App autenticador (TOTP)"
    case 2: return "SMS"
    case 3: return "Backup codes"
    default: return `Tipo ${type}`
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  copy,
}: {
  label: string
  value: string | null | undefined
  copy?: boolean
}) {
  if (!value) return null
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-3 py-2.5">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5 flex items-start justify-between gap-2 sm:items-center">
        <span className="min-w-0 break-all text-sm text-foreground">{value}</span>
        {copy && <CopyButton value={value} className="h-6 w-6 shrink-0" />}
      </div>
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  icon: Icon,
  compact = false,
}: {
  label: string
  value: string
  icon: React.ElementType
  compact?: boolean
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface-2", compact ? "px-3 py-2.5" : "p-3")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <Icon className={cn("text-muted-foreground", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
      </div>
      <p className={cn("font-semibold text-foreground", compact ? "mt-1.5 text-base" : "mt-2 text-lg")}>
        {value}
      </p>
    </div>
  )
}

function GuildListDialog({ guilds }: { guilds: DiscordUser["guilds"] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-xs">
          Ver todos ({guilds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Server className="h-4 w-4" />
            Todos os servidores ({guilds.length})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[55vh] sm:h-[60vh]">
          <div className="space-y-1.5 pr-3">
            {guilds.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-border bg-surface px-3 py-2.5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 truncate text-sm text-foreground">{g.name}</span>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="min-w-0 break-all font-mono text-[11px] text-muted-foreground">
                      {g.id}
                    </span>
                    <CopyButton value={g.id} className="h-6 w-6 shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function FriendListDialog({ friends }: { friends: DiscordUser["friends"] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-xs">
          Ver todos ({friends.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Todos os amigos ({friends.length})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[55vh] sm:h-[60vh]">
          <div className="space-y-1.5 pr-3">
            {friends.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-border bg-surface px-3 py-2.5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {f.global_name ?? f.username}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      @{f.username}
                      {f.discriminator && f.discriminator !== "0" ? `#${f.discriminator}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="min-w-0 break-all font-mono text-[11px] text-muted-foreground">
                      {f.id}
                    </span>
                    <CopyButton value={f.id} className="h-6 w-6 shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ── Tab system ───────────────────────────────────────────────────────────────

type Tab = "geral" | "servidores" | "amigos" | "sessoes" | "pagamentos" | "config"

interface TabDef {
  id: Tab
  label: string
  icon: React.ElementType
  hidden?: boolean
}

// ── Main Component ───────────────────────────────────────────────────────────

interface DiscordTokenResultProps {
  data: DiscordUserInfo
}

export function DiscordTokenResult({ data }: DiscordTokenResultProps) {
  const [tab, setTab] = useState<Tab>("geral")
  const { valid, user } = data

  if (!valid && !user) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
        <span className="text-sm text-destructive">Token inválido ou expirado.</span>
      </div>
    )
  }

  if (!user) return null

  const avatarUrl = getAvatarUrl(user.id, user.avatar)
  const displayName = user.global_name ?? user.username
  const tag = `@${user.username}${
    user.discriminator && user.discriminator !== "0" ? `#${user.discriminator}` : ""
  }`

  const hasSessions = !!user.user_sessions?.length
  const hasPayments = !!user.payment_sources?.length
  const hasConfig =
    (user.authenticator_types?.length ?? 0) > 0 ||
    user.age_verification_status !== undefined ||
    !!user.email_settings

  const TABS: TabDef[] = [
    { id: "geral", label: "Geral", icon: User },
    { id: "servidores", label: "Servidores", icon: Server },
    { id: "amigos", label: "Amigos", icon: Users },
    { id: "sessoes", label: "Sessões", icon: Clock, hidden: !hasSessions },
    { id: "pagamentos", label: "Pagamentos", icon: CreditCard, hidden: !hasPayments },
    { id: "config", label: "Config.", icon: Inbox, hidden: !hasConfig },
  ]

  const visibleTabs = TABS.filter((item) => !item.hidden)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background/70">
      <div className="border-b border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/20 sm:h-16 sm:w-16">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-accent">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground sm:text-lg">{displayName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="max-w-full truncate text-sm text-muted-foreground">{tag}</span>
                <CopyButton value={tag} className="h-6 w-6 shrink-0" />
              </div>

              <div className="mt-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Discord ID
                </p>
                <div className="mt-1.5 flex items-start justify-between gap-2 sm:items-center">
                  <span className="min-w-0 break-all font-mono text-xs text-foreground">
                    {user.id}
                  </span>
                  <CopyButton value={user.id} className="h-6 w-6 shrink-0" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:max-w-[16rem] sm:justify-end">
          <Badge
            variant="outline"
            className="border-success/20 bg-success/10 text-[11px] text-success"
          >
            Token válido
          </Badge>
          {user.mfa_enabled && (
            <Badge
              variant="outline"
              className="border-accent/20 bg-accent/10 text-[11px] text-accent"
            >
              MFA ativo
            </Badge>
          )}
          {user.age_verification_status === 1 && (
            <Badge
              variant="outline"
              className="border-border text-[11px] text-muted-foreground"
            >
              18+ verificado
            </Badge>
          )}
        </div>
      </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
          <SummaryMetric label="Servidores" value={String(user.guild_count)} icon={Server} compact />
          <SummaryMetric label="Amigos" value={String(user.friend_count)} icon={Users} compact />
        </div>
      </div>

      <div className="border-b border-border bg-surface/50 px-4 py-3 sm:hidden">
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Visualização
        </p>
        <Select value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <SelectTrigger className="h-10 rounded-xl border-border bg-surface text-sm">
            <SelectValue placeholder="Selecione uma área" />
          </SelectTrigger>
          <SelectContent>
            {visibleTabs.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden overflow-x-auto border-b border-border bg-surface/50 sm:flex">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-3 sm:p-4">
        {tab === "geral" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryMetric label="Servidores" value={String(user.guild_count)} icon={Server} />
              <SummaryMetric label="Amigos" value={String(user.friend_count)} icon={Users} />
              <SummaryMetric
                label="Sessões"
                value={String(user.user_sessions?.length ?? 0)}
                icon={Clock}
              />
              <SummaryMetric
                label="Pagamentos"
                value={String(user.payment_sources?.length ?? 0)}
                icon={CreditCard}
              />
            </div>

            {user.bio && (
              <div className="rounded-xl border border-border bg-surface p-3 sm:p-4">
                <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Bio
                </p>
                <p className="whitespace-pre-wrap text-sm text-foreground">{user.bio}</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Identidade e contato
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <InfoRow label="Username" value={user.username} copy />
                <InfoRow label="Nome global" value={user.global_name ?? undefined} copy />
                <InfoRow label="E-mail" value={user.email ?? undefined} copy />
                <InfoRow label="Telefone" value={user.phone ?? undefined} copy />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Segurança e autenticação
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px]",
                    user.mfa_enabled
                      ? "border-accent/20 bg-accent/10 text-accent"
                      : "border-border text-muted-foreground",
                  )}
                >
                  MFA {user.mfa_enabled ? "ativa" : "inativa"}
                </Badge>
                {user.age_verification_status !== undefined && (
                  <Badge variant="outline" className="text-[11px]">
                    {ageVerificationLabel(user.age_verification_status)}
                  </Badge>
                )}
                {user.authenticator_types?.map((t) => (
                  <Badge key={t} variant="outline" className="text-[11px]">
                    <Shield className="mr-1 h-3 w-3" />
                    {authTypeLabel(t)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "servidores" && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {user.guilds.length} servidor(es)
              </p>
              {user.guilds.length > 0 && <GuildListDialog guilds={user.guilds} />}
            </div>
            <ScrollArea className="h-[18rem] sm:h-80">
              <div className="space-y-1.5 pr-2">
                {user.guilds.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Nenhum servidor listado.
                  </p>
                ) : (
                  user.guilds.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-xl border border-border bg-surface px-3 py-2.5"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="min-w-0 truncate text-sm text-foreground">{g.name}</span>
                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                          <span className="min-w-0 break-all font-mono text-[11px] text-muted-foreground">
                            {g.id}
                          </span>
                          <CopyButton value={g.id} className="h-6 w-6 shrink-0" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {tab === "amigos" && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">{user.friends.length} amigo(s)</p>
              {user.friends.length > 0 && <FriendListDialog friends={user.friends} />}
            </div>
            <ScrollArea className="h-[18rem] sm:h-80">
              <div className="space-y-1.5 pr-2">
                {user.friends.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Nenhum amigo listado.
                  </p>
                ) : (
                  user.friends.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-xl border border-border bg-surface px-3 py-2.5"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {f.global_name ?? f.username}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            @{f.username}
                            {f.discriminator && f.discriminator !== "0"
                              ? `#${f.discriminator}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                          <span className="min-w-0 break-all font-mono text-[11px] text-muted-foreground">
                            {f.id}
                          </span>
                          <CopyButton value={f.id} className="h-6 w-6 shrink-0" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {tab === "sessoes" && user.user_sessions && (
          <ScrollArea className="h-[20rem] sm:h-96">
            <div className="space-y-2 pr-2">
              {user.user_sessions.map((s) => (
                <div
                  key={s.id_hash}
                  className="space-y-3 rounded-xl border border-border bg-surface p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">
                          {s.client_info?.platform ?? "Plataforma desconhecida"}
                        </span>
                      </div>
                    </div>
                    <CopyButton value={s.id_hash} className="h-7 w-7 shrink-0" />
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 text-[11px] text-muted-foreground sm:grid-cols-2">
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {s.client_info?.os ?? "-"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {s.client_info?.location ?? "-"}
                    </span>
                    <span className="flex items-center gap-1 sm:col-span-2">
                      <Clock className="h-3 w-3" />
                      {s.approx_last_used_time ?? "-"}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Hash da sessão
                    </p>
                    <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground/80">
                      {s.id_hash}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {tab === "pagamentos" && user.payment_sources && (
          <ScrollArea className="h-[20rem] sm:h-96">
            <div className="space-y-2 pr-2">
              {user.payment_sources.map((p) => (
                <div
                  key={p.id}
                  className="space-y-3 rounded-xl border border-border bg-surface p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="break-words">
                          {paymentTypeLabel(p.type)}
                          {p.brand ? ` · ${p.brand}` : ""}
                        </span>
                      </div>
                      {p.last_4 && (
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          **** **** **** {p.last_4}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.default && (
                        <Badge
                          variant="outline"
                          className="border-accent/20 bg-accent/10 text-[10px] text-accent"
                        >
                          Padrão
                        </Badge>
                      )}
                      {p.invalid && (
                        <Badge
                          variant="outline"
                          className="border-destructive/20 bg-destructive/10 text-[10px] text-destructive"
                        >
                          Inválido
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 text-[11px] text-muted-foreground sm:grid-cols-2">
                    {p.expires_month != null && p.expires_year != null && (
                      <span>
                        Val.: {String(p.expires_month).padStart(2, "0")}/{p.expires_year}
                      </span>
                    )}
                    {p.email && (
                      <div className="flex items-start justify-between gap-2 sm:col-span-2">
                        <span className="min-w-0 break-all">{p.email}</span>
                        <CopyButton value={p.email} className="h-6 w-6 shrink-0" />
                      </div>
                    )}
                    {p.billing_address && (
                      <span className="sm:col-span-2">
                        {p.billing_address.name} · {p.billing_address.country}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {tab === "config" && (
          <div className="space-y-4">
            {(user.authenticator_types?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Autenticadores
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {user.authenticator_types!.map((t) => (
                    <Badge key={t} variant="outline" className="text-[11px]">
                      {authTypeLabel(t)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {user.age_verification_status !== undefined && (
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Verificação de idade
                </p>
                <Badge variant="outline" className="text-[11px]">
                  {ageVerificationLabel(user.age_verification_status)}
                </Badge>
              </div>
            )}

            {user.email_settings && (
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Config. de e-mail
                </p>
                <div className="space-y-2">
                  {Object.entries(user.email_settings.categories).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2 text-xs"
                    >
                      <span className="min-w-0 text-muted-foreground">{key}</span>
                      <span className={cn("shrink-0", value ? "text-success" : "text-muted-foreground")}>
                        {value ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
