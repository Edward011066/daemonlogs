import { Navigate, Outlet } from "react-router-dom"
import { getToken } from "@/lib/auth"

export function GuestRoute() {
  return getToken() ? <Navigate to="/dashboard" replace /> : <Outlet />
}
