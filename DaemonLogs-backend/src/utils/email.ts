import { createTransport } from 'nodemailer'

function createTransporter() {
  return createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  })
}

export async function sendActivationEmail(to: string, code: string): Promise<void> {
  if (process.env.EMAIL_ENABLED === 'false') return

  const ttlMinutes = Number(process.env.ACTIVATION_CODE_TTL_MINUTES ?? 60)
  const from = process.env.SMTP_FROM ?? `noreply@${process.env.SMTP_HOST}`
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'

  await createTransporter().sendMail({
    from,
    to,
    subject: 'Ative sua conta',
    html: `
      <h2>Ative sua conta</h2>
      <p>Use o código abaixo para ativar sua conta. Ele expira em <strong>${ttlMinutes} minutos</strong>.</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:bold;background:#f4f4f4;padding:16px;border-radius:8px;">${code}</p>
      <p>Ou clique no link abaixo:</p>
      <a href="${appUrl}/auth/activate?code=${code}" style="display:inline-block;padding:12px 24px;background:#5865F2;color:#fff;border-radius:6px;text-decoration:none;">Ativar conta</a>
      <p style="color:#999;font-size:12px;margin-top:24px;">Se você não criou essa conta, ignore este email.</p>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  if (process.env.EMAIL_ENABLED === 'false') return

  const ttlMinutes = Number(process.env.ACTIVATION_CODE_TTL_MINUTES ?? 60)
  const from = process.env.SMTP_FROM ?? `noreply@${process.env.SMTP_HOST}`

  await createTransporter().sendMail({
    from,
    to,
    subject: 'Redefinição de senha',
    html: `
      <h2>Redefinição de senha</h2>
      <p>Use o código abaixo para redefinir sua senha. Ele expira em <strong>${ttlMinutes} minutos</strong>.</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:bold;background:#f4f4f4;padding:16px;border-radius:8px;">${code}</p>
      <p style="color:#999;font-size:12px;margin-top:24px;">Se você não solicitou a redefinição, ignore este email.</p>
    `,
  })
}
