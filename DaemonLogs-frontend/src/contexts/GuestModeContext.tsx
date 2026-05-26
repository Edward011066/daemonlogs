import { createContext, useContext, useState } from "react"
import { isGuestMode } from "@/lib/guest"

interface GuestModeCtx {
  isGuest: boolean
  promptOpen: boolean
  openLoginPrompt: () => void
  closeLoginPrompt: () => void
}

const GuestModeContext = createContext<GuestModeCtx | null>(null)

export function GuestModeProvider({ children }: { children: React.ReactNode }) {
  const isGuest = isGuestMode()
  const [promptOpen, setPromptOpen] = useState(false)

  return (
    <GuestModeContext.Provider
      value={{
        isGuest,
        promptOpen,
        openLoginPrompt: () => setPromptOpen(true),
        closeLoginPrompt: () => setPromptOpen(false),
      }}
    >
      {children}
    </GuestModeContext.Provider>
  )
}

export function useGuestMode() {
  const ctx = useContext(GuestModeContext)
  if (!ctx) throw new Error("useGuestMode must be used within GuestModeProvider")
  return ctx
}
