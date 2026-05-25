import { getAuthMode } from "@/lib/auth"
import { LocalLoginForm } from "@/components/auth/LocalLoginForm"
import { DiscordLoginButton } from "@/components/auth/DiscordLoginButton"
import { Link } from "react-router-dom"

export function LoginPage() {
  const mode = getAuthMode()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-surface p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">DaemonLogs</h1>
          <p className="text-sm text-muted-foreground">Acesse sua conta</p>
        </div>

        {mode === "discord" ? <DiscordLoginButton /> : <LocalLoginForm />}

        {mode === "local" && (
          <div className="space-y-2 text-center text-xs text-muted-foreground">
            <p>
              Não tem conta?{" "}
              <Link to="/auth/register" className="text-accent hover:underline">
                Criar conta
              </Link>
            </p>
            <p>
              <Link to="/auth/forgot-password" className="hover:underline">
                Esqueci minha senha
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
