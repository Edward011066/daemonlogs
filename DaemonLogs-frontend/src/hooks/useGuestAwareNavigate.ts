import { type NavigateOptions, type To, useNavigate } from "react-router-dom"
import { getToken } from "@/lib/auth"
import { setGuestMode } from "@/lib/guest"

interface GuestAwareNavigateOptions extends NavigateOptions {
  enableGuestMode?: boolean
}

export function useGuestAwareNavigate() {
  const navigate = useNavigate()

  return (to: To | number, options?: GuestAwareNavigateOptions) => {
    if (typeof to === "number") {
      navigate(to)
      return
    }

    if (!getToken() && options?.enableGuestMode !== false) {
      setGuestMode()
    }

    navigate(to, options)
  }
}