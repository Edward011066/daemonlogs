import { Link, Navigate } from "react-router-dom"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { BackNavigationLink } from "@/components/shared/BackNavigationLink"
import { getAuthMode } from "@/lib/auth"

export function RegisterPage() {
  if (getAuthMode() === "discord") {
    return <Navigate to="/auth/login" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-4">
        <BackNavigationLink />

        <div className="space-y-6 rounded-lg border border-border bg-surface p-8">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Criar conta</h1>
            <p className="text-sm text-muted-foreground">Preencha os dados abaixo</p>
          </div>

          <RegisterForm />

          <p className="text-center text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/auth/login" className="text-accent hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
