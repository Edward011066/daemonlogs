import { Lock, LogIn, UserPlus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useGuestMode } from "@/contexts/GuestModeContext"
import { clearGuestMode } from "@/lib/guest"
import { getAuthMode } from "@/lib/auth"

export function LoginPromptDialog() {
  const { promptOpen, closeLoginPrompt } = useGuestMode()
  const navigate = useNavigate()
  const isLocalAuth = getAuthMode() === "local"

  const handleDiscordLogin = () => {
    clearGuestMode()
    window.location.href = `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/auth/discord`
  }

  const handleLocalLogin = () => {
    clearGuestMode()
    closeLoginPrompt()
    navigate("/auth/login")
  }

  const handleRegister = () => {
    clearGuestMode()
    closeLoginPrompt()
    navigate("/auth/register")
  }

  return (
    <Dialog open={promptOpen} onOpenChange={(open) => !open && closeLoginPrompt()}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Lock className="h-6 w-6 text-accent" />
          </div>
          <DialogTitle>Login necessário</DialogTitle>
        </DialogHeader>

        <p className="text-center text-sm text-muted-foreground">
          Você está no <span className="font-medium text-foreground">modo de demonstração</span>.
          Faça login para usar todas as funcionalidades do DaemonLogs.
        </p>

        <div className="mt-2 flex flex-col gap-2">
          {isLocalAuth ? (
            <>
              <Button onClick={handleLocalLogin} className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Fazer login
              </Button>
              <Button variant="outline" onClick={handleRegister} className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Criar conta
              </Button>
            </>
          ) : (
            <Button onClick={handleDiscordLogin} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Entrar com Discord
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
