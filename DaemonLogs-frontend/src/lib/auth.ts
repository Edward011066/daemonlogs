import { clearGuestMode } from "./guest"

const KEY = "jwt_token"

export const getToken = () => localStorage.getItem(KEY)
export const setToken = (t: string) => {
  localStorage.setItem(KEY, t)
  clearGuestMode()
}
export const clearToken = () => {
  localStorage.removeItem(KEY)
  clearGuestMode()
}

export type AuthMode = "local" | "discord"
export const getAuthMode = (): AuthMode =>
  (import.meta.env.VITE_AUTH_MODE as AuthMode) ?? "local"
