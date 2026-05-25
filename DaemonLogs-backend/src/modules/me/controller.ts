import { FastifyRequest, FastifyReply } from 'fastify'
import { getMeService, getReferralsService, changePasswordService } from './service.js'

export async function getMeController(request: FastifyRequest, reply: FastifyReply) {
  const data = await getMeService(request.user.sub)
  return reply.send(data)
}

export async function getReferralsController(request: FastifyRequest, reply: FastifyReply) {
  const data = await getReferralsService(request.user.sub)
  return reply.send(data)
}

export async function changePasswordController(
  request: FastifyRequest<{ Body: { current_password: string; new_password: string } }>,
  reply: FastifyReply,
) {
  await changePasswordService(request.user.sub, request.body.current_password, request.body.new_password)
  return reply.send({ message: 'Senha atualizada com sucesso' })
}
