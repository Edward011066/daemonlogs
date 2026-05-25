import { Client, Guild } from 'discord.js-selfbot-v13'
import { saveServer } from '../functions/save-events.js'

/**
 * Registra todos os servidores que a conta já participa no evento `ready`.
 * Registra também o evento `guildCreate` para servidores novos enquanto conectado.
 */
export function registerGuildSyncEvents(client: Client, contaMonitoramentoId: number): void {
  // Ao conectar: salva todos os servidores do cache inicial
  client.on('ready', async () => {
    const guilds = client.guilds.cache.values()
    for (const guild of guilds) {
      try {
        await saveServer(guild.id, guild.name, contaMonitoramentoId)
      } catch (err) {
        console.error(`[GuildSync] Erro ao salvar servidor ${guild.id}:`, err)
      }
    }
    console.log(
      `[GuildSync] ${client.guilds.cache.size} servidor(es) sincronizado(s) para conta #${contaMonitoramentoId}`
    )
  })

  // Quando a conta entra em um servidor novo enquanto já está conectada
  client.on('guildCreate', async (guild: Guild) => {
    try {
      await saveServer(guild.id, guild.name, contaMonitoramentoId)
      console.log(`[GuildSync] Novo servidor salvo: ${guild.name} (${guild.id})`)
    } catch (err) {
      console.error(`[GuildSync] Erro ao salvar novo servidor ${guild.id}:`, err)
    }
  })

  // Quando o nome do servidor muda, atualiza no banco
  client.on('guildUpdate', async (_old: Guild, newGuild: Guild) => {
    try {
      await saveServer(newGuild.id, newGuild.name, contaMonitoramentoId)
    } catch (err) {
      console.error(`[GuildSync] Erro ao atualizar servidor ${newGuild.id}:`, err)
    }
  })
}
