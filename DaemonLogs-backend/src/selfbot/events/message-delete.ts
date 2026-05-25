import { Client, Message } from 'discord.js-selfbot-v13'
import { isTargetUser } from '../functions/target-utils.js'
import { saveEvent } from '../functions/save-events.js'

export function registerMessageDeleteEvent(client: Client): void {
  client.on('messageDelete', async (message) => {
    try {
      if (!message.id) return
      const author = message.author
      if (!author || author.bot) return

      const isTarget = await isTargetUser(author.id)
      if (!isTarget) return

      const guildId = message.guild?.id
      const guildName = message.guild?.name
      const channelId = message.channel?.id
      const channelName =
        message.channel && 'name' in message.channel
          ? (message.channel as { name: string }).name
          : 'DM'

      const key = `${message.id}:MESSAGE_DELETE`

      await saveEvent({
        tipo: 'MESSAGE_DELETE',
        dados: {
          message_id: message.id,
          channel_id: channelId,
          channel_name: channelName,
          guild_id: guildId,
          guild_name: guildName,
          conteudo: message.content ?? '[não disponível no cache]',
          timestamp: new Date().toISOString(),
        },
        idempotency_key: key,
        discord_user_id: author.id,
      })
    } catch (err) {
      console.error('[messageDelete] Erro:', err)
    }
  })
}
