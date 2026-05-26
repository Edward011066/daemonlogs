import { Outlet, useNavigate } from "react-router-dom"
import { Eye } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { ToolStatusBanner } from "@/components/tools/ToolStatusBanner"
import { GuestModeProvider, useGuestMode } from "@/contexts/GuestModeContext"
import { LoginPromptDialog } from "@/components/shared/LoginPromptDialog"
import { Button } from "@/components/ui/button"
import { clearGuestMode } from "@/lib/guest"

const INTERACTIVE_SELECTOR =
  'button, input, select, textarea, label, [role="button"], [role="checkbox"], [role="switch"], [role="combobox"], [role="tab"]'

function AppShellInner() {
  const { isGuest, openLoginPrompt } = useGuestMode()
  const navigate = useNavigate()

  const handleMainClickCapture = (e: React.MouseEvent) => {
    if (!isGuest) return
    const target = e.target as HTMLElement
    if (target.closest(INTERACTIVE_SELECTOR)) {
      e.stopPropagation()
      e.preventDefault()
      openLoginPrompt()
    }
  }

  const handleLoginClick = () => {
    clearGuestMode()
    navigate("/auth/login")
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        {isGuest && (
          <div className="flex shrink-0 items-center gap-3 border-b border-accent/20 bg-accent/5 px-6 py-2">
            <Eye className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span className="flex-1 text-xs text-muted-foreground">
              Modo demonstração —{" "}
              <span className="font-medium text-foreground">visualização apenas</span>. Clique
              em qualquer função para fazer login.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleLoginClick}
            >
              Fazer login
            </Button>
          </div>
        )}

        <ToolStatusBanner />

        <main
          className="flex-1 overflow-y-auto p-6"
          onClickCapture={handleMainClickCapture}
        >
          <Outlet />
        </main>
      </div>

      <LoginPromptDialog />
    </div>
  )
}

export function AppShell() {
  return (
    <GuestModeProvider>
      <AppShellInner />
    </GuestModeProvider>
  )
}
