import { Client, Message } from 'discord.js-selfbot-v13'
import { isTargetUser } from '../functions/target-utils.js'
import { saveMessage, saveEvent } from '../functions/save-events.js'

export function registerMessageCreateEvent(client: Client): void {
  client.on('messageCreate', async (message: Message) => {
    try {
      // message.partial = true quando a mensagem não estava no cache (precisamos de partials no Client)
      // message.author.bot filtra bots oficiais — contas de usuário alvo têm bot: false
      if (!message.author || message.partial) return
      if (message.author.bot) return
      if (!message.guild) return // ignorar DMs — monitorar apenas servidores (guilds)

      const isTarget = await isTargetUser(message.author.id)
      if (!isTarget) return

      const guildId = message.guild?.id
      const guildName = message.guild?.name
      const channelId = message.channel.id
      const channelName = 'name' in message.channel ? (message.channel as { name: string }).name : 'DM'
      const link = guildId ? `https://discord.com/channels/${guildId}/${channelId}/${message.id}` : undefined

      await saveMessage({
        message_id: message.id,
        conteudo: message.content,
        guild_id: guildId,
        guild_name: guildName,
        channel_id: channelId,
        channel_name: channelName,
        link_mensagem: link,
        discord_user_id: message.author.id,
      })

      // Verifica menções ao alvo
      for (const mentioned of message.mentions.users.values()) {
        const mentionedIsTarget = await isTargetUser(mentioned.id)
        if (!mentionedIsTarget) continue

        const key = `${message.id}:MENTION:${mentioned.id}`
        await saveEvent({
          tipo: 'MENTION',
          dados: {
            quem_mencionou_id: message.author.id,
            quem_mencionou_username: message.author.username,
            message_id: message.id,
            channel_id: channelId,
            channel_name: channelName,
            guild_id: guildId,
            guild_name: guildName,
            conteudo: message.content,
            timestamp: new Date().toISOString(),
          },
          idempotency_key: key,
          discord_user_id: mentioned.id,
        })
      }
    } catch (err) {
      console.error('[messageCreate] Erro:', err)
    }
  })
}
