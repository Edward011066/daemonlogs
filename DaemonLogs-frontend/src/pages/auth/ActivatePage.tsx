import { Link } from "react-router-dom"
import { ActivateForm } from "@/components/auth/ActivateForm"

export function ActivatePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-surface p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Ativar conta</h1>
          <p className="text-sm text-muted-foreground">
            Insira o código enviado para o seu e-mail
          </p>
        </div>

        <ActivateForm />

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/auth/login" className="hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  )
}
