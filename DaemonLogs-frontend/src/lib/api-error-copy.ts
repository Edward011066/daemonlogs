export interface ApiErrorRouteHint {
  href: string
}

export interface ApiErrorCopy {
  message: string
  routeHint?: ApiErrorRouteHint
}

const TOKEN_SETUP_MESSAGE = "Adicione um token válido na página Perfil antes de continuar."

export function resolveApiErrorCopy(error: string, rawMessage: string): ApiErrorCopy {
  if (error === "NO_VALID_TOKEN" && rawMessage.includes("/my-token/add")) {
    return {
      message: TOKEN_SETUP_MESSAGE,
      routeHint: { href: "/profile" },
    }
  }

  if (error === "TOKEN_ALREADY_EXISTS" || rawMessage.includes("PATCH /my-token/rotate")) {
    return {
      message: "Você já possui um token cadastrado. Se quiser substituí-lo, faça isso na página Perfil.",
    }
  }

  if (rawMessage === "Nenhum token cadastrado. Use POST /my-token/add para adicionar.") {
    return {
      message: "Nenhum token cadastrado. Adicione um token na página Perfil.",
    }
  }

  if (rawMessage.includes("POST /tools/cancel-current-process")) {
    return {
      message: rawMessage.replace(
        "Use POST /tools/cancel-current-process para cancelar.",
        "Use o botão de cancelar na página Ferramentas.",
      ),
    }
  }

  if (rawMessage.includes("POST /clear-chat/cancel")) {
    return {
      message: rawMessage.replace(
        "Use POST /clear-chat/cancel para cancelar.",
        "Use o botão de cancelar na página Ferramentas.",
      ),
    }
  }

  return { message: rawMessage }
}