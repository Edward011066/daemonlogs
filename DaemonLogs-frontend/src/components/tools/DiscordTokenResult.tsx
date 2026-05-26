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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
    <div className="flex items-center justify-between gap-2 rounded-md bg-background/60 px-3 py-2">
      <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-1">
        <span className="truncate font-mono text-xs text-foreground">{value}</span>
        {copy && <CopyButton value={value} />}
      </div>
    </div>
  )
}

function GuildListDialog({ guilds }: { guilds: DiscordUser["guilds"] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
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
        <ScrollArea className="h-[60vh]">
          <div className="space-y-1.5 pr-3">
            {guilds.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
              >
                <span className="truncate text-xs text-foreground">{g.name}</span>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="font-mono text-[11px] text-muted-foreground">{g.id}</span>
                  <CopyButton value={g.id} />
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
        <Button variant="ghost" size="sm" className="h-7 text-xs">
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
        <ScrollArea className="h-[60vh]">
          <div className="space-y-1.5 pr-3">
            {friends.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {f.global_name ?? f.username}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    @{f.username}
                    {f.discriminator && f.discriminator !== "0" ? `#${f.discriminator}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="font-mono text-[11px] text-muted-foreground">{f.id}</span>
                  <CopyButton value={f.id} />
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

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background/60">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 border-b border-border bg-surface p-4 sm:flex-row sm:items-center">
        {/* Avatar */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/20">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-accent">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{displayName}</p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{tag}</span>
            <CopyButton value={tag} />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[11px] text-muted-foreground">{user.id}</span>
            <CopyButton value={user.id} />
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
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

      {/* ── Tab Nav ── */}
      <div className="flex overflow-x-auto border-b border-border bg-surface/50">
        {TABS.filter((t) => !t.hidden).map((t) => (
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

      {/* ── Tab Content ── */}
      <div className="p-4">
        {/* Geral */}
        {tab === "geral" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Servidores
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">{user.guild_count}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Amigos
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">{user.friend_count}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">E-mail</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {user.email ?? "-"}
                  </span>
                  {user.email && <CopyButton value={user.email} />}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Telefone
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {user.phone ?? "-"}
                  </span>
                  {user.phone && <CopyButton value={user.phone} />}
                </div>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Bio
                </p>
                <p className="whitespace-pre-wrap text-sm text-foreground">{user.bio}</p>
              </div>
            )}

            {/* Info rows */}
            <div className="space-y-1.5">
              <InfoRow label="ID" value={user.id} copy />
              <InfoRow label="Username" value={user.username} copy />
              <InfoRow label="Nome global" value={user.global_name ?? undefined} copy />
              <InfoRow label="E-mail" value={user.email ?? undefined} copy />
              <InfoRow label="Telefone" value={user.phone ?? undefined} copy />
            </div>

            {/* MFA / Authenticators */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                MFA: {user.mfa_enabled ? "ativo" : "inativo"}
              </span>
              {user.authenticator_types?.map((t) => (
                <span key={t} className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  {authTypeLabel(t)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Servidores */}
        {tab === "servidores" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {user.guilds.length} servidor(es)
              </p>
              {user.guilds.length > 0 && <GuildListDialog guilds={user.guilds} />}
            </div>
            <ScrollArea className="h-80">
              <div className="space-y-1.5 pr-2">
                {user.guilds.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Nenhum servidor listado.
                  </p>
                ) : (
                  user.guilds.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
                    >
                      <span className="truncate text-xs text-foreground">{g.name}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {g.id}
                        </span>
                        <CopyButton value={g.id} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Amigos */}
        {tab === "amigos" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{user.friends.length} amigo(s)</p>
              {user.friends.length > 0 && <FriendListDialog friends={user.friends} />}
            </div>
            <ScrollArea className="h-80">
              <div className="space-y-1.5 pr-2">
                {user.friends.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Nenhum amigo listado.
                  </p>
                ) : (
                  user.friends.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">
                          {f.global_name ?? f.username}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          @{f.username}
                          {f.discriminator && f.discriminator !== "0"
                            ? `#${f.discriminator}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {f.id}
                        </span>
                        <CopyButton value={f.id} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Sessões */}
        {tab === "sessoes" && user.user_sessions && (
          <ScrollArea className="h-96">
            <div className="space-y-2 pr-2">
              {user.user_sessions.map((s) => (
                <div
                  key={s.id_hash}
                  className="space-y-2 rounded-lg border border-border bg-surface p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                      {s.client_info?.platform ?? "Plataforma desconhecida"}
                    </div>
                    <CopyButton value={s.id_hash} />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {s.client_info?.os ?? "-"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {s.client_info?.location ?? "-"}
                    </span>
                    <span className="col-span-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {s.approx_last_used_time ?? "-"}
                    </span>
                  </div>
                  <p className="truncate font-mono text-[10px] text-muted-foreground/60">
                    {s.id_hash}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Pagamentos */}
        {tab === "pagamentos" && user.payment_sources && (
          <ScrollArea className="h-96">
            <div className="space-y-2 pr-2">
              {user.payment_sources.map((p) => (
                <div
                  key={p.id}
                  className="space-y-2 rounded-lg border border-border bg-surface p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      {paymentTypeLabel(p.type)}
                      {p.brand ? ` · ${p.brand}` : ""}
                    </div>
                    <div className="flex items-center gap-1">
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
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                    {p.last_4 && <span>**** **** **** {p.last_4}</span>}
                    {p.expires_month != null && p.expires_year != null && (
                      <span>
                        Val.: {String(p.expires_month).padStart(2, "0")}/{p.expires_year}
                      </span>
                    )}
                    {p.email && (
                      <span className="col-span-2 flex items-center gap-1">
                        {p.email}
                        <CopyButton value={p.email} />
                      </span>
                    )}
                    {p.billing_address && (
                      <span className="col-span-2">
                        {p.billing_address.name} · {p.billing_address.country}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Config. */}
        {tab === "config" && (
          <div className="space-y-4">
            {(user.authenticator_types?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
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
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Verificação de idade
                </p>
                <p className="text-xs text-foreground">
                  {ageVerificationLabel(user.age_verification_status)}
                </p>
              </div>
            )}

            {user.email_settings && (
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Config. de e-mail
                </p>
                <div className="space-y-1">
                  {Object.entries(user.email_settings.categories).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{key}</span>
                      <span className={value ? "text-success" : "text-muted-foreground"}>
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
