import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import prisma from './prisma.js'

export default fp(async function authPlugin(fastify: FastifyInstance) {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) throw new Error('JWT_SECRET não definido nas variáveis de ambiente')

  await fastify.register(fastifyJwt, { secret: jwtSecret })

  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()

      const { sub, ip } = request.user
      const clientIp = request.ip

      // Sessões Discord OAuth usam sentinel 'discord_oauth' — pular verificação de IP
      if (ip !== 'discord_oauth' && ip !== clientIp) {
        return reply.code(401).send({ error: 'IP_MISMATCH', message: 'Sessão inválida para este IP' })
      }

      const session = await prisma.sessions.findFirst({
        where: {
          usuario_id: sub,
          expires_at: { gt: new Date() },
        },
      })

      if (!session) {
        return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Sessão expirada ou inválida' })
      }

      const dbUser = await prisma.usuarios.findUnique({
        where: { id: sub },
        select: { is_admin: true },
      })

      request.user = { sub, ip, is_admin: dbUser?.is_admin ?? false }
    } catch {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Token inválido' })
    }
  })
})
