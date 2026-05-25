import { Client, VoiceState, VoiceChannel } from 'discord.js-selfbot-v13'
import { isTargetUser } from '../functions/target-utils.js'
import { saveEvent } from '../functions/save-events.js'

function getMembersInChannel(state: VoiceState): Array<{ username: string; discord_user_id: string }> {
  if (!state.channel) return []
  const channel = state.channel as VoiceChannel
  return channel.members.map((member) => ({
    username: member.user.username,
    discord_user_id: member.user.id,
  }))
}

export function registerVoiceStateUpdateEvent(client: Client): void {
  client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
    try {
      const userId = newState.member?.user.id ?? oldState.member?.user.id
      if (!userId) return

      const isTarget = await isTargetUser(userId)
      if (!isTarget) return

      const canalAnterior = oldState.channel as VoiceChannel | null
      const canalNovo = newState.channel as VoiceChannel | null
      const guildId = newState.guild.id
      const guildName = newState.guild.name
      const timestamp = new Date().toISOString()

      let tipo: string
      let key: string
      let dados: object

      if (!canalAnterior && canalNovo) {
        // Entrou em canal de voz
        tipo = 'VOICE_JOIN'
        key = `${userId}:VOICE_JOIN:${canalNovo.id}:${Date.now()}`
        dados = {
          canal_novo_id: canalNovo.id,
          canal_novo_nome: canalNovo.name,
          guild_id: guildId,
          guild_name: guildName,
          usuarios_presentes: getMembersInChannel(newState),
          timestamp,
        }
      } else if (canalAnterior && !canalNovo) {
        // Saiu de canal de voz
        tipo = 'VOICE_LEAVE'
        key = `${userId}:VOICE_LEAVE:${canalAnterior.id}:${Date.now()}`
        dados = {
          canal_anterior_id: canalAnterior.id,
          canal_anterior_nome: canalAnterior.name,
          guild_id: guildId,
          guild_name: guildName,
          usuarios_que_ficaram: getMembersInChannel(oldState),
          timestamp,
        }
      } else if (canalAnterior && canalNovo && canalAnterior.id !== canalNovo.id) {
        // Trocou de canal
        tipo = 'VOICE_SWITCH'
        key = `${userId}:VOICE_SWITCH:${canalAnterior.id}:${canalNovo.id}:${Date.now()}`
        dados = {
          canal_anterior_id: canalAnterior.id,
          canal_anterior_nome: canalAnterior.name,
          canal_novo_id: canalNovo.id,
          canal_novo_nome: canalNovo.name,
          guild_id: guildId,
          guild_name: guildName,
          usuarios_canal_anterior: getMembersInChannel(oldState),
          usuarios_canal_novo: getMembersInChannel(newState),
          timestamp,
        }
      } else {
        return // mute/unmute/deafen — ignorar
      }

      await saveEvent({ tipo, dados, idempotency_key: key, discord_user_id: userId })
    } catch (err) {
      console.error('[voiceStateUpdate] Erro:', err)
    }
  })
}
