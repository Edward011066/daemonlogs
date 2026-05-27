import { Link } from "react-router-dom"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"
import { BackNavigationLink } from "@/components/shared/BackNavigationLink"

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-4">
        <BackNavigationLink />

        <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-surface p-8">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Recuperar senha</h1>
            <p className="text-sm text-muted-foreground">
              Informe o e-mail da sua conta
            </p>
          </div>

          <ForgotPasswordForm />

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/auth/login" className="hover:underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
