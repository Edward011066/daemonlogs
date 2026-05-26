import { buildApp } from './app.js'
import prisma from './plugins/prisma.js'
import { findAllValidTokens } from './modules/monitoring/repository.js'
import { startAllValidClients } from './selfbot/client-manager.js'
import { checkAllUsersServerCountPremium } from './modules/plans/service.js'

const PORT = Number(process.env.PORT) || 3000

// Valida que apenas 1 gateway de pagamento está ativo.
// "Ativo" = credenciais preenchidas no .env. Se ambos estiverem configurados, o sistema não pode
// determinar qual usar e aborta com mensagem clara para o operador.
function assertSinglePaymentGateway() {
  const wooviActive = !!process.env.WOOVI_API_KEY?.trim()
  const misticpayActive = !!(process.env.MISTICPAY_CI?.trim() && process.env.MISTICPAY_CS?.trim())
  if (wooviActive && misticpayActive) {
    console.error('ATENÇÃO: CONFLITO DE GATEWAYS, VOCÊ TEM MAIS DE 1 GATEWAY ATIVO.')
    process.exit(1)
  }
}

async function main() {
  assertSinglePaymentGateway()

  const app = await buildApp()

  // Startup da API — falha aqui é fatal
  try {
    await prisma.$connect()
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`🚀 API rodando em http://0.0.0.0:${PORT}`)
    console.log(`📖 Swagger disponível em http://localhost:${PORT}/api-docs`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  // Startup do selfbot — falha aqui é recuperável; API continua funcionando
  try {
    const validTokens = await findAllValidTokens()
    if (validTokens.length > 0) {
      console.log(`[Selfbot] Iniciando ${validTokens.length} cliente(s) de monitoramento...`)
      await startAllValidClients(validTokens)
    } else {
      console.log('[Selfbot] Nenhum token válido encontrado. Adicione tokens via API.')
    }
  } catch (err) {
    console.error('[Selfbot] Falha ao iniciar clientes selfbot (DB indisponível?). API continua funcionando.', err)
  }

  // Verificação periódica de premium por servidores únicos
  const ONE_DAY_MS = 24 * 60 * 60 * 1000
  void checkAllUsersServerCountPremium()
  setInterval(() => void checkAllUsersServerCountPremium(), ONE_DAY_MS)
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Encerrando...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

// Impede que erros de DB no selfbot (P1001, P1002) derrubem o processo inteiro.
// Os event handlers já logam o erro individualmente — aqui só garantimos sobrevivência.
process.on('unhandledRejection', (reason) => {
  console.error('[Server] unhandledRejection capturada — processo mantido:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[Server] uncaughtException capturada — processo mantido:', err.message)
})

main()
