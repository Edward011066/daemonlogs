import prisma from '../../plugins/prisma.js'

/**
 * Retorna os discord_user_ids de todos os alvos cadastrados no sistema.
 * Usado pelos event handlers para filtrar eventos.
 */
export async function getAllTargetIds(): Promise<Set<string>> {
  const targets = await prisma.contas_alvos.findMany({
    select: { discord_user_id: true },
  })
  return new Set(targets.map((t: { discord_user_id: string }) => t.discord_user_id))
}

/**
 * Retorna o id interno (PK) do alvo pelo discord_user_id.
 */
export async function getTargetInternalId(discordUserId: string): Promise<number | null> {
  const target = await prisma.contas_alvos.findFirst({
    where: { discord_user_id: discordUserId },
    select: { id: true },
  })
  return target?.id ?? null
}

/**
 * Verifica se um usuário Discord é alvo monitorado.
 */
export async function isTargetUser(discordUserId: string): Promise<boolean> {
  const count = await prisma.contas_alvos.count({
    where: { discord_user_id: discordUserId },
  })
  return count > 0
}
