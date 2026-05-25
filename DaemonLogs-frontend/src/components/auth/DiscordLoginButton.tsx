import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DiscordLoginButton() {
  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/auth/discord`
  }

  return (
    <Button onClick={handleLogin} className="w-full" size="lg">
      <LogIn className="mr-2 h-4 w-4" />
      Entrar com Discord
    </Button>
  )
}
