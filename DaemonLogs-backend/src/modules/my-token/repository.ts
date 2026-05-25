import prisma from '../../plugins/prisma.js'

export async function findMyTokenByUser(usuarioId: number) {
  return prisma.my_tokens.findUnique({ where: { usuario_id: usuarioId } })
}

export async function createMyToken(data: { token: string; usuario_id: number; is_valid: boolean }) {
  return prisma.my_tokens.create({ data })
}

export async function deleteMyToken(usuarioId: number) {
  return prisma.my_tokens.delete({ where: { usuario_id: usuarioId } })
}

export async function updateMyToken(usuarioId: number, data: { token: string; is_valid: boolean }) {
  return prisma.my_tokens.update({ where: { usuario_id: usuarioId }, data })
}
