import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { EventBadge } from "./EventBadge"
import { CopyButton } from "@/components/shared/CopyButton"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  DiscordEvent,
  DiscordUserRef,
  VoiceJoinDados,
  VoiceLeaveDados,
  VoiceSwitchDados,
} from "@/types"

// ── Helpers ──────────────────────────────────────────────────────────────────
type RawData = Record<string, unknown>

function getRaw(event: DiscordEvent): RawData {
  return event.dados && typeof event.dados === "object" ? (event.dados as RawData) : {}
}

function sv(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null
}

function firstStr(data: RawData, keys: string[]): string | null {
  for (const k of keys) {
    const v = sv(data[k])
    if (v) return v
  }
  return null
}

function getUsers(v: unknown): DiscordUserRef[] {
  if (!Array.isArray(v)) return []
  return v.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const d = item as Record<string, unknown>
    const username = sv(d.username)
    const discord_user_id = sv(d.discord_user_id)
    if (!username || !discord_user_id) return []
    return [{ username, discord_user_id }]
  })
}

function formatFull(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MetaChip({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-3 py-2">
      <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-mono text-xs text-foreground/80">{value}</span>
        {copy && <CopyButton value={value} />}
      </div>
    </div>
  )
}

function ContentBlock({
  title,
  value,
  tone = "default",
}: {
  title: string
  value: string
  tone?: "default" | "danger" | "warning" | "success"
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "danger"
          ? "border-destructive/20 bg-destructive/5"
          : tone === "warning"
            ? "border-warning/20 bg-warning/5"
            : tone === "success"
              ? "border-success/20 bg-success/5"
              : "border-border bg-surface-2",
      )}
    >
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="whitespace-pre-wrap break-words font-mono text-xs text-foreground/90">{value}</p>
    </div>
  )
}

function UserChip({ user }: { user: DiscordUserRef }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      {user.username}
    </span>
  )
}

