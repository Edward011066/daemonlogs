import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getErrorMessageContent } from "@/lib/error-display"

interface ErrorAlertProps {
  error: unknown
  title?: string
}

export function ErrorAlert({ error, title = "Erro" }: ErrorAlertProps) {
  const message = getErrorMessageContent(error)

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
