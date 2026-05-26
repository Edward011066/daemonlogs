import { clearToken, getToken } from "./auth"
import { isGuestMode } from "./guest"
import { resolveApiErrorCopy, type ApiErrorRouteHint } from "./api-error-copy"

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

export class ApiError extends Error {
  public readonly error: string
  public readonly meta?: Record<string, unknown>
  public readonly status?: number
  public readonly rawMessage: string
  public readonly routeHint?: ApiErrorRouteHint

  constructor(
    error: string,
    message: string,
    meta?: Record<string, unknown>,
    status?: number,
  ) {
    const presentation = resolveApiErrorCopy(error, message)

    super(presentation.message)

    this.name = "ApiError"
    this.error = error
    this.meta = meta
    this.status = status
    this.rawMessage = message
    this.routeHint = presentation.routeHint
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    if (!isGuestMode()) {
      clearToken()
      window.location.href = "/auth/login"
    }
    throw new ApiError("UNAUTHORIZED", "Sessão expirada.", undefined, 401)
  }

  if (!response.ok) {
    const body: { error?: string; message?: string; meta?: Record<string, unknown> } =
      await response.json().catch(() => ({}))
    throw new ApiError(
      body.error ?? "UNKNOWN_ERROR",
      body.message ?? "Erro desconhecido.",
      body.meta,
      response.status,
    )
  }

  if (response.status === 202 || response.status === 204) return null as T

  return response.json() as Promise<T>
}
