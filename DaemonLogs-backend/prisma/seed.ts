import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('teste123', 12)

  const usuario = await prisma.usuarios.upsert({
    where: { email: 'teste@daemonlogs.com' },
    update: {},
    create: {
      username: 'teste',
      email: 'teste@daemonlogs.com',
      password: passwordHash,
      is_activated: true,
      is_admin: false,
      is_premium: false,
      referral_code: 'TESTE0001',
    },
  })

  console.log(`Usuário seed criado: ${usuario.username} (id: ${usuario.id})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
