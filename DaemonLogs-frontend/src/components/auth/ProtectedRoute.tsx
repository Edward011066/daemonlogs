import { Navigate, Outlet } from "react-router-dom"
import { getToken } from "@/lib/auth"
import { isGuestMode } from "@/lib/guest"

export function ProtectedRoute() {
  return getToken() || isGuestMode() ? <Outlet /> : <Navigate to="/auth/login" replace />
}
