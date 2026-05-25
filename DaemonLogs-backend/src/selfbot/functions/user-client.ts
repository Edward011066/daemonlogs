import { Client } from 'discord.js-selfbot-v13'
import { AppError } from '../../utils/app-error.js'

/**
 * Cria um cliente selfbot temporário com o token pessoal do usuário.
 * NÃO registra event handlers — destruir SEMPRE no bloco finally após uso.
 */
export async function createUserClient(token: string): Promise<Client> {
  const client = new Client({
    checkUpdate: false,
    partials: ['MESSAGE', 'CHANNEL', 'USER'],
  } as ConstructorParameters<typeof Client>[0] & { checkUpdate?: boolean })

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.destroy()
      reject(new AppError(422, 'INVALID_TOKEN', 'Token Discord inválido ou expirado'))
    }, 15_000)

    client.on('ready', () => {
      clearTimeout(timeout)
      resolve()
    })

    client.on('error', (err) => {
      clearTimeout(timeout)
      client.destroy()
      reject(new AppError(422, 'INVALID_TOKEN', `Erro ao conectar com token: ${err.message}`))
    })

    client.login(token).catch(() => {
      clearTimeout(timeout)
      client.destroy()
      reject(new AppError(422, 'INVALID_TOKEN', 'Token Discord inválido ou expirado'))
    })
  })

  return client
}

export function destroyUserClient(client: Client): void {
  client.destroy()
}
