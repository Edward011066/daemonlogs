import { Client } from 'discord.js-selfbot-v13'

export interface DiscordTokenUserInfo {
  id: string
  username: string
  discriminator: string
  global_name: string | null
  avatar: string | null
  email: string | null
  phone: string | null
  mfa_enabled: boolean
  guilds: { id: string; name: string }[]
  guild_count: number
  friends: { id: string; username: string; global_name: string | null; avatar: string | null; discriminator: string }[]
  friend_count: number
}

export interface DiscordSessionInfo {
  id_hash: string
  approx_last_used_time: string
  client_info: { os: string; platform: string; location: string }
}

export interface DiscordPaymentSource {
  id: string
  type: number
  invalid: boolean
  flags: number
  deleted_at: string | null
  brand?: string | null
  last_4?: string | null
  expires_month?: number | null
  expires_year?: number | null
  email?: string | null
  billing_address: { name: string; country: string }
  country: string
  payment_gateway: number
  payment_gateway_source_id: string
  default: boolean
}

export interface DiscordEmailSettings {
  categories: Record<string, boolean>
  initialized: boolean
}

export interface DiscordTokenUserInfoExtended extends DiscordTokenUserInfo {
  bio: string | null
  authenticator_types: number[]
  age_verification_status: number | null
  user_sessions: DiscordSessionInfo[]
  payment_sources: DiscordPaymentSource[]
  email_settings: DiscordEmailSettings | null
}

async function fetchWithToken<T>(url: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Authorization: token } })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

/**
 * Valida um token de conta selfbot Discord (token de usuário, não de bot).
 * discord.js-selfbot-v13 aceita tokens de usuário diretamente — nunca adicionar prefixo "Bot ".
 * O cliente temporário é destruído após a validação.
 */
export async function validateToken(token: string): Promise<boolean> {
  const cleanToken = token.trim()
  if (cleanToken.startsWith('Bot ') || cleanToken.startsWith('Bearer ')) {
    return false
  }

  const client = new Client({ checkUpdate: false, partials: ['MESSAGE', 'CHANNEL', 'USER'] } as ConstructorParameters<typeof Client>[0] & { checkUpdate?: boolean })
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      client.destroy()
      resolve(false)
    }, 15000)

    client.on('ready', () => {
      clearTimeout(timeout)
      client.destroy()
      resolve(true)
    })

    client.on('error', () => {
      clearTimeout(timeout)
      client.destroy()
      resolve(false)
    })

    client.login(cleanToken).catch(() => {
      clearTimeout(timeout)
      client.destroy()
      resolve(false)
    })
  })
}

/**
 * Valida um token e retorna username da conta se válido.
 * Usado ao adicionar conta de monitoramento para exibir o username na resposta.
 */
export async function validateTokenAndGetUsername(
  token: string,
): Promise<{ isValid: true; username: string } | { isValid: false }> {
  const cleanToken = token.trim()
  if (cleanToken.startsWith('Bot ') || cleanToken.startsWith('Bearer ')) {
    return { isValid: false }
  }

  const client = new Client({ checkUpdate: false, partials: ['MESSAGE', 'CHANNEL', 'USER'] } as ConstructorParameters<typeof Client>[0] & { checkUpdate?: boolean })
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      client.destroy()
      resolve({ isValid: false })
    }, 15000)

    client.on('ready', () => {
      clearTimeout(timeout)
      const username = client.user?.username ?? 'desconhecido'
      client.destroy()
      resolve({ isValid: true, username })
    })

    client.on('error', () => {
      clearTimeout(timeout)
      client.destroy()
      resolve({ isValid: false })
    })

    client.login(cleanToken).catch(() => {
      clearTimeout(timeout)
      client.destroy()
      resolve({ isValid: false })
    })
  })
}

/**
 * Valida um token e retorna as informações completas do usuário Discord se válido.
 * Sempre retorna 200 — { valid: false } para tokens inválidos (nunca expõe detalhes do erro).
 */
