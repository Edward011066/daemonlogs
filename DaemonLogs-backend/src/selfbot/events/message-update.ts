import { Client, Message } from 'discord.js-selfbot-v13'
import { isTargetUser } from '../functions/target-utils.js'
import { saveEvent } from '../functions/save-events.js'

export function registerMessageUpdateEvent(client: Client): void {
  client.on('messageUpdate', async (oldMessage, newMessage) => {
    try {
      const author = newMessage.author ?? oldMessage.author
      if (!author || author.bot) return
      if (!newMessage.id) return
      // Se a mensagem nova não tem conteúdo e é parcial, não temos o texto anterior — apenas logamos o evento sem conteúdo

      const isTarget = await isTargetUser(author.id)
      if (!isTarget) return

      const conteudoAnterior = oldMessage.content ?? '[não disponível no cache]'
      const conteudoNovo = newMessage.content ?? '[não disponível]'

      if (conteudoAnterior === conteudoNovo) return

      const guildId = newMessage.guild?.id ?? oldMessage.guild?.id
      const guildName = newMessage.guild?.name ?? oldMessage.guild?.name
      const channelId = newMessage.channel?.id ?? oldMessage.channel?.id
      const channelName =
        newMessage.channel && 'name' in newMessage.channel
          ? (newMessage.channel as { name: string }).name
          : 'DM'

      const key = `${newMessage.id}:MESSAGE_EDIT:${Date.now()}`

      await saveEvent({
        tipo: 'MESSAGE_EDIT',
        dados: {
          message_id: newMessage.id,
          channel_id: channelId,
          channel_name: channelName,
          guild_id: guildId,
          guild_name: guildName,
          conteudo_anterior: conteudoAnterior,
          conteudo_novo: conteudoNovo,
          timestamp: new Date().toISOString(),
        },
        idempotency_key: key,
        discord_user_id: author.id,
      })
    } catch (err) {
      console.error('[messageUpdate] Erro:', err)
    }
  })
}
