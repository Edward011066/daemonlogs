import prisma from '../../plugins/prisma.js'
import { getTargetInternalId } from './target-utils.js'

export interface SaveMessageInput {
  message_id: string
  conteudo: string
  guild_id?: string
  guild_name?: string
  channel_id?: string
  channel_name?: string
  link_mensagem?: string
  discord_user_id: string
}

export interface SaveEventInput {
  tipo: string
  dados: object
  idempotency_key: string
  discord_user_id: string
}

/**
 * Salva uma mensagem capturada no banco, com deduplicação por message_id.
 */
export async function saveMessage(input: SaveMessageInput): Promise<void> {
  const contaAlvoId = await getTargetInternalId(input.discord_user_id)
  if (!contaAlvoId) return

  await prisma.mensagens_salvas.upsert({
    where: { message_id: input.message_id },
    create: {
      message_id: input.message_id,
      conteudo: input.conteudo,
      guild_id: input.guild_id,
      guild_name: input.guild_name,
      channel_id: input.channel_id,
      channel_name: input.channel_name,
      link_mensagem: input.link_mensagem,
      conta_alvo_id: contaAlvoId,
    },
    update: {},
  })
}

/**
 * Salva um evento de monitoramento com deduplicação por idempotency_key.
 */
export async function saveEvent(input: SaveEventInput): Promise<void> {
  const contaAlvoId = await getTargetInternalId(input.discord_user_id)
  if (!contaAlvoId) return

  await prisma.eventos_monitoramento.upsert({
    where: { idempotency_key: input.idempotency_key },
    create: {
      tipo: input.tipo,
      dados: input.dados,
      idempotency_key: input.idempotency_key,
      conta_alvo_id: contaAlvoId,
    },
    update: {},
  })
}

/**
 * Salva ou atualiza servidor descoberto por uma conta de monitoramento.
 */
export async function saveServer(
  guildId: string,
  guildName: string,
  contaMonitoramentoId: number
): Promise<void> {
  await prisma.servidores.upsert({
    where: { guild_id_conta_monitoramento_id: { guild_id: guildId, conta_monitoramento_id: contaMonitoramentoId } },
    create: { guild_id: guildId, server_name: guildName, conta_monitoramento_id: contaMonitoramentoId },
    update: { server_name: guildName },
  })
}