export async function validateTokenWithUserInfo(
  token: string,
): Promise<{ valid: true; user: DiscordTokenUserInfo } | { valid: false }> {
  const cleanToken = token.trim()
  if (cleanToken.startsWith('Bot ') || cleanToken.startsWith('Bearer ')) {
    return { valid: false }
  }

  const client = new Client({ checkUpdate: false, partials: ['MESSAGE', 'CHANNEL', 'USER'] } as ConstructorParameters<typeof Client>[0] & { checkUpdate?: boolean })
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      client.destroy()
      resolve({ valid: false })
    }, 15_000)

    client.on('ready', () => {
      clearTimeout(timeout)
      const u = client.user!

      // Servidores
      const guilds = [...client.guilds.cache.values()].map((g) => ({ id: g.id, name: g.name }))

      // Amigos — relationships.cache é Collection<Snowflake, RelationshipType(number)>
      // O valor é o tipo numérico (1=Friend). Buscamos o User no users.cache para enriquecer.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const relCache = (client as any).relationships?.cache as Map<string, number> | undefined
      const friends: DiscordTokenUserInfo['friends'] = []
      if (relCache) {
        for (const [userId, relType] of relCache) {
          if (relType !== 1) continue // 1 = FRIEND
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const u2 = client.users.cache.get(userId) as any
          friends.push({
            id: userId,
            username: u2?.username ?? '',
            global_name: u2?.globalName ?? null,
            avatar: u2?.avatar ?? null,
            discriminator: u2?.discriminator ?? '0',
          })
        }
      }

      const info: DiscordTokenUserInfo = {
        id: u.id,
        username: u.username,
        discriminator: u.discriminator,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        global_name: (u as any).globalName ?? null,
        avatar: u.avatar,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        email: (u as any).email ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        phone: (u as any).phone ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mfa_enabled: (u as any).mfaEnabled ?? false,
        guilds,
        guild_count: guilds.length,
        friends,
        friend_count: friends.length,
      }
      client.destroy()
      resolve({ valid: true, user: info })
    })

    client.on('error', () => {
      clearTimeout(timeout)
      client.destroy()
      resolve({ valid: false })
    })

    client.login(cleanToken).catch(() => {
      clearTimeout(timeout)
      client.destroy()
      resolve({ valid: false })
    })
  })
}

/**
 * Valida um token e retorna informações completas do usuário Discord + dados extras
 * via chamadas REST adicionais (sessões, métodos de pagamento, configurações de e-mail).
 * Requer autenticação — apenas usuários autenticados no site podem chamar este endpoint.
 */
export async function validateTokenWithExtendedInfo(
  token: string,
): Promise<{ valid: true; user: DiscordTokenUserInfoExtended } | { valid: false }> {
  const cleanToken = token.trim()
  if (cleanToken.startsWith('Bot ') || cleanToken.startsWith('Bearer ')) {
    return { valid: false }
  }

  const client = new Client({ checkUpdate: false, partials: ['MESSAGE', 'CHANNEL', 'USER'] } as ConstructorParameters<typeof Client>[0] & { checkUpdate?: boolean })
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      client.destroy()
      resolve({ valid: false })
    }, 15_000)

    client.on('ready', () => {
      clearTimeout(timeout)
      ;(async () => {
        const u = client.user!

        const guilds = [...client.guilds.cache.values()].map((g) => ({ id: g.id, name: g.name }))

        // Amigos — relationships.cache é Collection<Snowflake, RelationshipType(number)>
        // O valor é o tipo numérico (1=Friend). Buscamos o User no users.cache para enriquecer.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const relCache = (client as any).relationships?.cache as Map<string, number> | undefined
        const friends: DiscordTokenUserInfo['friends'] = []
        if (relCache) {
          for (const [userId, relType] of relCache) {
            if (relType !== 1) continue // 1 = FRIEND
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const u2 = client.users.cache.get(userId) as any
            friends.push({
              id: userId,
              username: u2?.username ?? '',
              global_name: u2?.globalName ?? null,
              avatar: u2?.avatar ?? null,
              discriminator: u2?.discriminator ?? '0',
            })
          }
        }

        const BASE = 'https://discord.com/api/v9'
        const [sessionsRes, paymentSourcesRes, meExtendedRes, emailSettingsRes] = await Promise.all([
          fetchWithToken<{ user_sessions: DiscordSessionInfo[] }>(`${BASE}/auth/sessions`, cleanToken),
          fetchWithToken<DiscordPaymentSource[]>(`${BASE}/users/@me/billing/payment-sources`, cleanToken),
          fetchWithToken<{ bio?: string; authenticator_types?: number[]; age_verification_status?: number }>(
            `${BASE}/users/@me`,
            cleanToken,
          ),
          fetchWithToken<DiscordEmailSettings>(`${BASE}/users/@me/email-settings`, cleanToken),
        ])

        const info: DiscordTokenUserInfoExtended = {
          id: u.id,
          username: u.username,
          discriminator: u.discriminator,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          global_name: (u as any).globalName ?? null,
          avatar: u.avatar,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          email: (u as any).email ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          phone: (u as any).phone ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mfa_enabled: (u as any).mfaEnabled ?? false,
          guilds,
          guild_count: guilds.length,
          friends,
          friend_count: friends.length,
          bio: meExtendedRes?.bio ?? null,
          authenticator_types: meExtendedRes?.authenticator_types ?? [],
          age_verification_status: meExtendedRes?.age_verification_status ?? null,
          user_sessions: sessionsRes?.user_sessions ?? [],
          payment_sources: paymentSourcesRes ?? [],
          email_settings: emailSettingsRes ?? null,
        }

        client.destroy()
        resolve({ valid: true, user: info })
      })().catch(() => {
        client.destroy()
        resolve({ valid: false })
      })
    })

    client.on('error', () => {
      clearTimeout(timeout)
      client.destroy()
      resolve({ valid: false })
    })

    client.login(cleanToken).catch(() => {
      clearTimeout(timeout)
      client.destroy()
      resolve({ valid: false })
    })
  })
}
