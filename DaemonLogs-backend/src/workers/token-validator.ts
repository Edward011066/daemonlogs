/**
 * Worker: Token Validator
 *
 * Roda como processo Node.js independente (sem Fastify) em container separado.
 * A cada TOKEN_CHECK_INTERVAL_HOURS horas, verifica todos os tokens
 * is_valid=true do contas_monitoramento. Tokens que ficaram inválidos têm:
 *   1. is_valid atualizado para false no banco
 *   2. Cliente selfbot removido da memória da API via endpoint interno
 */
import prisma from '../plugins/prisma.js'
import { validateToken } from '../selfbot/functions/validate-token.js'
import { updateMonitoringValidity } from '../modules/monitoring/repository.js'

const INTERVAL_MS = Number(process.env.TOKEN_CHECK_INTERVAL_HOURS ?? 6) * 60 * 60 * 1000
const DELAY_MS = Number(process.env.TOKEN_CHECK_DELAY_MS ?? 5000)
const API_URL = (process.env.API_INTERNAL_URL ?? 'http://api:3000').replace(/\/$/, '')
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForDB(): Promise<void> {
  const maxRetries = 10
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      return
    } catch {
      console.log(`[token-validator] Aguardando banco de dados... (tentativa ${i + 1}/${maxRetries})`)
      await sleep(5000)
    }
  }
  throw new Error('[token-validator] Não foi possível conectar ao banco de dados após 10 tentativas')
}

async function notifyAPIDestroyClient(id: number): Promise<void> {
  if (!INTERNAL_SECRET) {
    console.warn('[token-validator] INTERNAL_SECRET não configurado — cliente selfbot não será destruído via API')
    return
  }
  try {
    const res = await fetch(`${API_URL}/internal/destroy-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': INTERNAL_SECRET,
      },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      console.warn(`[token-validator] API retornou HTTP ${res.status} ao destruir cliente id=${id}`)
    }
  } catch (err) {
    // API pode estar temporariamente indisponível — não bloqueia o ciclo
    console.warn(`[token-validator] Falha ao notificar API para id=${id}:`, err)
  }
}

async function runCheckCycle(): Promise<void> {
  const tokens = await prisma.contas_monitoramento.findMany({
    where: { is_valid: true },
    select: { id: true, token: true },
  })

  if (tokens.length === 0) {
    console.log('[token-validator] Nenhum token ativo para verificar')
    return
  }

  console.log(`[token-validator] Ciclo iniciado: ${tokens.length} token(s) para verificar`)
  let invalidated = 0

  for (let i = 0; i < tokens.length; i++) {
    const account = tokens[i]
    try {
      const valid = await validateToken(account.token)
      if (!valid) {
        await updateMonitoringValidity(account.id, false)
        await notifyAPIDestroyClient(account.id)
        console.log(`[token-validator] Token id=${account.id} invalidado`)
        invalidated++
      }
    } catch (err) {
      console.error(`[token-validator] Erro ao verificar token id=${account.id}:`, err)
    }

    // delay entre tokens para evitar rate limit do Discord (pula o delay após o último)
    if (i < tokens.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  console.log(`[token-validator] Ciclo concluído — ${invalidated} invalidado(s) de ${tokens.length}`)
}

async function main(): Promise<void> {
  console.log('[token-validator] Worker iniciando...')
  console.log(`[token-validator] Intervalo: ${process.env.TOKEN_CHECK_INTERVAL_HOURS ?? 6}h | Delay entre tokens: ${DELAY_MS}ms`)

  await waitForDB()
  console.log('[token-validator] Banco de dados conectado')

  // Roda imediatamente ao iniciar, depois em loop
  while (true) {
    try {
      await runCheckCycle()
    } catch (err) {
      console.error('[token-validator] Erro inesperado no ciclo:', err)
    }

    const nextHours = process.env.TOKEN_CHECK_INTERVAL_HOURS ?? 6
    console.log(`[token-validator] Próximo ciclo em ${nextHours}h`)
    await sleep(INTERVAL_MS)
  }
}

main().catch((err) => {
  console.error('[token-validator] Erro fatal:', err)
  process.exit(1)
})
