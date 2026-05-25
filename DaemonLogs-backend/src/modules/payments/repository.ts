import prisma from '../../plugins/prisma.js'

export async function createPagamento(data: {
  correlation_id: string
  usuario_id: number
  valor_centavos: number
  status: string
  brcode?: string
  qrcode_image?: string
  charge_expires_at?: Date
  woovi_charge_id?: string
}) {
  return prisma.pagamentos.create({ data })
}

export async function findPagamentoByCorrelationId(correlationId: string) {
  return prisma.pagamentos.findUnique({ where: { correlation_id: correlationId } })
}

export async function findActivePagamentoByUser(usuarioId: number) {
  return prisma.pagamentos.findFirst({
    where: {
      usuario_id: usuarioId,
      status: 'ACTIVE',
      charge_expires_at: { gt: new Date() },
    },
    orderBy: { created_at: 'desc' },
  })
}

export async function findPagamentosByUser(usuarioId: number) {
  return prisma.pagamentos.findMany({
    where: { usuario_id: usuarioId },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      correlation_id: true,
      valor_centavos: true,
      status: true,
      premium_expires_at: true,
      created_at: true,
    },
  })
}

export async function updatePagamentoStatus(id: number, status: string, premiumExpiresAt?: Date) {
  return prisma.pagamentos.update({
    where: { id },
    data: { status, ...(premiumExpiresAt ? { premium_expires_at: premiumExpiresAt } : {}) },
  })
}

