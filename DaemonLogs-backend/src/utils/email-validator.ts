export function validateEmailDomain(email: string): { valid: boolean; reason?: string } {
  if (process.env.EMAIL_ENABLED === 'false') return { valid: true }

  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return { valid: false, reason: 'Email inválido' }

  const blocked = (
    process.env.BLOCKED_EMAIL_DOMAINS ??
    '10minutemail.com,guerrillamail.com,temp-mail.org,mailinator.com,firemail.com.br,throwam.com,yopmail.com,dispostable.com'
  )
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)

  if (blocked.some((b) => domain === b || domain.endsWith(`.${b}`))) {
    return { valid: false, reason: 'Domínios de email temporário não são permitidos' }
  }

  const allowed = (process.env.ALLOWED_EMAIL_DOMAINS ?? 'gmail.com,outlook.com,hotmail.com,yahoo.com')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)

  if (!allowed.includes(domain)) {
    return {
      valid: false,
      reason: `Domínio não permitido. Use um email de: ${allowed.join(', ')}`,
    }
  }

  return { valid: true }
}
