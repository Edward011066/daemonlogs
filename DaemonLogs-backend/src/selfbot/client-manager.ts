import { Client } from 'discord.js-selfbot-v13'
import { registerAllEvents } from './events/index'
import { registerGuildSyncEvents } from './events/guild-sync.js'
import prisma from '../plugins/prisma.js'

const clients = new Map<string, Client>()

export function getClient(token: string): Client | undefined {
  return clients.get(token)
}

export function getAllClients(): Map<string, Client> {
  return clients
}

export async function createClient(token: string, contaMonitoramentoId?: number): Promise<Client> {
  if (clients.has(token)) return clients.get(token)!

  // partials são obrigatórios para receber eventos de objetos não cacheados:
  // - MESSAGE: mensagens deletadas/editadas que não estão no cache
  // - CHANNEL: canais não carregados (DMs, threads)
  // - GUILD_MEMBER: membros não cacheados em servidores grandes
  // - USER: usuários não cacheados
  // - REACTION: reações em mensagens não cacheadas
  const client = new Client({
    checkUpdate: false,
    partials: ['MESSAGE', 'CHANNEL', 'GUILD_MEMBER', 'USER', 'REACTION'],
  } as ConstructorParameters<typeof Client>[0] & { checkUpdate?: boolean })

  client.on('error', (err) => {
    console.error(`[ClientManager] Erro no cliente ${token.slice(0, 10)}...:`, err.message)
  })

  registerAllEvents(client)

  // Busca o id da conta de monitoramento no banco (necessário para salvar servidores)
  let monitoringId = contaMonitoramentoId
  if (!monitoringId) {
    const conta = await prisma.contas_monitoramento.findFirst({
      where: { token },
      select: { id: true },
    })
    monitoringId = conta?.id
  }

  if (monitoringId) {
    registerGuildSyncEvents(client, monitoringId)
  }

  await client.login(token)
  clients.set(token, client)

  console.log(`[ClientManager] Cliente conectado: ${client.user?.tag}`)
  return client
}

export async function destroyClient(token: string): Promise<void> {
  const client = clients.get(token)
  if (client) {
    client.destroy()
    clients.delete(token)
    console.log(`[ClientManager] Cliente desconectado: ${token.slice(0, 10)}...`)
  }
}

export async function startAllValidClients(tokens: { id: number; token: string }[]): Promise<void> {
  for (const { id, token } of tokens) {
    try {
      await createClient(token, id)
    } catch (err) {
      console.error(`[ClientManager] Falha ao conectar token ${token.slice(0, 10)}...:`, err)
    }
  }
}
