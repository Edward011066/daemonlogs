import { cn } from "@/lib/utils"

interface StatusDotProps {
  active: boolean
  className?: string
}

export function StatusDot({ active, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        active ? "bg-success" : "bg-destructive",
        className,
      )}
    />
  )
}