// ── Voice content ─────────────────────────────────────────────────────────────
function VoiceContent({ event }: { event: DiscordEvent }) {
  const data = getRaw(event)
  const timestamp = sv(data.timestamp) ?? event.created_at

  if (event.tipo === "VOICE_JOIN") {
    const voice = data as unknown as VoiceJoinDados
    const users = getUsers(data.usuarios_presentes)
    return (
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {voice.guild_name && <MetaChip label="Servidor" value={voice.guild_name} />}
          {voice.canal_novo_nome && <MetaChip label="Canal entrou" value={voice.canal_novo_nome} />}
          <MetaChip label="Horário" value={formatFull(timestamp)} />
          <MetaChip label="Usuários na call" value={String(users.length)} />
        </div>
        {users.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              Quem estava na call
            </p>
            <div className="flex flex-wrap gap-1.5">
              {users.map((u) => (
                <UserChip key={u.discord_user_id} user={u} />
              ))}
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          {voice.canal_novo_id && <MetaChip label="Canal ID" value={voice.canal_novo_id} copy />}
          {voice.guild_id && <MetaChip label="Guild ID" value={voice.guild_id} copy />}
        </div>
      </div>
    )
  }

  if (event.tipo === "VOICE_LEAVE") {
    const voice = data as unknown as VoiceLeaveDados
    const remaining = getUsers(data.usuarios_que_ficaram)
    return (
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {voice.guild_name && <MetaChip label="Servidor" value={voice.guild_name} />}
          {voice.canal_anterior_nome && <MetaChip label="Canal saiu" value={voice.canal_anterior_nome} />}
          <MetaChip label="Horário" value={formatFull(timestamp)} />
          <MetaChip label="Ficaram na call" value={String(remaining.length)} />
        </div>
        {remaining.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              Quem ficou na call
            </p>
            <div className="flex flex-wrap gap-1.5">
              {remaining.map((u) => (
                <UserChip key={u.discord_user_id} user={u} />
              ))}
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          {voice.canal_anterior_id && (
            <MetaChip label="Canal ID" value={voice.canal_anterior_id} copy />
          )}
          {voice.guild_id && <MetaChip label="Guild ID" value={voice.guild_id} copy />}
        </div>
      </div>
    )
  }

  if (event.tipo === "VOICE_SWITCH") {
    const voice = data as unknown as VoiceSwitchDados
    return (
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {voice.guild_name && <MetaChip label="Servidor" value={voice.guild_name} />}
          {voice.canal_anterior_nome && <MetaChip label="Saiu de" value={voice.canal_anterior_nome} />}
          {voice.canal_novo_nome && <MetaChip label="Entrou em" value={voice.canal_novo_nome} />}
          <MetaChip label="Horário" value={formatFull(timestamp)} />
        </div>
        <div className="space-y-1.5">
          {voice.canal_anterior_id && (
            <MetaChip label="Canal anterior ID" value={voice.canal_anterior_id} copy />
          )}
          {voice.canal_novo_id && (
            <MetaChip label="Canal novo ID" value={voice.canal_novo_id} copy />
          )}
          {voice.guild_id && <MetaChip label="Guild ID" value={voice.guild_id} copy />}
        </div>
      </div>
    )
  }

  return null
}

// ── Message content ───────────────────────────────────────────────────────────
function MessageContent({ event }: { event: DiscordEvent }) {
  const data = getRaw(event)
  const guildName = firstStr(data, ["guild_name"])
  const channelName = firstStr(data, ["channel_name", "canal_nome"])
  const content = firstStr(data, ["conteudo", "content", "mensagem"])
  const deletedContent = firstStr(data, ["conteudo_apagado", "deleted_content", "content_deleted"])
  const beforeContent = firstStr(data, ["conteudo_anterior", "conteudo_antigo", "content_before"])
  const afterContent = firstStr(data, ["conteudo_novo", "conteudo_editado", "content_after"])
  const messageId = firstStr(data, ["message_id"])
  const guildId = firstStr(data, ["guild_id"])
  const channelId = firstStr(data, ["channel_id"])
  const link = firstStr(data, ["link_mensagem", "message_link"])
  const timestamp = firstStr(data, ["timestamp"]) ?? event.created_at

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {guildName && <MetaChip label="Servidor" value={guildName} />}
        {channelName && <MetaChip label="Canal" value={`#${channelName}`} />}
        <MetaChip label="Horário" value={formatFull(timestamp)} />
      </div>

      <div className="space-y-2">
        {(event.tipo === "MESSAGE_SENT" || event.tipo === "MENTION") && content && (
          <ContentBlock
            title={event.tipo === "MENTION" ? "Conteúdo da menção" : "Conteúdo"}
            value={content}
            tone="success"
          />
        )}
        {event.tipo === "MESSAGE_DELETE" && (
          <ContentBlock
            title="Mensagem apagada"
            value={(deletedContent ?? content) ?? "Conteúdo indisponível"}
            tone="danger"
          />
        )}
        {event.tipo === "MESSAGE_EDIT" && beforeContent && (
          <ContentBlock title="Antes da edição" value={beforeContent} tone="warning" />
        )}
        {event.tipo === "MESSAGE_EDIT" && afterContent && (
          <ContentBlock title="Após a edição" value={afterContent} tone="success" />
        )}
        {event.tipo === "MESSAGE_EDIT" && !beforeContent && !afterContent && content && (
          <ContentBlock title="Conteúdo" value={content} />
        )}
      </div>

      <div className="space-y-1.5">
        {messageId && <MetaChip label="Message ID" value={messageId} copy />}
        {channelId && <MetaChip label="Channel ID" value={channelId} copy />}
        {guildId && <MetaChip label="Guild ID" value={guildId} copy />}
      </div>

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir mensagem no Discord
        </a>
      )}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────
interface EventDetailSheetProps {
  event: DiscordEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDetailSheet({ event, open, onOpenChange }: EventDetailSheetProps) {
  if (!event) return null

  const targetLabel = event.conta_alvo.username ?? event.conta_alvo.discord_user_id
  const isVoice = event.tipo.startsWith("VOICE")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-border bg-surface p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-start gap-3">
            <EventBadge type={event.tipo} showIcon className="shrink-0" />
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-sm font-semibold text-foreground">
                {targetLabel}
              </SheetTitle>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {event.conta_alvo.discord_user_id}
                </span>
                <CopyButton value={event.conta_alvo.discord_user_id} />
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-4 px-6 py-5">
            {isVoice ? <VoiceContent event={event} /> : <MessageContent event={event} />}
            <Separator />
            <MetaChip label="ID interno do evento" value={String(event.id)} copy />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
