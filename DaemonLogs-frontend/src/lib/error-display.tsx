import type { ReactNode } from "react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import { isGuestMode } from "@/lib/guest"

export function getErrorMessageContent(error: unknown): ReactNode {
  if (error instanceof ApiError) {
    if (error.routeHint) {
      return (
        <>
          {error.message} Clique{" "}
          <a
            href={error.routeHint.href}
            className="font-medium underline underline-offset-4"
          >
            aqui
          </a>
          .
        </>
      )
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Ocorreu um erro inesperado."
}

export function showErrorToast(error: unknown) {
  if (isGuestMode() && (error as Record<string, unknown>)?.status === 401) return
  toast.error(getErrorMessageContent(error))
}