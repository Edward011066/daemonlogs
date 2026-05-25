import { getAllClients } from '../client-manager.js'

export interface DiscordUserInfo {
  id: string
  username: string
  username_global: string | null
  avatar: string | null
}

/**
 * Tenta buscar informações de um usuário Discord via qualquer cliente selfbot ativo.
 * Retorna null se nenhum cliente estiver disponível ou se o usuário não for encontrado.
 */
export async function fetchDiscordUser(discordUserId: string): Promise<DiscordUserInfo | null> {
  const clients = getAllClients()

  for (const client of clients.values()) {
    try {
      const user = await client.users.fetch(discordUserId)
      return {
        id: user.id,
        username: user.username,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        username_global: (user as any).globalName ?? null,
        avatar: user.avatar,
      }
    } catch {
      continue
    }
  }

  return null
}
