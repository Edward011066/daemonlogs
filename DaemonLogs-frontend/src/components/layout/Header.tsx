import { useNavigate } from "react-router-dom"
import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { apiFetch } from "@/lib/api"
import { clearToken } from "@/lib/auth"

export function Header() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()

  const handleLogout = async () => {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {})
    clearToken()
    navigate("/auth/login", { replace: true })
  }

  return (
    <header className="flex h-14 items-center justify-end border-b border-border bg-surface px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <User className="h-4 w-4" />
            <span className="text-sm">{user?.username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
