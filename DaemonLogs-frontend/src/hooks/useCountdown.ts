import { useEffect, useState } from "react"

/** Retorna os segundos restantes até `expiresAt`. Retorna 0 quando expirar. */
export function useCountdown(expiresAt: string | null): number {
  const getRemaining = () => {
    if (!expiresAt) return 0
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  }

  const [remaining, setRemaining] = useState(getRemaining)

  useEffect(() => {
    if (!expiresAt) return
    setRemaining(getRemaining())
    const timer = setInterval(() => {
      const secs = getRemaining()
      setRemaining(secs)
      if (secs === 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt])

  return remaining
}

/** Formata segundos em "MM:SS" */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
