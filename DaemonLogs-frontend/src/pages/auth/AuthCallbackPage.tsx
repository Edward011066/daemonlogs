import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { BackNavigationLink } from "@/components/shared/BackNavigationLink"
import { setToken } from "@/lib/auth"

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token")
    if (token) {
      setToken(decodeURIComponent(token))
      navigate("/dashboard", { replace: true })
    } else {
      navigate("/auth/login", { replace: true })
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <BackNavigationLink className="mx-auto" />
        <p className="text-sm text-muted-foreground">Autenticando...</p>
      </div>
    </div>
  )
}
