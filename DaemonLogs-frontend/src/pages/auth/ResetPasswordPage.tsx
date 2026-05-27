import { Link } from "react-router-dom"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"
import { BackNavigationLink } from "@/components/shared/BackNavigationLink"

export function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-4">
        <BackNavigationLink />

        <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-surface p-8">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Redefinir senha</h1>
            <p className="text-sm text-muted-foreground">
              Insira o código recebido e sua nova senha
            </p>
          </div>

          <ResetPasswordForm />

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
