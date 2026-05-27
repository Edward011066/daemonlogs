import { ArrowRight, Radio } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useGuestAwareNavigate } from "@/hooks/useGuestAwareNavigate"

interface MonitoringContributeTriggerProps extends Omit<ButtonProps, "children" | "onClick"> {
  label?: string
}

export function MonitoringContributeTrigger({
  className,
  label = "Quero contribuir com monitoramentos",
  variant = "outline",
  size = "default",
  ...props
}: MonitoringContributeTriggerProps) {
  const guestNavigate = useGuestAwareNavigate()

  return (
    <Button
      data-allow-guest-interaction="true"
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      onClick={() => guestNavigate("/monitoring-contribute")}
      {...props}
    >
      <Radio className="h-4 w-4" />
      {label}
      <ArrowRight className="h-4 w-4" />
    </Button>
  )
}