import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useGuestAwareNavigate } from "@/hooks/useGuestAwareNavigate"

interface BackNavigationLinkProps {
  className?: string
}

export function BackNavigationLink({ className }: BackNavigationLinkProps) {
  const guestNavigate = useGuestAwareNavigate()
  const canGoBack = typeof window !== "undefined" && (window.history.state?.idx ?? 0) > 0

  const handleNavigate = () => {
    if (canGoBack) {
      guestNavigate(-1)
      return
    }

    guestNavigate("/")
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-allow-guest-interaction="true"
      className={cn("h-auto gap-2 px-0 text-sm text-muted-foreground hover:text-foreground", className)}
      onClick={handleNavigate}
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar
    </Button>
  )
}