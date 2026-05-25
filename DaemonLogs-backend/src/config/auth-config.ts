/**
 * Configurações de autenticação não-críticas.
 *
 * Valores críticos de segurança (JWT_SECRET, DISCORD_CLIENT_SECRET) NÃO ficam aqui —
 * são acessados diretamente via process.env nos services que os utilizam.
 *
 * AUTH_MODE:
 *   'local'   → registro/login com username+password+email (padrão)
 *   'discord' → OAuth2 Discord, sem SMTP necessário
 */

export type AuthMode = 'local' | 'discord'

export const AUTH_CONFIG = {
  /**
   * Modo de autenticação ativo. Controlado por AUTH_MODE no .env.
   * Quando 'discord': rotas locais (/register, /login, /activate, etc.) retornam 400.
   * Quando 'local': rotas OAuth2 Discord não são registradas no Fastify.
   */
  mode: (process.env.AUTH_MODE ?? 'local') as AuthMode,

  /**
   * TTL da sessão JWT. Hardcoded em 24h — altere aqui se necessário.
   * Mantido fora do .env pois é uma constante de segurança, não de operação.
   */
  session_ttl_ms: 24 * 60 * 60 * 1000,

  /**
   * Rounds do bcrypt para hash de passwords.
   * Valor 12 é o mínimo recomendado. Não reduzir abaixo de 10.
   */
  salt_rounds: 12,

  /**
   * Configurações do OAuth2 Discord.
   * Só relevante quando AUTH_MODE=discord.
   */
  discord: {
    client_id: process.env.DISCORD_CLIENT_ID ?? '',
    redirect_uri: process.env.DISCORD_REDIRECT_URI ?? 'http://localhost:3000/auth/discord/callback',
    /**
     * Scopes solicitados ao Discord.
     * 'identify' → acesso ao perfil (id, username, avatar)
     * 'email'    → acesso ao email do usuário (pode ser null se não verificado)
     * Nunca solicitar scopes além destes dois.
     */
    scopes: ['identify', 'email'] as const,
    /**
     * URL do frontend para onde redirecionar após autenticação bem-sucedida.
     * O JWT é enviado como query param: ?token=<jwt>
     */
    frontend_redirect: process.env.DISCORD_OAUTH_FRONTEND_REDIRECT ?? 'http://localhost:5173',
    /**
     * TTL do cookie de state CSRF gerado em GET /auth/discord.
     * 10 minutos é suficiente para o usuário autorizar no Discord.
     */
    state_ttl_ms: 10 * 60 * 1000,
  },
} as const
