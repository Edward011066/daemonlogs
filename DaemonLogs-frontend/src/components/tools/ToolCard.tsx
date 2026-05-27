import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

const TITLE_MAX_CHARS = 28
const DESCRIPTION_MAX_CHARS = 88

interface ToolCardProps {
  title: string
  description: string
  icon: LucideIcon
  onRun: () => void
  isPending: boolean
  destructive?: boolean
  actionLabel?: string
  children?: ReactNode
}

interface TruncatedTooltipTextProps {
  text: string
  maxChars: number
  className?: string
}

function truncateText(text: string, maxChars: number) {
  const normalizedText = text.trim()

  if (normalizedText.length <= maxChars) {
    return { displayText: normalizedText, isTruncated: false }
  }

  return {
    displayText: `${normalizedText.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`,
    isTruncated: true,
  }
}

function TruncatedTooltipText({ text, maxChars, className }: TruncatedTooltipTextProps) {
  const { displayText, isTruncated } = truncateText(text, maxChars)

  if (!isTruncated) {
    return <span className={className}>{displayText}</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(className, "cursor-help")}>{displayText}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs break-words text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

export function ToolCard({
  title,
  description,
  icon: Icon,
  onRun,
  isPending,
  destructive,
  actionLabel = "Executar",
  children,
}: ToolCardProps) {
  return (
    <Card className="flex h-full flex-col bg-surface">
      <CardHeader className="pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="min-w-0 text-sm font-medium">
            <TruncatedTooltipText
              text={title}
              maxChars={TITLE_MAX_CHARS}
              className="block truncate"
            />
          </CardTitle>
        </div>
        <CardDescription className="h-10 text-xs leading-5">
          <TruncatedTooltipText
            text={description}
            maxChars={DESCRIPTION_MAX_CHARS}
            className="block overflow-hidden"
          />
        </CardDescription>
      </CardHeader>
      <CardContent className={children ? "mt-auto space-y-3" : "mt-auto"}>
        {children}
        <AsyncButton
          variant={destructive ? "destructive" : "default"}
          size="sm"
          className="w-full"
          loading={isPending}
          onClick={onRun}
        >
          {actionLabel}
        </AsyncButton>
      </CardContent>
    </Card>
  )
}
