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

      // Amigos (tipo 1 = amigo no discord.js-selfbot-v13)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const relationshipsCache = (client as any).relationships?.cache as Map<string, any> | undefined
      const friends: DiscordTokenUserInfo['friends'] = []
      if (relationshipsCache) {
        for (const [, rel] of relationshipsCache) {
          // type 1 = Friend
          if (rel.type !== 1) continue
          const fu = rel.user ?? rel
          friends.push({
            id: String(fu.id ?? ''),
            username: fu.username ?? '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            global_name: (fu as any).globalName ?? null,
            avatar: fu.avatar ?? null,
            discriminator: fu.discriminator ?? '0',
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
