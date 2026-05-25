import { PLAN_RULES } from '../../config/plan-rules.js'

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Gerencia o delay adaptativo entre exclusões de mensagens.
 * Implementa aumentos monotônicos com decaimento de meia-vida de volta à linha de base.
 */
export class AdaptiveDelay {
  private current: number
  private readonly base: number
  private bumpedAt = 0

  constructor(baseMs: number) {
    this.base = baseMs
    this.current = baseMs
  }

  /** Aumenta o delay após um rate limit (monotônico) */
  bump(retryAfterMs = 0): void {
    this.bumpedAt = Date.now()
    this.current = Math.min(30_000, Math.max(this.current * 2, retryAfterMs + 500))
  }

  /** Retorna delay atual com decaimento de meia-vida (30s) de volta à base */
  get(): number {
    if (this.current > this.base && this.bumpedAt > 0) {
      const elapsed = Date.now() - this.bumpedAt
      const factor = Math.pow(0.5, elapsed / 30_000)
      this.current = Math.max(this.base, this.base + (this.current - this.base) * factor)
    }
    return Math.ceil(this.current)
  }
}

export interface DeleteChannelOpts {
  selfId: string
  authorIds: string[]
  minId?: string
  maxId?: string
  controller: AbortController
  delay: AdaptiveDelay
  /** Referência mutável da quota compartilhada. null = ilimitado. */
  remaining: { value: number | null }
}

/**
 * Exclui mensagens em um canal do Discord de forma paginada.
 * Percorre do mais recente para o mais antigo usando o parâmetro `before`.
 * Respeita rate limits do Discord com retry automático e backoff exponencial.
 * Retorna o número de mensagens efetivamente excluídas.
 */
export async function deleteMessagesInChannel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel: any,
  opts: DeleteChannelOpts,
): Promise<number> {
  let deleted = 0
  let before: string | undefined = opts.maxId
  const targetAuthors = opts.authorIds.length > 0 ? opts.authorIds : [opts.selfId]
  const searchDelay = PLAN_RULES.clear_chat.search_delay_ms

  outer: while (!opts.controller.signal.aborted) {
    if (opts.remaining.value !== null && opts.remaining.value <= 0) break

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchOpts: Record<string, any> = { limit: 100 }
    if (before) fetchOpts.before = before

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messages: any
    try {
      messages = await channel.messages.fetch(fetchOpts)
    } catch {
      break // sem permissão ou canal inacessível — pular silenciosamente
    }

    if (messages.size === 0) break

    // Ordenar do mais novo para o mais antigo (maior snowflake = mais novo)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sorted: any[] = [...messages.values()].sort((a: any, b: any) =>
      BigInt(b.id) > BigInt(a.id) ? 1 : BigInt(b.id) < BigInt(a.id) ? -1 : 0,
    )

    before = sorted.at(-1)?.id // mais antigo do batch → próximo cursor

    for (const message of sorted) {
      if (opts.controller.signal.aborted) break outer
      if (opts.remaining.value !== null && opts.remaining.value <= 0) break outer

      // Limite inferior: parar se chegou antes do min_id
      if (opts.minId && BigInt(message.id) <= BigInt(opts.minId)) {
        before = undefined
        break outer
      }

      // Filtro de autor
      if (!targetAuthors.includes(message.author?.id ?? '')) continue

      // Excluir com retry automático
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await message.delete()
          deleted++
          if (opts.remaining.value !== null) opts.remaining.value--
          await sleep(opts.delay.get())
          break
        } catch (err: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e = err as any
          if (e?.code === 10008 || e?.code === 50013) break // já deletado / sem permissão
          if (e?.httpStatus === 429) {
            opts.delay.bump((e?.retryAfter ?? 1) * 1000)
            await sleep(opts.delay.get())
          } else if ((e?.httpStatus ?? 0) >= 500) {
            // HTTP 5xx — retry com backoff linear
            await sleep(2_000 * (attempt + 1))
          } else {
            break // outro erro → pular mensagem
          }
        }
      }
    }

    if (!before) break
    await sleep(searchDelay)
  }

  return deleted
}
