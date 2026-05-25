import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

interface AsyncButtonProps extends ComponentProps<typeof Button> {
  loading?: boolean
}

export function AsyncButton({ loading, disabled, children, className, ...props }: AsyncButtonProps) {
  return (
    <Button disabled={loading || disabled} className={cn(className)} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}
