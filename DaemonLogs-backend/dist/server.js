import {
  activateUsuario,
  createEmailVerification,
  createPasswordReset,
  createSession,
  createUsuario,
  deleteAllSessionsForUser,
  deleteOldPasswordResetsForUser,
  deleteOldVerificationsForUser,
  deleteSession,
  findActiveSession,
  findEmailVerification,
  findPasswordReset,
  findUsuarioByEmail,
  findUsuarioByReferralCode,
  findUsuarioByUsername,
  incrementReferralCount,
  markEmailVerificationUsed,
  markPasswordResetUsed,
  prisma_default,
  updateUserPassword,
  upsertUsuarioByDiscordId
} from "./chunk-2TR5OHLJ.js";

// src/app.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";

// src/utils/app-error.ts
var AppError = class extends Error {
  constructor(statusCode, code, message, meta) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.meta = meta;
    this.name = "AppError";
  }
  statusCode;
  code;
  meta;
};

// src/plugins/swagger.ts
import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
var swagger_default = fp(async function swaggerPlugin(fastify) {
  await fastify.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "DaemonLogs",
        description: "API de monitoramento de contas Discord",
        version: "1.0.0"
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    }
  });
  await fastify.register(swaggerUi, {
    routePrefix: "/api-docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false
    }
  });
});

// src/plugins/auth.ts
import fp2 from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
var auth_default = fp2(async function authPlugin(fastify) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET n\xE3o definido nas vari\xE1veis de ambiente");
  await fastify.register(fastifyJwt, { secret: jwtSecret });
  fastify.decorate("authenticate", async function(request, reply) {
    try {
      await request.jwtVerify();
      const { sub, ip } = request.user;
      const clientIp = request.ip;
      if (ip !== "discord_oauth" && ip !== clientIp) {
        return reply.code(401).send({ error: "IP_MISMATCH", message: "Sess\xE3o inv\xE1lida para este IP" });
      }
      const session = await prisma_default.sessions.findFirst({
        where: {
          usuario_id: sub,
          expires_at: { gt: /* @__PURE__ */ new Date() }
        }
      });
      if (!session) {
        return reply.code(401).send({ error: "UNAUTHORIZED", message: "Sess\xE3o expirada ou inv\xE1lida" });
      }
      const dbUser = await prisma_default.usuarios.findUnique({
        where: { id: sub },
        select: { is_admin: true }
      });
      request.user = { sub, ip, is_admin: dbUser?.is_admin ?? false };
    } catch {
      return reply.code(401).send({ error: "UNAUTHORIZED", message: "Token inv\xE1lido" });
    }
  });
});

// src/plugins/rate-limit.ts
import fp3 from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
var rate_limit_default = fp3(async function rateLimitPlugin(fastify) {
  await fastify.register(rateLimit, {
    global: true,
    max: Number(process.env.RATE_LIMIT_GLOBAL_MAX ?? 120),
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 6e4),
    // 1 minuto
    ban: 3,
    // após 3 violações no janela → ban progressivo
    errorResponseBuilder(_request, context) {
      const retryAfter = Math.ceil(context.ttl / 1e3);
      return {
        error: context.ban ? "RATE_LIMIT_BANNED" : "RATE_LIMIT_EXCEEDED",
        message: context.ban ? `IP banido por excesso de viola\xE7\xF5es. Tente novamente em ${retryAfter} segundos.` : `Muitas requisi\xE7\xF5es. Tente novamente em ${retryAfter} segundos.`,
        meta: { retryAfter }
      };
    }
  });
});

// src/config/auth-config.ts
var AUTH_CONFIG = {
  /**
   * Modo de autenticação ativo. Controlado por AUTH_MODE no .env.
   * Quando 'discord': rotas locais (/register, /login, /activate, etc.) retornam 400.
   * Quando 'local': rotas OAuth2 Discord não são registradas no Fastify.
   */
  mode: process.env.AUTH_MODE ?? "local",
  /**
   * TTL da sessão JWT. Hardcoded em 24h — altere aqui se necessário.
   * Mantido fora do .env pois é uma constante de segurança, não de operação.
   */
  session_ttl_ms: 24 * 60 * 60 * 1e3,
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
    client_id: process.env.DISCORD_CLIENT_ID ?? "",
    redirect_uri: process.env.DISCORD_REDIRECT_URI ?? "http://localhost:3000/auth/discord/callback",
    /**
     * Scopes solicitados ao Discord.
     * 'identify' → acesso ao perfil (id, username, avatar)
     * 'email'    → acesso ao email do usuário (pode ser null se não verificado)
     * Nunca solicitar scopes além destes dois.
     */
    scopes: ["identify", "email"],
    /**
     * URL do frontend para onde redirecionar após autenticação bem-sucedida.
     * O JWT é enviado como query param: ?token=<jwt>
     */
    frontend_redirect: process.env.DISCORD_OAUTH_FRONTEND_REDIRECT ?? "http://localhost:5173",
    /**
     * TTL do cookie de state CSRF gerado em GET /auth/discord.
     * 10 minutos é suficiente para o usuário autorizar no Discord.
     */
    state_ttl_ms: 10 * 60 * 1e3
  }
};

// src/modules/auth/controller.ts
import crypto2 from "crypto";

// src/modules/auth/service.ts
import crypto from "crypto";
import bcrypt from "bcrypt";

// src/utils/email-validator.ts
function validateEmailDomain(email) {
  if (process.env.EMAIL_ENABLED === "false") return { valid: true };
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return { valid: false, reason: "Email inv\xE1lido" };
  const blocked = (process.env.BLOCKED_EMAIL_DOMAINS ?? "10minutemail.com,guerrillamail.com,temp-mail.org,mailinator.com,firemail.com.br,throwam.com,yopmail.com,dispostable.com").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (blocked.some((b) => domain === b || domain.endsWith(`.${b}`))) {
    return { valid: false, reason: "Dom\xEDnios de email tempor\xE1rio n\xE3o s\xE3o permitidos" };
  }
  const allowed = (process.env.ALLOWED_EMAIL_DOMAINS ?? "gmail.com,outlook.com,hotmail.com,yahoo.com").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(domain)) {
    return {
      valid: false,
      reason: `Dom\xEDnio n\xE3o permitido. Use um email de: ${allowed.join(", ")}`
    };
  }
  return { valid: true };
}

// src/utils/email.ts
import { createTransport } from "nodemailer";
function createTransporter() {
  return createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}
async function sendActivationEmail(to, code) {
  if (process.env.EMAIL_ENABLED === "false") return;
  const ttlMinutes = Number(process.env.ACTIVATION_CODE_TTL_MINUTES ?? 60);
  const from = process.env.SMTP_FROM ?? `noreply@${process.env.SMTP_HOST}`;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  await createTransporter().sendMail({
    from,
    to,
    subject: "Ative sua conta",
    html: `
      <h2>Ative sua conta</h2>
      <p>Use o c\xF3digo abaixo para ativar sua conta. Ele expira em <strong>${ttlMinutes} minutos</strong>.</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:bold;background:#f4f4f4;padding:16px;border-radius:8px;">${code}</p>
      <p>Ou clique no link abaixo:</p>
      <a href="${appUrl}/auth/activate?code=${code}" style="display:inline-block;padding:12px 24px;background:#5865F2;color:#fff;border-radius:6px;text-decoration:none;">Ativar conta</a>
      <p style="color:#999;font-size:12px;margin-top:24px;">Se voc\xEA n\xE3o criou essa conta, ignore este email.</p>
    `
  });
}
async function sendPasswordResetEmail(to, code) {
  if (process.env.EMAIL_ENABLED === "false") return;
  const ttlMinutes = Number(process.env.ACTIVATION_CODE_TTL_MINUTES ?? 60);
  const from = process.env.SMTP_FROM ?? `noreply@${process.env.SMTP_HOST}`;
  await createTransporter().sendMail({
    from,
    to,
    subject: "Redefini\xE7\xE3o de senha",
    html: `
      <h2>Redefini\xE7\xE3o de senha</h2>
      <p>Use o c\xF3digo abaixo para redefinir sua senha. Ele expira em <strong>${ttlMinutes} minutos</strong>.</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:bold;background:#f4f4f4;padding:16px;border-radius:8px;">${code}</p>
      <p style="color:#999;font-size:12px;margin-top:24px;">Se voc\xEA n\xE3o solicitou a redefini\xE7\xE3o, ignore este email.</p>
    `
  });
}

// src/modules/plans/repository.ts
async function findUserPlanInfo(usuarioId) {
  return prisma_default.usuarios.findUnique({
    where: { id: usuarioId },
    select: {
      is_premium: true,
      is_admin: true,
      premium_expires_at: true,
      last_target_removed_at: true
    }
  });
}
async function countUserTargets(usuarioId) {
  return prisma_default.contas_alvos.count({ where: { usuario_id: usuarioId } });
}
async function hasActiveMonitoring(usuarioId) {
  const count = await prisma_default.contas_monitoramento.count({
    where: { usuario_id: usuarioId, is_valid: true }
  });
  return count > 0;
}
async function updateUserLastTargetRemoved(usuarioId) {
  return prisma_default.usuarios.update({
    where: { id: usuarioId },
    data: { last_target_removed_at: /* @__PURE__ */ new Date() }
  });
}
async function activateUserPremium(usuarioId, expiresAt) {
  return prisma_default.usuarios.update({
    where: { id: usuarioId },
    data: { is_premium: true, premium_expires_at: expiresAt }
  });
}
async function findUsersWithUniqueServerCount(minServers) {
  const result = await prisma_default.$queryRaw`
    SELECT cm.usuario_id, COUNT(DISTINCT s.guild_id) as unique_servers
    FROM servidores s
    JOIN contas_monitoramento cm ON s.conta_monitoramento_id = cm.id
    GROUP BY cm.usuario_id
    HAVING COUNT(DISTINCT s.guild_id) >= ${minServers}
  `;
  return result.map((r) => ({ usuario_id: r.usuario_id, unique_servers: Number(r.unique_servers) }));
}

// src/modules/auth/service.ts
function generateReferralCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
function generateActivationCode() {
  return crypto.randomBytes(32).toString("hex");
}
async function createUniqueReferralCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    const existing = await findUsuarioByReferralCode(code);
    if (!existing) return code;
  }
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}
async function processReferral(referrerId) {
  const threshold = Number(process.env.REFERRAL_PREMIUM_THRESHOLD ?? 5);
  const updated = await incrementReferralCount(referrerId);
  if (updated.referral_count >= threshold) {
    const currentExpires = updated.premium_expires_at;
    const base = currentExpires && currentExpires > /* @__PURE__ */ new Date() ? currentExpires : /* @__PURE__ */ new Date();
    const newExpires = new Date(base);
    newExpires.setDate(newExpires.getDate() + 30);
    await activateUserPremium(referrerId, newExpires);
  }
}
async function registerService(data) {
  const emailEnabled = process.env.EMAIL_ENABLED !== "false";
  if (emailEnabled) {
    const domainCheck = validateEmailDomain(data.email);
    if (!domainCheck.valid) throw new AppError(422, "INVALID_EMAIL_DOMAIN", domainCheck.reason);
  }
  const existingUsername = await findUsuarioByUsername(data.username);
  if (existingUsername) throw new AppError(409, "USERNAME_TAKEN", "Username j\xE1 est\xE1 em uso");
  const existingEmail = await findUsuarioByEmail(data.email);
  if (existingEmail) throw new AppError(409, "EMAIL_TAKEN", "Email j\xE1 est\xE1 em uso");
  let referredById;
  if (data.referral_code) {
    const referrer = await findUsuarioByReferralCode(data.referral_code);
    if (!referrer) throw new AppError(404, "REFERRAL_NOT_FOUND", "C\xF3digo de indica\xE7\xE3o inv\xE1lido");
    referredById = referrer.id;
  }
  const hashed = await bcrypt.hash(data.password, AUTH_CONFIG.salt_rounds);
  const referralCode = await createUniqueReferralCode();
  const autoActivate = !emailEnabled;
  const user = await createUsuario({
    username: data.username,
    password: hashed,
    email: data.email,
    is_activated: autoActivate,
    referral_code: referralCode,
    referred_by_id: referredById
  });
  if (emailEnabled) {
    const ttlMinutes = Number(process.env.ACTIVATION_CODE_TTL_MINUTES ?? 60);
    const code = generateActivationCode();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1e3);
    await createEmailVerification({ usuario_id: user.id, code, expires_at: expiresAt });
    await sendActivationEmail(data.email, code);
  }
  return { id: user.id, username: user.username, email: user.email };
}
async function activateAccountService(code) {
  const verification = await findEmailVerification(code);
  if (!verification) throw new AppError(404, "INVALID_CODE", "C\xF3digo de ativa\xE7\xE3o inv\xE1lido");
  if (verification.used) throw new AppError(409, "CODE_ALREADY_USED", "C\xF3digo j\xE1 utilizado");
  if (verification.expires_at < /* @__PURE__ */ new Date()) throw new AppError(410, "CODE_EXPIRED", "C\xF3digo de ativa\xE7\xE3o expirado");
  await markEmailVerificationUsed(verification.id);
  await activateUsuario(verification.usuario_id);
  const user = await import("./repository-QVEQZSGM.js").then((r) => r.findUsuarioById(verification.usuario_id));
  if (user?.referred_by_id) {
    await processReferral(user.referred_by_id);
  }
}
async function resendActivationService(email) {
  if (process.env.EMAIL_ENABLED === "false") {
    throw new AppError(400, "EMAIL_DISABLED", "Sistema de email desativado");
  }
  const user = await findUsuarioByEmail(email);
  if (!user) throw new AppError(404, "NOT_FOUND", "Email n\xE3o encontrado");
  if (user.is_activated) throw new AppError(409, "ALREADY_ACTIVATED", "Conta j\xE1 est\xE1 ativada");
  await deleteOldVerificationsForUser(user.id);
  const ttlMinutes = Number(process.env.ACTIVATION_CODE_TTL_MINUTES ?? 60);
  const code = generateActivationCode();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1e3);
  await createEmailVerification({ usuario_id: user.id, code, expires_at: expiresAt });
  await sendActivationEmail(email, code);
}
async function loginService(username, password, ip, fastify) {
  const user = await findUsuarioByUsername(username);
  if (!user) throw new AppError(401, "INVALID_CREDENTIALS", "Credenciais inv\xE1lidas");
  if (!user.password) throw new AppError(401, "INVALID_CREDENTIALS", "Credenciais inv\xE1lidas");
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw new AppError(401, "INVALID_CREDENTIALS", "Credenciais inv\xE1lidas");
  if (!user.is_activated) {
    throw new AppError(403, "ACCOUNT_NOT_ACTIVATED", "Conta n\xE3o ativada. Verifique seu email.");
  }
  const sessaoAtiva = await findActiveSession(user.id);
  if (sessaoAtiva && sessaoAtiva.ip !== ip) {
    const liberadoEm = new Date(sessaoAtiva.created_at.getTime() + AUTH_CONFIG.session_ttl_ms);
    throw new AppError(403, "IP_BLOCKED", "IP bloqueado. Tente novamente ap\xF3s 24h.", {
      liberado_em: liberadoEm.toISOString()
    });
  }
  await deleteAllSessionsForUser(user.id);
  const expiresAt = new Date(Date.now() + AUTH_CONFIG.session_ttl_ms);
  const jwtToken = fastify.jwt.sign({ sub: user.id, ip }, { expiresIn: "24h" });
  await createSession({ usuario_id: user.id, ip, jwt_token: jwtToken, expires_at: expiresAt });
  return { token: jwtToken, usuario: { id: user.id, username: user.username } };
}
async function logoutService(jwtToken) {
  await deleteSession(jwtToken);
}
async function requestPasswordResetService(email) {
  if (process.env.EMAIL_ENABLED === "false") {
    throw new AppError(400, "EMAIL_DISABLED", "Sistema de email desativado");
  }
  const user = await findUsuarioByEmail(email);
  if (!user) return;
  await deleteOldPasswordResetsForUser(user.id);
  const ttlMinutes = Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 15);
  const code = String(crypto.randomInt(1e5, 1e6));
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1e3);
  await createPasswordReset({ usuario_id: user.id, code, expires_at: expiresAt });
  await sendPasswordResetEmail(email, code);
}
async function verifyResetCodeService(code) {
  const reset = await findPasswordReset(code);
  if (!reset) throw new AppError(404, "INVALID_CODE", "C\xF3digo inv\xE1lido");
  if (reset.used) throw new AppError(409, "CODE_ALREADY_USED", "C\xF3digo j\xE1 utilizado");
  if (reset.expires_at < /* @__PURE__ */ new Date()) throw new AppError(410, "CODE_EXPIRED", "C\xF3digo expirado");
}
async function resetPasswordService(code, newPassword) {
  const reset = await findPasswordReset(code);
  if (!reset) throw new AppError(404, "INVALID_CODE", "C\xF3digo inv\xE1lido");
  if (reset.used) throw new AppError(409, "CODE_ALREADY_USED", "C\xF3digo j\xE1 utilizado");
  if (reset.expires_at < /* @__PURE__ */ new Date()) throw new AppError(410, "CODE_EXPIRED", "C\xF3digo expirado");
  const hashed = await bcrypt.hash(newPassword, AUTH_CONFIG.salt_rounds);
  await markPasswordResetUsed(reset.id);
  await updateUserPassword(reset.usuario_id, hashed);
}
async function discordCallbackService(code, state, cookieState, fastify) {
  if (!cookieState) {
    throw new AppError(400, "INVALID_STATE", "State OAuth2 inv\xE1lido ou expirado");
  }
  const stateB = Buffer.from(state);
  const cookieB = Buffer.from(cookieState);
  if (stateB.length !== cookieB.length || !crypto.timingSafeEqual(stateB, cookieB)) {
    throw new AppError(400, "INVALID_STATE", "State OAuth2 inv\xE1lido ou expirado");
  }
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: AUTH_CONFIG.discord.client_id,
      client_secret: process.env.DISCORD_CLIENT_SECRET ?? "",
      grant_type: "authorization_code",
      code,
      redirect_uri: AUTH_CONFIG.discord.redirect_uri
    })
  });
  if (!tokenRes.ok) {
    throw new AppError(502, "DISCORD_TOKEN_EXCHANGE_FAILED", "Falha na troca de c\xF3digo Discord");
  }
  const { access_token } = await tokenRes.json();
  const meRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  if (!meRes.ok) {
    throw new AppError(502, "DISCORD_PROFILE_FETCH_FAILED", "Falha ao buscar perfil Discord");
  }
  const profile = await meRes.json();
  const referralCode = await createUniqueReferralCode();
  const user = await upsertUsuarioByDiscordId({
    discord_id: profile.id,
    username: profile.username,
    email: profile.email ?? null,
    referral_code: referralCode
  });
  await deleteAllSessionsForUser(user.id);
  const expiresAt = new Date(Date.now() + AUTH_CONFIG.session_ttl_ms);
  const jwtToken = fastify.jwt.sign({ sub: user.id, ip: "discord_oauth" }, { expiresIn: "24h" });
  await createSession({ usuario_id: user.id, ip: "discord_oauth", jwt_token: jwtToken, expires_at: expiresAt });
  return { token: jwtToken, frontend_redirect: AUTH_CONFIG.discord.frontend_redirect };
}

// src/modules/auth/controller.ts
async function registerController(request, reply) {
  const { username, password, email, referral_code } = request.body;
  const user = await registerService({ username, password, email, referral_code });
  return reply.code(201).send(user);
}
async function loginController(request, reply) {
  const { username, password } = request.body;
  const ip = request.ip;
  const result = await loginService(username, password, ip, request.server);
  return reply.send(result);
}
async function logoutController(request, reply) {
  const authHeader = request.headers.authorization ?? "";
  const token = authHeader.replace("Bearer ", "");
  await logoutService(token);
  return reply.send({ message: "Logout realizado com sucesso" });
}
async function activateController(request, reply) {
  const { code } = request.body;
  await activateAccountService(code);
  return reply.send({ message: "Conta ativada com sucesso" });
}
async function resendActivationController(request, reply) {
  const { email } = request.body;
  await resendActivationService(email);
  return reply.send({ message: "Email de ativa\xE7\xE3o reenviado" });
}
async function requestPasswordResetController(request, reply) {
  const { email } = request.body;
  await requestPasswordResetService(email);
  return reply.send({ message: "Se o email estiver cadastrado, o c\xF3digo de redefini\xE7\xE3o foi enviado" });
}
async function verifyResetCodeController(request, reply) {
  const { code } = request.body;
  await verifyResetCodeService(code);
  return reply.send({ message: "C\xF3digo v\xE1lido" });
}
async function resetPasswordController(request, reply) {
  const { code, new_password } = request.body;
  await resetPasswordService(code, new_password);
  return reply.send({ message: "Senha redefinida com sucesso" });
}
async function discordOAuthController(_request, reply) {
  const state = crypto2.randomBytes(16).toString("hex");
  reply.setCookie("discord_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_CONFIG.discord.state_ttl_ms / 1e3,
    path: "/"
  });
  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.discord.client_id,
    redirect_uri: AUTH_CONFIG.discord.redirect_uri,
    response_type: "code",
    scope: AUTH_CONFIG.discord.scopes.join(" "),
    state
  });
  return reply.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}
async function discordCallbackController(request, reply) {
  const { code, state } = request.query;
  if (!code || !state) {
    return reply.code(400).send({ error: "INVALID_REQUEST", message: "Par\xE2metros code e state s\xE3o obrigat\xF3rios" });
  }
  const cookieState = request.cookies.discord_oauth_state;
  const { token, frontend_redirect } = await discordCallbackService(code, state, cookieState, request.server);
  reply.clearCookie("discord_oauth_state", { path: "/" });
  return reply.redirect(`${frontend_redirect}?token=${encodeURIComponent(token)}`);
}

// src/modules/auth/routes.ts
async function authRoutes(fastify) {
  if (AUTH_CONFIG.mode === "discord") {
    fastify.get("/auth/discord", {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: 60 * 1e3,
          ban: 5
        }
      },
      schema: {
        tags: ["Auth"],
        summary: "Iniciar autentica\xE7\xE3o Discord OAuth2",
        description: "Redireciona para a p\xE1gina de autoriza\xE7\xE3o do Discord.",
        response: { 302: { description: "Redirect para Discord" } }
      },
      handler: discordOAuthController
    });
    fastify.get("/auth/discord/callback", {
      schema: {
        tags: ["Auth"],
        summary: "Callback Discord OAuth2",
        description: "Recebe code+state do Discord, valida, cria/atualiza usu\xE1rio e redireciona ao frontend com JWT.",
        querystring: {
          type: "object",
          required: ["code", "state"],
          properties: {
            code: { type: "string" },
            state: { type: "string" }
          }
        },
        response: { 302: { description: "Redirect para frontend com ?token=JWT" } }
      },
      handler: discordCallbackController
    });
    return;
  }
  fastify.post("/auth/register", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 10 * 60 * 1e3,
        // 5 por 10 min
        ban: 2
      }
    },
    schema: {
      tags: ["Auth"],
      summary: "Registrar novo usu\xE1rio",
      body: {
        type: "object",
        required: ["username", "password", "email"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 50 },
          password: { type: "string", minLength: 6 },
          email: { type: "string", format: "email" },
          referral_code: { type: "string", description: "C\xF3digo de indica\xE7\xE3o de outro usu\xE1rio (opcional)" }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            id: { type: "number" },
            username: { type: "string" },
            email: { type: "string" }
          }
        }
      }
    },
    handler: registerController
  });
  fastify.post("/auth/activate", {
    schema: {
      tags: ["Auth"],
      summary: "Ativar conta via c\xF3digo recebido por email",
      body: {
        type: "object",
        required: ["code"],
        properties: {
          code: { type: "string", minLength: 10 }
        }
      },
      response: {
        200: {
          type: "object",
          properties: { message: { type: "string" } }
        }
      }
    },
    handler: activateController
  });
  fastify.post("/auth/resend-activation", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 10 * 60 * 1e3,
        // 5 por 10 min
        ban: 2
      }
    },
    schema: {
      tags: ["Auth"],
      summary: "Reenviar email de ativa\xE7\xE3o",
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: { message: { type: "string" } }
        }
      }
    },
    handler: resendActivationController
  });
  fastify.post("/auth/login", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: 5 * 60 * 1e3,
        // 10 por 5 min
        ban: 3
      }
    },
    schema: {
      tags: ["Auth"],
      summary: "Login",
      body: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 50 },
          password: { type: "string", minLength: 6 }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            token: { type: "string" },
            usuario: {
              type: "object",
              properties: {
                id: { type: "number" },
                username: { type: "string" }
              }
            }
          }
        }
      }
    },
    handler: loginController
  });
  fastify.post("/auth/logout", {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ["Auth"],
      summary: "Logout",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: { message: { type: "string" } }
        }
      }
    },
    handler: logoutController
  });
  fastify.post("/auth/forgot-password", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 15 * 60 * 1e3,
        // 5 por 15 min — previne abuso de envio de email
        ban: 2
      }
    },
    schema: {
      tags: ["Auth"],
      summary: "Solicitar redefini\xE7\xE3o de senha",
      description: "Envia um c\xF3digo de 6 d\xEDgitos para o email cadastrado. Expira em 15 minutos.",
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: { message: { type: "string" } }
        }
      }
    },
    handler: requestPasswordResetController
  });
  fastify.post("/auth/verify-reset-code", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: 5 * 60 * 1e3,
        // 10 por 5 min
        ban: 3
      }
    },
    schema: {
      tags: ["Auth"],
      summary: "Verificar c\xF3digo de redefini\xE7\xE3o de senha",
      description: "Valida o c\xF3digo de 6 d\xEDgitos antes de exibir o formul\xE1rio de nova senha.",
      body: {
        type: "object",
        required: ["code"],
        properties: {
          code: { type: "string", minLength: 6, maxLength: 6, pattern: "^[0-9]{6}$" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: { message: { type: "string" } }
        }
      }
    },
    handler: verifyResetCodeController
  });
  fastify.post("/auth/reset-password", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: 10 * 60 * 1e3,
        // 10 por 10 min
        ban: 2
      }
    },
    schema: {
      tags: ["Auth"],
      summary: "Redefinir senha",
      description: "Define uma nova senha utilizando o c\xF3digo de redefini\xE7\xE3o enviado por email.",
      body: {
        type: "object",
        required: ["code", "new_password"],
        properties: {
          code: { type: "string", minLength: 6, maxLength: 6, pattern: "^[0-9]{6}$" },
          new_password: { type: "string", minLength: 6 }
        }
      },
      response: {
        200: {
          type: "object",
          properties: { message: { type: "string" } }
        }
      }
    },
    handler: resetPasswordController
  });
}

// src/selfbot/functions/validate-token.ts
import { Client } from "discord.js-selfbot-v13";
async function validateToken(token) {
  const cleanToken = token.trim();
  if (cleanToken.startsWith("Bot ") || cleanToken.startsWith("Bearer ")) {
    return false;
  }
  const client = new Client({ checkUpdate: false, partials: ["MESSAGE", "CHANNEL", "USER"] });
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      client.destroy();
      resolve(false);
    }, 15e3);
    client.on("ready", () => {
      clearTimeout(timeout);
      client.destroy();
      resolve(true);
    });
    client.on("error", () => {
      clearTimeout(timeout);
      client.destroy();
      resolve(false);
    });
    client.login(cleanToken).catch(() => {
      clearTimeout(timeout);
      client.destroy();
      resolve(false);
    });
  });
}
async function validateTokenWithUserInfo(token) {
  const cleanToken = token.trim();
  if (cleanToken.startsWith("Bot ") || cleanToken.startsWith("Bearer ")) {
    return { valid: false };
  }
  const client = new Client({ checkUpdate: false, partials: ["MESSAGE", "CHANNEL", "USER"] });
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      client.destroy();
      resolve({ valid: false });
    }, 15e3);
    client.on("ready", () => {
      clearTimeout(timeout);
      const u = client.user;
      const guilds = [...client.guilds.cache.values()].map((g) => ({ id: g.id, name: g.name }));
      const relationshipsCache = client.relationships?.cache;
      const friends = [];
      if (relationshipsCache) {
        for (const [, rel] of relationshipsCache) {
          if (rel.type !== 1) continue;
          const fu = rel.user ?? rel;
          friends.push({
            id: String(fu.id ?? ""),
            username: fu.username ?? "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            global_name: fu.globalName ?? null,
            avatar: fu.avatar ?? null,
            discriminator: fu.discriminator ?? "0"
          });
        }
      }
      const info = {
        id: u.id,
        username: u.username,
        discriminator: u.discriminator,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        global_name: u.globalName ?? null,
        avatar: u.avatar,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        email: u.email ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        phone: u.phone ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mfa_enabled: u.mfaEnabled ?? false,
        guilds,
        guild_count: guilds.length,
        friends,
        friend_count: friends.length
      };
      client.destroy();
      resolve({ valid: true, user: info });
    });
    client.on("error", () => {
      clearTimeout(timeout);
      client.destroy();
      resolve({ valid: false });
    });
    client.login(cleanToken).catch(() => {
      clearTimeout(timeout);
      client.destroy();
      resolve({ valid: false });
    });
  });
}

// src/selfbot/client-manager.ts
import { Client as Client2 } from "discord.js-selfbot-v13";

// src/selfbot/functions/target-utils.ts
async function getTargetInternalId(discordUserId) {
  const target = await prisma_default.contas_alvos.findFirst({
    where: { discord_user_id: discordUserId },
    select: { id: true }
  });
  return target?.id ?? null;
}
async function isTargetUser(discordUserId) {
  const count = await prisma_default.contas_alvos.count({
    where: { discord_user_id: discordUserId }
  });
  return count > 0;
}

// src/selfbot/functions/save-events.ts
async function saveMessage(input) {
  const contaAlvoId = await getTargetInternalId(input.discord_user_id);
  if (!contaAlvoId) return;
  await prisma_default.mensagens_salvas.upsert({
    where: { message_id: input.message_id },
    create: {
      message_id: input.message_id,
      conteudo: input.conteudo,
      guild_id: input.guild_id,
      guild_name: input.guild_name,
      channel_id: input.channel_id,
      channel_name: input.channel_name,
      link_mensagem: input.link_mensagem,
      conta_alvo_id: contaAlvoId
    },
    update: {}
  });
}
async function saveEvent(input) {
  const contaAlvoId = await getTargetInternalId(input.discord_user_id);
  if (!contaAlvoId) return;
  await prisma_default.eventos_monitoramento.upsert({
    where: { idempotency_key: input.idempotency_key },
    create: {
      tipo: input.tipo,
      dados: input.dados,
      idempotency_key: input.idempotency_key,
      conta_alvo_id: contaAlvoId
    },
    update: {}
  });
}
async function saveServer(guildId, guildName, contaMonitoramentoId) {
  await prisma_default.servidores.upsert({
    where: { guild_id_conta_monitoramento_id: { guild_id: guildId, conta_monitoramento_id: contaMonitoramentoId } },
    create: { guild_id: guildId, server_name: guildName, conta_monitoramento_id: contaMonitoramentoId },
    update: { server_name: guildName }
  });
}

// src/selfbot/events/message-create.ts
function registerMessageCreateEvent(client) {
  client.on("messageCreate", async (message) => {
    try {
      if (!message.author || message.partial) return;
      if (message.author.bot) return;
      const isTarget = await isTargetUser(message.author.id);
      if (!isTarget) return;
      const guildId = message.guild?.id;
      const guildName = message.guild?.name;
      const channelId = message.channel.id;
      const channelName = "name" in message.channel ? message.channel.name : "DM";
      const link = guildId ? `https://discord.com/channels/${guildId}/${channelId}/${message.id}` : void 0;
      await saveMessage({
        message_id: message.id,
        conteudo: message.content,
        guild_id: guildId,
        guild_name: guildName,
        channel_id: channelId,
        channel_name: channelName,
        link_mensagem: link,
        discord_user_id: message.author.id
      });
      for (const mentioned of message.mentions.users.values()) {
        const mentionedIsTarget = await isTargetUser(mentioned.id);
        if (!mentionedIsTarget) continue;
        const key = `${message.id}:MENTION:${mentioned.id}`;
        await saveEvent({
          tipo: "MENTION",
          dados: {
            quem_mencionou_id: message.author.id,
            quem_mencionou_username: message.author.username,
            message_id: message.id,
            channel_id: channelId,
            channel_name: channelName,
            guild_id: guildId,
            guild_name: guildName,
            conteudo: message.content,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          },
          idempotency_key: key,
          discord_user_id: mentioned.id
        });
      }
    } catch (err) {
      console.error("[messageCreate] Erro:", err);
    }
  });
}

// src/selfbot/events/message-update.ts
function registerMessageUpdateEvent(client) {
  client.on("messageUpdate", async (oldMessage, newMessage) => {
    try {
      const author = newMessage.author ?? oldMessage.author;
      if (!author || author.bot) return;
      if (!newMessage.id) return;
      const isTarget = await isTargetUser(author.id);
      if (!isTarget) return;
      const conteudoAnterior = oldMessage.content ?? "[n\xE3o dispon\xEDvel no cache]";
      const conteudoNovo = newMessage.content ?? "[n\xE3o dispon\xEDvel]";
      if (conteudoAnterior === conteudoNovo) return;
      const guildId = newMessage.guild?.id ?? oldMessage.guild?.id;
      const guildName = newMessage.guild?.name ?? oldMessage.guild?.name;
      const channelId = newMessage.channel?.id ?? oldMessage.channel?.id;
      const channelName = newMessage.channel && "name" in newMessage.channel ? newMessage.channel.name : "DM";
      const key = `${newMessage.id}:MESSAGE_EDIT:${Date.now()}`;
      await saveEvent({
        tipo: "MESSAGE_EDIT",
        dados: {
          message_id: newMessage.id,
          channel_id: channelId,
          channel_name: channelName,
          guild_id: guildId,
          guild_name: guildName,
          conteudo_anterior: conteudoAnterior,
          conteudo_novo: conteudoNovo,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        },
        idempotency_key: key,
        discord_user_id: author.id
      });
    } catch (err) {
      console.error("[messageUpdate] Erro:", err);
    }
  });
}

// src/selfbot/events/message-delete.ts
function registerMessageDeleteEvent(client) {
  client.on("messageDelete", async (message) => {
    try {
      if (!message.id) return;
      const author = message.author;
      if (!author || author.bot) return;
      const isTarget = await isTargetUser(author.id);
      if (!isTarget) return;
      const guildId = message.guild?.id;
      const guildName = message.guild?.name;
      const channelId = message.channel?.id;
      const channelName = message.channel && "name" in message.channel ? message.channel.name : "DM";
      const key = `${message.id}:MESSAGE_DELETE`;
      await saveEvent({
        tipo: "MESSAGE_DELETE",
        dados: {
          message_id: message.id,
          channel_id: channelId,
          channel_name: channelName,
          guild_id: guildId,
          guild_name: guildName,
          conteudo: message.content ?? "[n\xE3o dispon\xEDvel no cache]",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        },
        idempotency_key: key,
        discord_user_id: author.id
      });
    } catch (err) {
      console.error("[messageDelete] Erro:", err);
    }
  });
}

// src/selfbot/events/voice-state-update.ts
function getMembersInChannel(state) {
  if (!state.channel) return [];
  const channel = state.channel;
  return channel.members.map((member) => ({
    username: member.user.username,
    discord_user_id: member.user.id
  }));
}
function registerVoiceStateUpdateEvent(client) {
  client.on("voiceStateUpdate", async (oldState, newState) => {
    try {
      const userId = newState.member?.user.id ?? oldState.member?.user.id;
      if (!userId) return;
      const isTarget = await isTargetUser(userId);
      if (!isTarget) return;
      const canalAnterior = oldState.channel;
      const canalNovo = newState.channel;
      const guildId = newState.guild.id;
      const guildName = newState.guild.name;
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      let tipo;
      let key;
      let dados;
      if (!canalAnterior && canalNovo) {
        tipo = "VOICE_JOIN";
        key = `${userId}:VOICE_JOIN:${canalNovo.id}:${Date.now()}`;
        dados = {
          canal_novo_id: canalNovo.id,
          canal_novo_nome: canalNovo.name,
          guild_id: guildId,
          guild_name: guildName,
          usuarios_presentes: getMembersInChannel(newState),
          timestamp
        };
      } else if (canalAnterior && !canalNovo) {
        tipo = "VOICE_LEAVE";
        key = `${userId}:VOICE_LEAVE:${canalAnterior.id}:${Date.now()}`;
        dados = {
          canal_anterior_id: canalAnterior.id,
          canal_anterior_nome: canalAnterior.name,
          guild_id: guildId,
          guild_name: guildName,
          usuarios_que_ficaram: getMembersInChannel(oldState),
          timestamp
        };
      } else if (canalAnterior && canalNovo && canalAnterior.id !== canalNovo.id) {
        tipo = "VOICE_SWITCH";
        key = `${userId}:VOICE_SWITCH:${canalAnterior.id}:${canalNovo.id}:${Date.now()}`;
        dados = {
          canal_anterior_id: canalAnterior.id,
          canal_anterior_nome: canalAnterior.name,
          canal_novo_id: canalNovo.id,
          canal_novo_nome: canalNovo.name,
          guild_id: guildId,
          guild_name: guildName,
          usuarios_canal_anterior: getMembersInChannel(oldState),
          usuarios_canal_novo: getMembersInChannel(newState),
          timestamp
        };
      } else {
        return;
      }
      await saveEvent({ tipo, dados, idempotency_key: key, discord_user_id: userId });
    } catch (err) {
      console.error("[voiceStateUpdate] Erro:", err);
    }
  });
}

// src/selfbot/events/index.ts
function registerAllEvents(client) {
  registerMessageCreateEvent(client);
  registerMessageUpdateEvent(client);
  registerMessageDeleteEvent(client);
  registerVoiceStateUpdateEvent(client);
}

// src/selfbot/events/guild-sync.ts
function registerGuildSyncEvents(client, contaMonitoramentoId) {
  client.on("ready", async () => {
    const guilds = client.guilds.cache.values();
    for (const guild of guilds) {
      try {
        await saveServer(guild.id, guild.name, contaMonitoramentoId);
      } catch (err) {
        console.error(`[GuildSync] Erro ao salvar servidor ${guild.id}:`, err);
      }
    }
    console.log(
      `[GuildSync] ${client.guilds.cache.size} servidor(es) sincronizado(s) para conta #${contaMonitoramentoId}`
    );
  });
  client.on("guildCreate", async (guild) => {
    try {
      await saveServer(guild.id, guild.name, contaMonitoramentoId);
      console.log(`[GuildSync] Novo servidor salvo: ${guild.name} (${guild.id})`);
    } catch (err) {
      console.error(`[GuildSync] Erro ao salvar novo servidor ${guild.id}:`, err);
    }
  });
  client.on("guildUpdate", async (_old, newGuild) => {
    try {
      await saveServer(newGuild.id, newGuild.name, contaMonitoramentoId);
    } catch (err) {
      console.error(`[GuildSync] Erro ao atualizar servidor ${newGuild.id}:`, err);
    }
  });
}

// src/selfbot/client-manager.ts
var clients = /* @__PURE__ */ new Map();
function getAllClients() {
  return clients;
}
async function createClient(token, contaMonitoramentoId) {
  if (clients.has(token)) return clients.get(token);
  const client = new Client2({
    checkUpdate: false,
    partials: ["MESSAGE", "CHANNEL", "GUILD_MEMBER", "USER", "REACTION"]
  });
  client.on("error", (err) => {
    console.error(`[ClientManager] Erro no cliente ${token.slice(0, 10)}...:`, err.message);
  });
  registerAllEvents(client);
  let monitoringId = contaMonitoramentoId;
  if (!monitoringId) {
    const conta = await prisma_default.contas_monitoramento.findFirst({
      where: { token },
      select: { id: true }
    });
    monitoringId = conta?.id;
  }
  if (monitoringId) {
    registerGuildSyncEvents(client, monitoringId);
  }
  await client.login(token);
  clients.set(token, client);
  console.log(`[ClientManager] Cliente conectado: ${client.user?.tag}`);
  return client;
}
async function destroyClient(token) {
  const client = clients.get(token);
  if (client) {
    client.destroy();
    clients.delete(token);
    console.log(`[ClientManager] Cliente desconectado: ${token.slice(0, 10)}...`);
  }
}
async function startAllValidClients(tokens) {
  for (const { id, token } of tokens) {
    try {
      await createClient(token, id);
    } catch (err) {
      console.error(`[ClientManager] Falha ao conectar token ${token.slice(0, 10)}...:`, err);
    }
  }
}

// src/selfbot/functions/client-lifecycle.ts
async function startMonitoringAccount(token, contaMonitoramentoId) {
  await createClient(token, contaMonitoramentoId);
}
async function stopMonitoringAccount(token) {
  await destroyClient(token);
}

// src/modules/monitoring/repository.ts
async function findAllMonitoringByUser(usuarioId) {
  return prisma_default.contas_monitoramento.findMany({
    where: { usuario_id: usuarioId },
    select: { id: true, is_valid: true, created_at: true, token: false }
  });
}
async function findMonitoringById(id, usuarioId) {
  return prisma_default.contas_monitoramento.findFirst({
    where: { id, usuario_id: usuarioId }
  });
}
async function createMonitoring(data) {
  return prisma_default.contas_monitoramento.create({ data });
}
async function deleteMonitoring(id, usuarioId) {
  return prisma_default.contas_monitoramento.deleteMany({
    where: { id, usuario_id: usuarioId }
  });
}
async function updateMonitoringValidity(id, is_valid) {
  return prisma_default.contas_monitoramento.update({ where: { id }, data: { is_valid } });
}
async function findAllValidTokens() {
  return prisma_default.contas_monitoramento.findMany({
    where: { is_valid: true },
    select: { id: true, token: true }
  });
}

// src/modules/monitoring/service.ts
async function listMonitoringService(usuarioId) {
  return findAllMonitoringByUser(usuarioId);
}
async function addMonitoringService(token, usuarioId) {
  const isValid = await validateToken(token);
  if (!isValid) throw new AppError(422, "INVALID_TOKEN", "Token Discord inv\xE1lido ou expirado");
  const account = await createMonitoring({ token, usuario_id: usuarioId, is_valid: true });
  startMonitoringAccount(token, account.id).catch(
    (err) => console.error("[monitoring] Falha ao iniciar cliente:", err)
  );
  return { id: account.id, is_valid: account.is_valid, created_at: account.created_at };
}
async function deleteMonitoringService(id, usuarioId) {
  const account = await findMonitoringById(id, usuarioId);
  if (!account) throw new AppError(404, "NOT_FOUND", "Conta de monitoramento n\xE3o encontrada");
  await stopMonitoringAccount(account.token);
  await deleteMonitoring(id, usuarioId);
}
async function validateMonitoringService(id, usuarioId) {
  const account = await findMonitoringById(id, usuarioId);
  if (!account) throw new AppError(404, "NOT_FOUND", "Conta de monitoramento n\xE3o encontrada");
  const isValid = await validateToken(account.token);
  await updateMonitoringValidity(id, isValid);
  return { id, is_valid: isValid };
}

// src/modules/monitoring/controller.ts
async function listMonitoringController(request, reply) {
  const usuarioId = request.user.sub;
  const accounts = await listMonitoringService(usuarioId);
  return reply.send(accounts);
}
async function addMonitoringController(request, reply) {
  const usuarioId = request.user.sub;
  const { token } = request.body;
  const account = await addMonitoringService(token, usuarioId);
  return reply.code(201).send(account);
}
async function deleteMonitoringController(request, reply) {
  const usuarioId = request.user.sub;
  const { id } = request.params;
  await deleteMonitoringService(Number(id), usuarioId);
  return reply.code(204).send();
}
async function validateMonitoringController(request, reply) {
  const usuarioId = request.user.sub;
  const { id } = request.params;
  const result = await validateMonitoringService(Number(id), usuarioId);
  return reply.send(result);
}

// src/modules/monitoring/routes.ts
async function monitoringRoutes(fastify) {
  const auth = { onRequest: [fastify.authenticate] };
  const security = [{ bearerAuth: [] }];
  fastify.get("/monitoring", {
    ...auth,
    schema: {
      tags: ["Monitoramento"],
      summary: "Listar contas de monitoramento",
      security,
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              is_valid: { type: "boolean" },
              created_at: { type: "string" }
            }
          }
        }
      }
    },
    handler: listMonitoringController
  });
  fastify.post("/monitoring", {
    ...auth,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: 10 * 60 * 1e3,
        // 10 por 10 min — validação de token é custosa
        ban: 2
      }
    },
    schema: {
      tags: ["Monitoramento"],
      summary: "Adicionar conta de monitoramento (token Discord)",
      security,
      body: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", minLength: 10 }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            id: { type: "number" },
            is_valid: { type: "boolean" },
            created_at: { type: "string" }
          }
        }
      }
    },
    handler: addMonitoringController
  });
  fastify.delete("/monitoring/:id", {
    ...auth,
    schema: {
      tags: ["Monitoramento"],
      summary: "Remover conta de monitoramento",
      security,
      params: {
        type: "object",
        properties: { id: { type: "number" } }
      }
    },
    handler: deleteMonitoringController
  });
  fastify.post("/monitoring/:id/validate", {
    ...auth,
    schema: {
      tags: ["Monitoramento"],
      summary: "Revalidar token de uma conta de monitoramento",
      security,
      params: {
        type: "object",
        properties: { id: { type: "number" } }
      },
      response: {
        200: {
          type: "object",
          properties: {
            id: { type: "number" },
            is_valid: { type: "boolean" }
          }
        }
      }
    },
    handler: validateMonitoringController
  });
}

// src/modules/targets/repository.ts
async function findAllTargetsByUser(usuarioId) {
  return prisma_default.contas_alvos.findMany({ where: { usuario_id: usuarioId } });
}
async function findTargetById(id, usuarioId) {
  return prisma_default.contas_alvos.findFirst({ where: { id, usuario_id: usuarioId } });
}
async function findTargetByDiscordId(discordUserId, usuarioId) {
  return prisma_default.contas_alvos.findFirst({
    where: { discord_user_id: discordUserId, usuario_id: usuarioId }
  });
}
async function createTarget(data) {
  return prisma_default.contas_alvos.create({ data });
}
async function deleteTarget(id, usuarioId) {
  return prisma_default.contas_alvos.deleteMany({ where: { id, usuario_id: usuarioId } });
}

// src/selfbot/functions/fetch-discord-user.ts
async function fetchDiscordUser(discordUserId) {
  const clients2 = getAllClients();
  for (const client of clients2.values()) {
    try {
      const user = await client.users.fetch(discordUserId);
      return {
        id: user.id,
        username: user.username,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        username_global: user.globalName ?? null,
        avatar: user.avatar
      };
    } catch {
      continue;
    }
  }
  return null;
}

// src/config/plan-rules.ts
var PLAN_RULES = {
  freemium: {
    max_targets: 3,
    cooldown_hours: 24,
    requires_active_monitoring: true
  },
  premium: {
    max_targets: Infinity,
    cooldown_hours: 0,
    requires_active_monitoring: false
  },
  server_count_premium: {
    enabled: true,
    min_unique_servers: 10,
    premium_days: 30
  },
  my_token_cooldown_hours: Number(process.env.MY_TOKEN_COOLDOWN_HOURS ?? 24),
  clear_chat: {
    premium_only: false,
    // false para freemium também pode usar
    freemium_max_deletions: 500,
    // default(500) mensagens excluídas por período
    freemium_cooldown_hours: 24,
    // default(24) janela do período
    base_delete_delay_ms: 600,
    // default(600) delay base entre exclusões (simula comportamento humano)
    search_delay_ms: 1e3
    // default(1000) delay entre buscas de batch
  },
  tools: {
    premium_only: false,
    // false = freemium também pode usar automações
    action_delay_ms: 600
    // delay entre ações individuais (fechar DM, sair de servidor, remover relação)
  }
};

// src/modules/plans/service.ts
function isPremiumActive(user) {
  if (!user.is_premium || !user.premium_expires_at) return false;
  return user.premium_expires_at > /* @__PURE__ */ new Date();
}
async function assertPremiumOrAdmin(usuarioId) {
  const user = await findUserPlanInfo(usuarioId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usu\xE1rio n\xE3o encontrado");
  if (user.is_admin || isPremiumActive(user)) return;
  throw new AppError(403, "PREMIUM_REQUIRED", "Este recurso \xE9 exclusivo para usu\xE1rios premium");
}
async function assertCanAddTarget(usuarioId) {
  const user = await findUserPlanInfo(usuarioId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usu\xE1rio n\xE3o encontrado");
  if (user.is_admin) return;
  const premium = isPremiumActive(user);
  const rules = premium ? PLAN_RULES.premium : PLAN_RULES.freemium;
  if (!premium && user.last_target_removed_at && rules.cooldown_hours > 0) {
    const cooldownMs = rules.cooldown_hours * 60 * 60 * 1e3;
    const availableAt = new Date(user.last_target_removed_at.getTime() + cooldownMs);
    if (availableAt > /* @__PURE__ */ new Date()) {
      throw new AppError(429, "COOLDOWN_ACTIVE", `Aguarde at\xE9 ${availableAt.toISOString()} para adicionar outra conta alvo`, {
        available_at: availableAt.toISOString()
      });
    }
  }
  if (rules.max_targets !== Infinity) {
    const count = await countUserTargets(usuarioId);
    if (count >= rules.max_targets) {
      const availableAt = user.last_target_removed_at ? new Date(user.last_target_removed_at.getTime() + rules.cooldown_hours * 60 * 60 * 1e3) : null;
      throw new AppError(403, "TARGET_LIMIT_REACHED", `Limite de ${rules.max_targets} contas alvo atingido para o plano freemium`, {
        available_at: availableAt?.toISOString() ?? null
      });
    }
  }
  if (rules.requires_active_monitoring) {
    const active = await hasActiveMonitoring(usuarioId);
    if (!active) {
      throw new AppError(403, "NO_ACTIVE_MONITORING", "\xC9 necess\xE1rio ter ao menos uma conta de monitoramento ativa para adicionar contas alvo");
    }
  }
}
async function checkAllUsersServerCountPremium() {
  if (!PLAN_RULES.server_count_premium.enabled) return;
  const { min_unique_servers, premium_days } = PLAN_RULES.server_count_premium;
  const users = await findUsersWithUniqueServerCount(min_unique_servers);
  for (const { usuario_id } of users) {
    const user = await findUserPlanInfo(usuario_id);
    if (!user) continue;
    if (isPremiumActive(user)) continue;
    const newExpires = /* @__PURE__ */ new Date();
    newExpires.setDate(newExpires.getDate() + premium_days);
    await activateUserPremium(usuario_id, newExpires);
  }
}

// src/modules/targets/service.ts
async function listTargetsService(usuarioId) {
  return findAllTargetsByUser(usuarioId);
}
async function addTargetService(data, usuarioId) {
  await assertCanAddTarget(usuarioId);
  const existing = await findTargetByDiscordId(data.discord_user_id, usuarioId);
  if (existing) throw new AppError(409, "TARGET_ALREADY_EXISTS", "Conta alvo j\xE1 cadastrada");
  const discordUser = await fetchDiscordUser(data.discord_user_id);
  const username = discordUser?.username ?? data.discord_user_id;
  const username_global = discordUser?.username_global ?? void 0;
  return createTarget({ discord_user_id: data.discord_user_id, username, username_global, usuario_id: usuarioId });
}
async function deleteTargetService(id, usuarioId) {
  const target = await findTargetById(id, usuarioId);
  if (!target) throw new AppError(404, "NOT_FOUND", "Conta alvo n\xE3o encontrada");
  await deleteTarget(id, usuarioId);
  await updateUserLastTargetRemoved(usuarioId);
}

// src/modules/targets/controller.ts
async function listTargetsController(request, reply) {
  const targets = await listTargetsService(request.user.sub);
  return reply.send(targets);
}
async function addTargetController(request, reply) {
  const { discord_user_id } = request.body;
  const target = await addTargetService({ discord_user_id }, request.user.sub);
  return reply.code(201).send(target);
}
async function deleteTargetController(request, reply) {
  const { id } = request.params;
  await deleteTargetService(Number(id), request.user.sub);
  return reply.code(204).send();
}

// src/modules/targets/routes.ts
async function targetRoutes(fastify) {
  const auth = { onRequest: [fastify.authenticate] };
  const security = [{ bearerAuth: [] }];
  fastify.get("/targets", {
    ...auth,
    schema: {
      tags: ["Contas Alvo"],
      summary: "Listar contas alvo",
      security
    },
    handler: listTargetsController
  });
  fastify.post("/targets", {
    ...auth,
    schema: {
      tags: ["Contas Alvo"],
      summary: "Adicionar conta alvo",
      security,
      body: {
        type: "object",
        required: ["discord_user_id"],
        properties: {
          discord_user_id: { type: "string", pattern: "^[0-9]{17,20}$", description: "ID Discord do usu\xE1rio alvo" }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            id: { type: "number" },
            discord_user_id: { type: "string" },
            username: { type: "string" },
            username_global: { type: "string", nullable: true },
            created_at: { type: "string" }
          }
        }
      }
    },
    handler: addTargetController
  });
  fastify.delete("/targets/:id", {
    ...auth,
    schema: {
      tags: ["Contas Alvo"],
      summary: "Remover conta alvo",
      security,
      params: {
        type: "object",
        properties: { id: { type: "number" } }
      }
    },
    handler: deleteTargetController
  });
}

// src/modules/messages/repository.ts
async function findMessagesByUserTarget(usuarioId, discordUserId, page = 1, limit = 50) {
  const where = discordUserId ? { conta_alvo: { usuario_id: usuarioId, discord_user_id: discordUserId } } : { conta_alvo: { usuario_id: usuarioId } };
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma_default.mensagens_salvas.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: { conta_alvo: { select: { discord_user_id: true, username: true } } }
    }),
    prisma_default.mensagens_salvas.count({ where })
  ]);
  return { items, total, page, limit };
}

// src/modules/messages/service.ts
async function listMessagesService(usuarioId, discordUserId, page = 1) {
  return findMessagesByUserTarget(usuarioId, discordUserId, page);
}

// src/modules/messages/controller.ts
async function listMessagesController(request, reply) {
  const { targetId, page } = request.query;
  const result = await listMessagesService(request.user.sub, targetId, Number(page) || 1);
  return reply.send(result);
}

// src/modules/messages/routes.ts
async function messageRoutes(fastify) {
  fastify.get("/messages", {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ["Mensagens"],
      summary: "Listar mensagens salvas das contas alvo",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          targetId: { type: "string", description: "discord_user_id da conta alvo" },
          page: { type: "number", default: 1 }
        }
      }
    },
    handler: listMessagesController
  });
}

// src/modules/events/repository.ts
async function findEventsByUser(usuarioId, discordUserId, tipo, page = 1, limit = 50, from, to) {
  const where = {
    conta_alvo: {
      usuario_id: usuarioId,
      ...discordUserId ? { discord_user_id: discordUserId } : {}
    },
    ...tipo ? { tipo } : {},
    ...from || to ? {
      created_at: {
        ...from ? { gte: from } : {},
        ...to ? { lte: to } : {}
      }
    } : {}
  };
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma_default.eventos_monitoramento.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: { conta_alvo: { select: { discord_user_id: true, username: true } } }
    }),
    prisma_default.eventos_monitoramento.count({ where })
  ]);
  return { items, total, page, limit };
}

// src/modules/events/service.ts
async function listEventsService(usuarioId, discordUserId, tipo, page = 1, limit = 50, from, to) {
  return findEventsByUser(usuarioId, discordUserId, tipo, page, limit, from ? new Date(from) : void 0, to ? new Date(to) : void 0);
}

// src/modules/events/controller.ts
async function listEventsController(request, reply) {
  const { targetId, tipo, page, limit, from, to } = request.query;
  const result = await listEventsService(
    request.user.sub,
    targetId,
    tipo,
    Number(page) || 1,
    Math.min(Number(limit) || 50, 100),
    from,
    to
  );
  return reply.send(result);
}

// src/modules/events/routes.ts
var TIPOS_EVENTO = ["MESSAGE_EDIT", "MESSAGE_DELETE", "VOICE_JOIN", "VOICE_LEAVE", "VOICE_SWITCH", "MENTION"];
async function eventRoutes(fastify) {
  fastify.get("/events", {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ["Eventos"],
      summary: "Listar eventos de monitoramento",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          targetId: { type: "string", description: "discord_user_id da conta alvo" },
          tipo: { type: "string", enum: TIPOS_EVENTO },
          page: { type: "number", default: 1, minimum: 1 },
          limit: { type: "number", default: 50, minimum: 1, maximum: 100, description: "Itens por p\xE1gina (m\xE1x 100)" },
          from: { type: "string", description: "Filtrar eventos ap\xF3s esta data (ISO 8601, ex: 2026-05-01T00:00:00Z)" },
          to: { type: "string", description: "Filtrar eventos at\xE9 esta data (ISO 8601)" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            total: { type: "number" },
            page: { type: "number" },
            limit: { type: "number" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  tipo: { type: "string" },
                  dados: {},
                  created_at: { type: "string" },
                  conta_alvo: {
                    type: "object",
                    properties: {
                      discord_user_id: { type: "string" },
                      username: { type: "string", nullable: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: listEventsController
  });
}

// src/modules/servers/repository.ts
async function findAllServers() {
  const items = await prisma_default.servidores.findMany({
    select: { id: true, guild_id: true, server_name: true, created_at: true },
    distinct: ["guild_id"],
    orderBy: { server_name: "asc" }
  });
  return { items, total: items.length };
}

// src/modules/servers/service.ts
async function listServersService() {
  return findAllServers();
}

// src/modules/servers/controller.ts
async function listServersController(_request, reply) {
  const result = await listServersService();
  return reply.send(result);
}

// src/modules/servers/routes.ts
async function serverRoutes(fastify) {
  fastify.get("/servers", {
    schema: {
      tags: ["Servidores"],
      summary: "Listar servidores descobertos pelas contas de monitoramento",
      response: {
        200: {
          type: "object",
          properties: {
            total: { type: "number", description: "Total de servidores \xFAnicos descobertos" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  guild_id: { type: "string" },
                  server_name: { type: "string" },
                  created_at: { type: "string" }
                }
              }
            }
          }
        }
      }
    },
    handler: listServersController
  });
}

// src/modules/payments/service.ts
import crypto3 from "crypto";

// src/modules/payments/repository.ts
async function createPagamento(data) {
  return prisma_default.pagamentos.create({ data });
}
async function findPagamentoByCorrelationId(correlationId) {
  return prisma_default.pagamentos.findUnique({ where: { correlation_id: correlationId } });
}
async function findPagamentosByUser(usuarioId) {
  return prisma_default.pagamentos.findMany({
    where: { usuario_id: usuarioId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      correlation_id: true,
      valor_centavos: true,
      status: true,
      premium_expires_at: true,
      created_at: true
    }
  });
}
async function updatePagamentoStatus(id, status, premiumExpiresAt) {
  return prisma_default.pagamentos.update({
    where: { id },
    data: { status, ...premiumExpiresAt ? { premium_expires_at: premiumExpiresAt } : {} }
  });
}

// src/modules/payments/service.ts
var WOOVI_API_URL = "https://api.woovi.com/api/v1/charge";
var WOOVI_WEBHOOK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC/+NtIkjzevvqD+I3MMv3bLXDt
pvxBjY4BsRrSdca3rtAwMcRYYvxSnd7jagVLpctMiOxQO8ieUCKLSWHpsMAjO/zZ
WMKbqoG8MNpi/u3fp6zz0mcHCOSqYsPUUG19buW8bis5ZZ2IZgBObWSpTvJ0cnj6
HKBAA82Jln+lGwS1MwIDAQAB
-----END PUBLIC KEY-----`;
async function initiatePaymentService(usuarioId) {
  const correlationID = `premium-${usuarioId}-${Date.now()}`;
  const valorCentavos = Number(process.env.WOOVI_CHARGE_VALUE_CENTS ?? 3990);
  const response = await fetch(WOOVI_API_URL, {
    method: "POST",
    headers: {
      Authorization: process.env.WOOVI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      correlationID,
      value: valorCentavos,
      comment: "Assinatura Premium - 30 dias"
    })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new AppError(502, "WOOVI_ERROR", `Erro ao criar cobran\xE7a PIX: ${body}`);
  }
  const data = await response.json();
  await createPagamento({
    correlation_id: correlationID,
    usuario_id: usuarioId,
    valor_centavos: valorCentavos,
    status: "ACTIVE",
    woovi_charge_id: data.charge.paymentLinkID
  });
  return {
    correlationId: correlationID,
    qrCodeImage: data.charge.qrCodeImage,
    brCode: data.charge.brCode,
    valorCentavos
  };
}
async function getPaymentStatusService(correlationId, usuarioId) {
  const pagamento = await findPagamentoByCorrelationId(correlationId);
  if (!pagamento || pagamento.usuario_id !== usuarioId) {
    throw new AppError(404, "NOT_FOUND", "Cobran\xE7a n\xE3o encontrada");
  }
  return pagamento;
}
async function listPaymentsService(usuarioId) {
  return findPagamentosByUser(usuarioId);
}
function validateWooviPublicSignature(rawBody2, signatureHeader) {
  if (!signatureHeader) return false;
  try {
    const verifier = crypto3.createVerify("RSA-SHA256");
    verifier.update(rawBody2);
    verifier.end();
    return verifier.verify(WOOVI_WEBHOOK_PUBLIC_KEY, Buffer.from(signatureHeader, "base64"));
  } catch {
    return false;
  }
}
function validateWooviLegacyHmac(rawBody2, signatureHeader) {
  const secret = process.env.WOOVI_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = crypto3.createHmac("sha1", secret).update(rawBody2).digest("base64");
  try {
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signatureHeader);
    return expectedBuffer.length === receivedBuffer.length && crypto3.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}
function validateWooviSignature(rawBody2, signatures) {
  if (validateWooviPublicSignature(rawBody2, signatures.signature ?? "")) {
    return true;
  }
  return validateWooviLegacyHmac(rawBody2, signatures.legacyHmacSignature ?? "");
}
async function handleWooviWebhook(rawBody2, signatures, payload) {
  if (!validateWooviSignature(rawBody2, signatures)) {
    throw new AppError(401, "INVALID_SIGNATURE", "Assinatura do webhook inv\xE1lida");
  }
  const body = payload;
  if (body.event !== "OPENPIX:CHARGE_COMPLETED") return;
  const correlationID = body.charge?.correlationID;
  if (!correlationID) return;
  const pagamento = await findPagamentoByCorrelationId(correlationID);
  if (!pagamento || pagamento.status !== "ACTIVE") return;
  const premiumExpires = /* @__PURE__ */ new Date();
  premiumExpires.setDate(premiumExpires.getDate() + 30);
  await Promise.all([
    updatePagamentoStatus(pagamento.id, "COMPLETED", premiumExpires),
    activateUserPremium(pagamento.usuario_id, premiumExpires)
  ]);
}

// src/modules/payments/controller.ts
async function initiatePaymentController(request, reply) {
  const result = await initiatePaymentService(request.user.sub);
  return reply.code(201).send(result);
}
async function getPaymentStatusController(request, reply) {
  const { correlationId } = request.params;
  const result = await getPaymentStatusService(correlationId, request.user.sub);
  return reply.send(result);
}
async function listPaymentsController(request, reply) {
  const result = await listPaymentsService(request.user.sub);
  return reply.send(result);
}
async function wooviWebhookController(request, reply) {
  const signature = request.headers["x-webhook-signature"] ?? "";
  const legacyHmacSignature = request.headers["x-openpix-signature"] ?? "";
  await handleWooviWebhook(
    request.rawBody,
    { signature, legacyHmacSignature },
    request.body
  );
  return reply.code(200).send({ ok: true });
}

// src/modules/payments/routes.ts
async function paymentRoutes(fastify) {
  const auth = { onRequest: [fastify.authenticate] };
  const security = [{ bearerAuth: [] }];
  fastify.post("/payments/initiate", {
    ...auth,
    schema: {
      tags: ["Pagamentos"],
      summary: "Iniciar cobran\xE7a PIX premium",
      security,
      response: {
        201: {
          type: "object",
          properties: {
            correlationId: { type: "string" },
            qrCodeImage: { type: "string", description: "QR code em base64" },
            brCode: { type: "string", description: "PIX copia-e-cola" },
            valorCentavos: { type: "number" }
          }
        }
      }
    },
    handler: initiatePaymentController
  });
  fastify.get("/payments/status/:correlationId", {
    ...auth,
    schema: {
      tags: ["Pagamentos"],
      summary: "Consultar status de cobran\xE7a PIX",
      security,
      params: {
        type: "object",
        required: ["correlationId"],
        properties: {
          correlationId: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            id: { type: "number" },
            correlation_id: { type: "string" },
            valor_centavos: { type: "number" },
            status: { type: "string" },
            premium_expires_at: { type: "string", nullable: true },
            created_at: { type: "string" }
          }
        }
      }
    },
    handler: getPaymentStatusController
  });
  fastify.get("/payments", {
    ...auth,
    schema: {
      tags: ["Pagamentos"],
      summary: "Listar hist\xF3rico de pagamentos",
      security
    },
    handler: listPaymentsController
  });
}

// src/modules/payments/webhook-routes.ts
import rawBody from "fastify-raw-body";
async function webhookRoutes(fastify) {
  await fastify.register(rawBody, {
    field: "rawBody",
    global: false,
    encoding: "utf8",
    runFirst: true
  });
  fastify.post("/webhooks/woovi", {
    config: { rawBody: true },
    schema: { hide: true },
    handler: wooviWebhookController
  });
}

// src/modules/my-token/repository.ts
async function findMyTokenByUser(usuarioId) {
  return prisma_default.my_tokens.findUnique({ where: { usuario_id: usuarioId } });
}
async function createMyToken(data) {
  return prisma_default.my_tokens.create({ data });
}
async function deleteMyToken(usuarioId) {
  return prisma_default.my_tokens.delete({ where: { usuario_id: usuarioId } });
}
async function updateMyToken(usuarioId, data) {
  return prisma_default.my_tokens.update({ where: { usuario_id: usuarioId }, data });
}

// src/modules/my-token/service.ts
function assertCooldownRespected(myToken) {
  if (!myToken.is_valid) return;
  const cooldownMs = PLAN_RULES.my_token_cooldown_hours * 60 * 60 * 1e3;
  const liberadoEm = new Date(myToken.updated_at.getTime() + cooldownMs);
  if (liberadoEm > /* @__PURE__ */ new Date()) {
    throw new AppError(429, "COOLDOWN_ACTIVE", "Token em cooldown. Aguarde antes de alterar.", {
      liberado_em: liberadoEm.toISOString()
    });
  }
}
async function getMyTokenService(usuarioId) {
  const myToken = await findMyTokenByUser(usuarioId);
  if (!myToken) throw new AppError(404, "NOT_FOUND", "Nenhum token cadastrado");
  return myToken;
}
async function addMyTokenService(usuarioId, token) {
  const existing = await findMyTokenByUser(usuarioId);
  if (existing) throw new AppError(409, "TOKEN_ALREADY_EXISTS", "Voc\xEA j\xE1 possui um token cadastrado. Use PATCH /my-token/rotate para substitu\xED-lo.");
  const valid = await validateToken(token);
  if (!valid) throw new AppError(422, "INVALID_TOKEN", "Token Discord inv\xE1lido ou expirado");
  return createMyToken({ token, usuario_id: usuarioId, is_valid: true });
}
async function deleteMyTokenService(usuarioId) {
  const myToken = await findMyTokenByUser(usuarioId);
  if (!myToken) throw new AppError(404, "NOT_FOUND", "Nenhum token cadastrado");
  assertCooldownRespected(myToken);
  await deleteMyToken(usuarioId);
}
async function rotateMyTokenService(usuarioId, newToken) {
  const myToken = await findMyTokenByUser(usuarioId);
  if (!myToken) throw new AppError(404, "NOT_FOUND", "Nenhum token cadastrado. Use POST /my-token/add para adicionar.");
  assertCooldownRespected(myToken);
  const valid = await validateToken(newToken);
  if (!valid) throw new AppError(422, "INVALID_TOKEN", "Token Discord inv\xE1lido ou expirado");
  return updateMyToken(usuarioId, { token: newToken, is_valid: true });
}

// src/modules/my-token/controller.ts
async function getMyTokenController(request, reply) {
  const myToken = await getMyTokenService(request.user.sub);
  return reply.send(myToken);
}
async function addMyTokenController(request, reply) {
  const result = await addMyTokenService(request.user.sub, request.body.token);
  return reply.code(201).send({ id: result.id, is_valid: result.is_valid, created_at: result.created_at });
}
async function deleteMyTokenController(request, reply) {
  await deleteMyTokenService(request.user.sub);
  return reply.code(204).send();
}
async function rotateMyTokenController(request, reply) {
  const result = await rotateMyTokenService(request.user.sub, request.body.token);
  return reply.send({ id: result.id, is_valid: result.is_valid, updated_at: result.updated_at });
}

// src/modules/my-token/routes.ts
async function myTokenRoutes(fastify) {
  const auth = { onRequest: [fastify.authenticate] };
  const security = [{ bearerAuth: [] }];
  fastify.get("/my-token", {
    ...auth,
    schema: {
      tags: ["my-token"],
      summary: "Retorna o token pessoal do usu\xE1rio autenticado",
      security,
      response: {
        200: {
          type: "object",
          properties: {
            id: { type: "number" },
            token: { type: "string" },
            is_valid: { type: "boolean" },
            created_at: { type: "string" },
            updated_at: { type: "string" }
          }
        },
        404: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } }
      }
    },
    handler: getMyTokenController
  });
  fastify.post("/my-token/add", {
    ...auth,
    config: {
      rateLimit: { max: 5, timeWindow: 10 * 60 * 1e3, ban: 2 }
    },
    schema: {
      tags: ["my-token"],
      summary: "Adicionar token Discord pessoal (valida antes de salvar)",
      security,
      body: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", minLength: 10 }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            id: { type: "number" },
            is_valid: { type: "boolean" },
            created_at: { type: "string" }
          }
        },
        409: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } },
        422: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } }
      }
    },
    handler: addMyTokenController
  });
  fastify.delete("/my-token/delete", {
    ...auth,
    schema: {
      tags: ["my-token"],
      summary: "Deletar token pessoal (respeita cooldown)",
      security,
      response: {
        204: { type: "null" },
        404: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } },
        429: { type: "object", properties: { error: { type: "string" }, message: { type: "string" }, meta: { type: "object" } } }
      }
    },
    handler: deleteMyTokenController
  });
  fastify.patch("/my-token/rotate", {
    ...auth,
    config: {
      rateLimit: { max: 5, timeWindow: 10 * 60 * 1e3, ban: 2 }
    },
    schema: {
      tags: ["my-token"],
      summary: "Rotacionar token pessoal com novo token v\xE1lido (respeita cooldown)",
      security,
      body: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", minLength: 10 }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            id: { type: "number" },
            is_valid: { type: "boolean" },
            updated_at: { type: "string" }
          }
        },
        404: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } },
        422: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } },
        429: { type: "object", properties: { error: { type: "string" }, message: { type: "string" }, meta: { type: "object" } } }
      }
    },
    handler: rotateMyTokenController
  });
}

// src/selfbot/functions/user-client.ts
import { Client as Client3 } from "discord.js-selfbot-v13";
async function createUserClient(token) {
  const client = new Client3({
    checkUpdate: false,
    partials: ["MESSAGE", "CHANNEL", "USER"]
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.destroy();
      reject(new AppError(422, "INVALID_TOKEN", "Token Discord inv\xE1lido ou expirado"));
    }, 15e3);
    client.on("ready", () => {
      clearTimeout(timeout);
      resolve();
    });
    client.on("error", (err) => {
      clearTimeout(timeout);
      client.destroy();
      reject(new AppError(422, "INVALID_TOKEN", `Erro ao conectar com token: ${err.message}`));
    });
    client.login(token).catch(() => {
      clearTimeout(timeout);
      client.destroy();
      reject(new AppError(422, "INVALID_TOKEN", "Token Discord inv\xE1lido ou expirado"));
    });
  });
  return client;
}
function destroyUserClient(client) {
  client.destroy();
}

// src/modules/utils/service.ts
async function getValidMyToken(usuarioId) {
  const myToken = await findMyTokenByUser(usuarioId);
  if (!myToken?.is_valid) {
    throw new AppError(403, "NO_VALID_TOKEN", "Adicione um token v\xE1lido em POST /my-token/add antes de usar este recurso");
  }
  return myToken.token;
}
async function validateDiscordTokenService(token) {
  return validateTokenWithUserInfo(token);
}
async function getDiscordUserService(discordUserId) {
  const user = await fetchDiscordUser(discordUserId);
  if (!user) {
    throw new AppError(503, "NO_MONITORING_CLIENT", "Nenhuma conta de monitoramento ativa dispon\xEDvel para buscar informa\xE7\xF5es");
  }
  return user;
}
async function getGuildChannelsService(usuarioId, guildId) {
  const token = await getValidMyToken(usuarioId);
  const client = await createUserClient(token);
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) throw new AppError(404, "GUILD_NOT_FOUND", "Servidor n\xE3o encontrado ou voc\xEA n\xE3o est\xE1 nele");
    const channels = [...guild.channels.cache.values()].map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      position: c.rawPosition ?? 0,
      parent_id: c.parentId ?? null
    }));
    return { guild_id: guild.id, guild_name: guild.name, channels };
  } finally {
    destroyUserClient(client);
  }
}
async function getDmChannelsService(usuarioId) {
  const token = await getValidMyToken(usuarioId);
  const client = await createUserClient(token);
  try {
    const channels = [...client.channels.cache.values()].filter((c) => c.type === "DM").map((c) => ({
      id: c.id,
      recipient_id: c.recipient?.id ?? null,
      recipient_username: c.recipient?.username ?? null,
      recipient_global_name: c.recipient?.globalName ?? null,
      recipient_avatar: c.recipient?.avatar ?? null
    }));
    return { channels };
  } finally {
    destroyUserClient(client);
  }
}

// src/modules/utils/controller.ts
async function validateDiscordTokenController(request, reply) {
  const result = await validateDiscordTokenService(request.body.token);
  return reply.send(result);
}
async function getDiscordUserController(request, reply) {
  const user = await getDiscordUserService(request.params.id);
  return reply.send(user);
}
async function getGuildChannelsController(request, reply) {
  const data = await getGuildChannelsService(request.user.sub, request.params.guildId);
  return reply.send(data);
}
async function getDmChannelsController(request, reply) {
  const data = await getDmChannelsService(request.user.sub);
  return reply.send(data);
}

// src/modules/utils/routes.ts
var SNOWFLAKE = "^[0-9]{17,20}$";
async function utilsRoutes(fastify) {
  fastify.post("/utils/validate-discord-token", {
    config: {
      rateLimit: { max: 5, timeWindow: 10 * 60 * 1e3, ban: 2 }
    },
    schema: {
      tags: ["utilit\xE1rios"],
      summary: "Validar token Discord e retornar informa\xE7\xF5es do usu\xE1rio",
      body: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", minLength: 10 }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            valid: { type: "boolean" },
            user: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                username: { type: "string" },
                discriminator: { type: "string" },
                global_name: { type: "string", nullable: true },
                avatar: { type: "string", nullable: true },
                email: { type: "string", nullable: true },
                phone: { type: "string", nullable: true },
                mfa_enabled: { type: "boolean" },
                guild_count: { type: "number" },
                guilds: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" }
                    }
                  }
                },
                friend_count: { type: "number" },
                friends: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      username: { type: "string" },
                      global_name: { type: "string", nullable: true },
                      avatar: { type: "string", nullable: true },
                      discriminator: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: validateDiscordTokenController
  });
  fastify.get("/utils/discord-user/:id", {
    config: {
      rateLimit: { max: 30, timeWindow: 60 * 1e3 }
    },
    schema: {
      tags: ["utilit\xE1rios"],
      summary: "Buscar informa\xE7\xF5es p\xFAblicas de um usu\xE1rio Discord por ID",
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", pattern: "^[0-9]{17,20}$" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            id: { type: "string" },
            username: { type: "string" },
            username_global: { type: "string", nullable: true },
            avatar: { type: "string", nullable: true }
          }
        },
        503: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } }
      }
    },
    handler: getDiscordUserController
  });
  const auth = { onRequest: [fastify.authenticate] };
  const security = [{ bearerAuth: [] }];
  fastify.get("/utils/guild-channels/:guildId", {
    ...auth,
    config: { rateLimit: { max: 10, timeWindow: 60 * 1e3 } },
    schema: {
      tags: ["utilit\xE1rios"],
      summary: "Listar canais de um servidor (usa my-token)",
      description: "Retorna todos os canais do servidor. \xDAtil para montar a lista de ignored_channel_ids antes de usar /clear-chat/server.",
      security,
      params: {
        type: "object",
        required: ["guildId"],
        properties: {
          guildId: { type: "string", pattern: SNOWFLAKE }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            guild_id: { type: "string" },
            guild_name: { type: "string" },
            channels: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string" },
                  position: { type: "number" },
                  parent_id: { type: "string", nullable: true }
                }
              }
            }
          }
        },
        403: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } },
        404: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } }
      }
    },
    handler: getGuildChannelsController
  });
  fastify.get("/utils/dm-channels", {
    ...auth,
    config: { rateLimit: { max: 5, timeWindow: 60 * 1e3 } },
    schema: {
      tags: ["utilit\xE1rios"],
      summary: "Listar DMs abertos (usa my-token)",
      description: "Retorna todos os canais de DM abertos no cliente. \xDAtil para montar ignored_channel_ids antes de usar /clear-chat/dms ou /tools/close-dm.",
      security,
      response: {
        200: {
          type: "object",
          properties: {
            channels: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  recipient_id: { type: "string", nullable: true },
                  recipient_username: { type: "string", nullable: true },
                  recipient_global_name: { type: "string", nullable: true },
                  recipient_avatar: { type: "string", nullable: true }
                }
              }
            }
          }
        },
        403: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } }
      }
    },
    handler: getDmChannelsController
  });
}

// src/selfbot/functions/process-tracker.ts
var activeProcesses = /* @__PURE__ */ new Map();
function startProcess(usuarioId) {
  if (activeProcesses.has(usuarioId)) {
    throw new AppError(409, "PROCESS_ALREADY_RUNNING", "J\xE1 existe um processo em execu\xE7\xE3o. Cancele-o antes de iniciar outro.");
  }
  const controller = new AbortController();
  activeProcesses.set(usuarioId, controller);
  return controller;
}
function cancelProcess(usuarioId) {
  const controller = activeProcesses.get(usuarioId);
  if (!controller) return false;
  controller.abort();
  activeProcesses.delete(usuarioId);
  return true;
}
function clearProcess(usuarioId) {
  activeProcesses.delete(usuarioId);
}
function hasActiveProcess(usuarioId) {
  return activeProcesses.has(usuarioId);
}

// src/modules/tools/service.ts
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function getValidMyToken2(usuarioId) {
  const myToken = await findMyTokenByUser(usuarioId);
  if (!myToken?.is_valid) {
    throw new AppError(403, "NO_VALID_TOKEN", "Adicione um token v\xE1lido em POST /my-token/add antes de usar automa\xE7\xF5es");
  }
  return myToken.token;
}
function cancelCurrentProcessService(usuarioId) {
  return cancelProcess(usuarioId);
}
function getAutomationStatusService(usuarioId) {
  return { active: hasActiveProcess(usuarioId) };
}
async function closeDmsService(usuarioId, ignoredChannelIds) {
  if (PLAN_RULES.tools.premium_only) await assertPremiumOrAdmin(usuarioId);
  const token = await getValidMyToken2(usuarioId);
  const controller = startProcess(usuarioId);
  void (async () => {
    let client;
    try {
      client = await createUserClient(token);
      const dmChannels = [...client.channels.cache.values()].filter((c) => c.type === "DM");
      for (const channel of dmChannels) {
        if (controller.signal.aborted) break;
        if (ignoredChannelIds.includes(channel.id)) continue;
        try {
          await channel.delete();
        } catch {
        }
        await sleep(PLAN_RULES.tools.action_delay_ms);
      }
    } catch (err) {
      console.error("[closeDmsService]", err);
    } finally {
      if (client) destroyUserClient(client);
      clearProcess(usuarioId);
    }
  })();
}
async function leaveServersService(usuarioId, ignoredGuildIds) {
  if (PLAN_RULES.tools.premium_only) await assertPremiumOrAdmin(usuarioId);
  const token = await getValidMyToken2(usuarioId);
  const controller = startProcess(usuarioId);
  void (async () => {
    let client;
    try {
      client = await createUserClient(token);
      const guilds = [...client.guilds.cache.values()];
      for (const guild of guilds) {
        if (controller.signal.aborted) break;
        if (ignoredGuildIds.includes(guild.id)) continue;
        try {
          await guild.leave();
        } catch {
        }
        await sleep(PLAN_RULES.tools.action_delay_ms);
      }
    } catch (err) {
      console.error("[leaveServersService]", err);
    } finally {
      if (client) destroyUserClient(client);
      clearProcess(usuarioId);
    }
  })();
}
async function deleteRelationshipsService(usuarioId, ignoredUserIds) {
  if (PLAN_RULES.tools.premium_only) await assertPremiumOrAdmin(usuarioId);
  const token = await getValidMyToken2(usuarioId);
  const controller = startProcess(usuarioId);
  void (async () => {
    let client;
    try {
      client = await createUserClient(token);
      const relationships = client.relationships?.cache;
      if (relationships) {
        for (const [userId] of relationships) {
          if (controller.signal.aborted) break;
          if (ignoredUserIds.includes(userId)) continue;
          try {
            await client.relationships.deleteRelationship(userId);
          } catch {
          }
          await sleep(PLAN_RULES.tools.action_delay_ms);
        }
      }
    } catch (err) {
      console.error("[deleteRelationshipsService]", err);
    } finally {
      if (client) destroyUserClient(client);
      clearProcess(usuarioId);
    }
  })();
}

// src/modules/tools/controller.ts
async function cancelCurrentProcessController(request, reply) {
  const cancelled = cancelCurrentProcessService(request.user.sub);
  return reply.send({
    message: cancelled ? "Processo cancelado com sucesso" : "Nenhum processo em execu\xE7\xE3o",
    cancelled
  });
}
async function getAutomationStatusController(request, reply) {
  return reply.send(getAutomationStatusService(request.user.sub));
}
async function closeDmsController(request, reply) {
  await closeDmsService(request.user.sub, request.body.ignored_channel_ids ?? []);
  return reply.code(202).send({ message: "Processo iniciado. Use POST /tools/cancel-current-process para cancelar." });
}
async function leaveServersController(request, reply) {
  await leaveServersService(request.user.sub, request.body.ignored_guild_ids ?? []);
  return reply.code(202).send({ message: "Processo iniciado. Use POST /tools/cancel-current-process para cancelar." });
}
async function deleteRelationshipsController(request, reply) {
  await deleteRelationshipsService(request.user.sub, request.body.ignored_user_ids ?? []);
  return reply.code(202).send({ message: "Processo iniciado. Use POST /tools/cancel-current-process para cancelar." });
}

// src/modules/tools/routes.ts
var automationRateLimit = {
  config: {
    rateLimit: { max: 3, timeWindow: 60 * 60 * 1e3, ban: 2 }
  }
};
async function toolsRoutes(fastify) {
  const auth = { onRequest: [fastify.authenticate] };
  const security = [{ bearerAuth: [] }];
  fastify.get("/tools/status", {
    ...auth,
    schema: {
      tags: ["automa\xE7\xF5es"],
      summary: "Verificar se h\xE1 um processo de automa\xE7\xE3o em execu\xE7\xE3o",
      security,
      response: {
        200: {
          type: "object",
          properties: {
            active: { type: "boolean", description: "true se h\xE1 um processo rodando em background" }
          }
        }
      }
    },
    handler: getAutomationStatusController
  });
  fastify.post("/tools/cancel-current-process", {
    ...auth,
    schema: {
      tags: ["automa\xE7\xF5es"],
      summary: "Cancelar processo de automa\xE7\xE3o em andamento",
      security,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            cancelled: { type: "boolean" }
          }
        }
      }
    },
    handler: cancelCurrentProcessController
  });
  fastify.post("/tools/close-dm", {
    ...auth,
    ...automationRateLimit,
    schema: {
      tags: ["automa\xE7\xF5es"],
      summary: "Fechar todos os DMs do usu\xE1rio (exceto os ignorados)",
      security,
      body: {
        type: "object",
        properties: {
          ignored_channel_ids: { type: "array", items: { type: "string" }, default: [] }
        }
      },
      response: {
        202: {
          type: "object",
          properties: { message: { type: "string" } }
        },
        403: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } },
        409: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } }
      }
    },
    handler: closeDmsController
  });
  fastify.post("/tools/leave-server", {
    ...auth,
    ...automationRateLimit,
    schema: {
      tags: ["automa\xE7\xF5es"],
      summary: "Sair de todos os servidores (exceto os ignorados)",
      security,
      body: {
        type: "object",
        properties: {
          ignored_guild_ids: { type: "array", items: { type: "string" }, default: [] }
        }
      },
      response: {
        202: {
          type: "object",
          properties: { message: { type: "string" } }
        },
        403: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } },
        409: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } }
      }
    },
    handler: leaveServersController
  });
  fastify.post("/tools/delete-relationships", {
    ...auth,
    ...automationRateLimit,
    schema: {
      tags: ["automa\xE7\xF5es"],
      summary: "Deletar todas as rela\xE7\xF5es do usu\xE1rio (exceto os ignorados)",
      security,
      body: {
        type: "object",
        properties: {
          ignored_user_ids: { type: "array", items: { type: "string" }, default: [] }
        }
      },
      response: {
        202: {
          type: "object",
          properties: { message: { type: "string" } }
        },
        403: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } },
        409: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } }
      }
    },
    handler: deleteRelationshipsController
  });
}

// src/selfbot/functions/delete-messages.ts
var sleep2 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var AdaptiveDelay = class {
  current;
  base;
  bumpedAt = 0;
  constructor(baseMs) {
    this.base = baseMs;
    this.current = baseMs;
  }
  /** Aumenta o delay após um rate limit (monotônico) */
  bump(retryAfterMs = 0) {
    this.bumpedAt = Date.now();
    this.current = Math.min(3e4, Math.max(this.current * 2, retryAfterMs + 500));
  }
  /** Retorna delay atual com decaimento de meia-vida (30s) de volta à base */
  get() {
    if (this.current > this.base && this.bumpedAt > 0) {
      const elapsed = Date.now() - this.bumpedAt;
      const factor = Math.pow(0.5, elapsed / 3e4);
      this.current = Math.max(this.base, this.base + (this.current - this.base) * factor);
    }
    return Math.ceil(this.current);
  }
};
async function deleteMessagesInChannel(channel, opts) {
  let deleted = 0;
  let before = opts.maxId;
  const targetAuthors = opts.authorIds.length > 0 ? opts.authorIds : [opts.selfId];
  const searchDelay = PLAN_RULES.clear_chat.search_delay_ms;
  outer: while (!opts.controller.signal.aborted) {
    if (opts.remaining.value !== null && opts.remaining.value <= 0) break;
    const fetchOpts = { limit: 100 };
    if (before) fetchOpts.before = before;
    let messages;
    try {
      messages = await channel.messages.fetch(fetchOpts);
    } catch {
      break;
    }
    if (messages.size === 0) break;
    const sorted = [...messages.values()].sort(
      (a, b) => BigInt(b.id) > BigInt(a.id) ? 1 : BigInt(b.id) < BigInt(a.id) ? -1 : 0
    );
    before = sorted.at(-1)?.id;
    for (const message of sorted) {
      if (opts.controller.signal.aborted) break outer;
      if (opts.remaining.value !== null && opts.remaining.value <= 0) break outer;
      if (opts.minId && BigInt(message.id) <= BigInt(opts.minId)) {
        before = void 0;
        break outer;
      }
      if (!targetAuthors.includes(message.author?.id ?? "")) continue;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await message.delete();
          deleted++;
          if (opts.remaining.value !== null) opts.remaining.value--;
          await sleep2(opts.delay.get());
          break;
        } catch (err) {
          const e = err;
          if (e?.code === 10008 || e?.code === 50013) break;
          if (e?.httpStatus === 429) {
            opts.delay.bump((e?.retryAfter ?? 1) * 1e3);
            await sleep2(opts.delay.get());
          } else if ((e?.httpStatus ?? 0) >= 500) {
            await sleep2(2e3 * (attempt + 1));
          } else {
            break;
          }
        }
      }
    }
    if (!before) break;
    await sleep2(searchDelay);
  }
  return deleted;
}

// src/modules/clear-chat/repository.ts
async function findClearChatUsage(usuarioId) {
  return prisma_default.clear_chat_usage.findUnique({ where: { usuario_id: usuarioId } });
}
async function upsertClearChatUsage(usuarioId, data) {
  return prisma_default.clear_chat_usage.upsert({
    where: { usuario_id: usuarioId },
    create: { usuario_id: usuarioId, ...data },
    update: data
  });
}
async function incrementMessageCount(usuarioId, count) {
  return prisma_default.clear_chat_usage.update({
    where: { usuario_id: usuarioId },
    data: { messages_deleted: { increment: count } }
  });
}

// src/modules/clear-chat/service.ts
async function assertPlanPermission(usuarioId) {
  const userPlan = await findUserPlanInfo(usuarioId);
  if (!userPlan) throw new AppError(404, "USER_NOT_FOUND", "Usu\xE1rio n\xE3o encontrado");
  const premium = isPremiumActive(userPlan);
  if (PLAN_RULES.clear_chat.premium_only && !premium && !userPlan.is_admin) {
    throw new AppError(403, "PREMIUM_REQUIRED", "Este recurso \xE9 exclusivo para usu\xE1rios premium");
  }
  if (premium || userPlan.is_admin) {
    return { isPremium: premium, isAdmin: userPlan.is_admin, remainingQuota: null };
  }
  const cooldownMs = PLAN_RULES.clear_chat.freemium_cooldown_hours * 60 * 60 * 1e3;
  const now = /* @__PURE__ */ new Date();
  const usage = await findClearChatUsage(usuarioId);
  if (usage && new Date(usage.period_start_at.getTime() + cooldownMs) > now) {
    const remaining = PLAN_RULES.clear_chat.freemium_max_deletions - usage.messages_deleted;
    if (remaining <= 0) {
      const periodEnd = new Date(usage.period_start_at.getTime() + cooldownMs);
      throw new AppError(
        429,
        "DELETION_LIMIT_REACHED",
        `Limite de ${PLAN_RULES.clear_chat.freemium_max_deletions} mensagens atingido. Aguarde at\xE9 ${periodEnd.toISOString()}.`,
        { liberado_em: periodEnd.toISOString() }
      );
    }
    return { isPremium: false, isAdmin: false, remainingQuota: remaining };
  }
  await upsertClearChatUsage(usuarioId, { messages_deleted: 0, period_start_at: now });
  return { isPremium: false, isAdmin: false, remainingQuota: PLAN_RULES.clear_chat.freemium_max_deletions };
}
async function getValidToken(usuarioId) {
  const myToken = await findMyTokenByUser(usuarioId);
  if (!myToken?.is_valid) {
    throw new AppError(
      403,
      "NO_VALID_TOKEN",
      "Adicione um token v\xE1lido em POST /my-token/add antes de usar automa\xE7\xF5es"
    );
  }
  return myToken.token;
}
async function trackDeletions(usuarioId, access, deleted) {
  if (!access.isPremium && !access.isAdmin && deleted > 0) {
    await incrementMessageCount(usuarioId, deleted).catch(() => {
    });
  }
}
var TEXT_CHANNEL_TYPES = /* @__PURE__ */ new Set(["GUILD_TEXT", "GUILD_NEWS", "GUILD_ANNOUNCEMENT", "GUILD_FORUM"]);
function cancelClearChatService(usuarioId) {
  return cancelProcess(usuarioId);
}
async function clearChannelService(usuarioId, params) {
  const token = await getValidToken(usuarioId);
  const access = await assertPlanPermission(usuarioId);
  const controller = startProcess(usuarioId);
  let client;
  void (async () => {
    try {
      client = await createUserClient(token);
      const selfId = client.user.id;
      const channel = await client.channels.fetch(params.channel_id).catch(() => null);
      if (!channel) {
        console.error("[clearChannelService] Canal n\xE3o encontrado:", params.channel_id);
        return;
      }
      const delay = new AdaptiveDelay(PLAN_RULES.clear_chat.base_delete_delay_ms);
      const remaining = { value: access.remainingQuota };
      const deleted = await deleteMessagesInChannel(channel, {
        selfId,
        controller,
        delay,
        remaining,
        authorIds: params.author_ids ?? [],
        minId: params.min_id,
        maxId: params.max_id
      });
      await trackDeletions(usuarioId, access, deleted);
    } catch (err) {
      console.error("[clearChannelService]", err);
    } finally {
      if (client) destroyUserClient(client);
      clearProcess(usuarioId);
    }
  })();
}
async function clearServerService(usuarioId, params) {
  const token = await getValidToken(usuarioId);
  const access = await assertPlanPermission(usuarioId);
  const controller = startProcess(usuarioId);
  let client;
  void (async () => {
    let totalDeleted = 0;
    try {
      client = await createUserClient(token);
      const selfId = client.user.id;
      const guild = client.guilds.cache.get(params.guild_id);
      if (!guild) {
        console.error("[clearServerService] Servidor n\xE3o encontrado:", params.guild_id);
        return;
      }
      const ignoredIds = new Set(params.ignored_channel_ids ?? []);
      const channels = [...guild.channels.cache.values()].filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c) => TEXT_CHANNEL_TYPES.has(c.type) && !ignoredIds.has(c.id)
      );
      const delay = new AdaptiveDelay(PLAN_RULES.clear_chat.base_delete_delay_ms);
      const remaining = { value: access.remainingQuota };
      for (const channel of channels) {
        if (controller.signal.aborted) break;
        if (remaining.value !== null && remaining.value <= 0) break;
        const deleted = await deleteMessagesInChannel(channel, {
          selfId,
          controller,
          delay,
          remaining,
          authorIds: params.author_ids ?? [],
          minId: params.min_id,
          maxId: params.max_id
        });
        totalDeleted += deleted;
      }
      await trackDeletions(usuarioId, access, totalDeleted);
    } catch (err) {
      console.error("[clearServerService]", err);
    } finally {
      if (client) destroyUserClient(client);
      clearProcess(usuarioId);
    }
  })();
}
async function clearDmMessagesService(usuarioId, params) {
  const token = await getValidToken(usuarioId);
  const access = await assertPlanPermission(usuarioId);
  const controller = startProcess(usuarioId);
  let client;
  void (async () => {
    let totalDeleted = 0;
    try {
      client = await createUserClient(token);
      const selfId = client.user.id;
      const ignoredIds = new Set(params.ignored_channel_ids ?? []);
      const dmChannels = [...client.channels.cache.values()].filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c) => c.type === "DM" && !ignoredIds.has(c.id)
      );
      const delay = new AdaptiveDelay(PLAN_RULES.clear_chat.base_delete_delay_ms);
      const remaining = { value: access.remainingQuota };
      for (const channel of dmChannels) {
        if (controller.signal.aborted) break;
        if (remaining.value !== null && remaining.value <= 0) break;
        const deleted = await deleteMessagesInChannel(channel, {
          selfId,
          controller,
          delay,
          remaining,
          authorIds: params.author_ids ?? [],
          minId: params.min_id,
          maxId: params.max_id
        });
        totalDeleted += deleted;
      }
      await trackDeletions(usuarioId, access, totalDeleted);
    } catch (err) {
      console.error("[clearDmMessagesService]", err);
    } finally {
      if (client) destroyUserClient(client);
      clearProcess(usuarioId);
    }
  })();
}

// src/modules/clear-chat/controller.ts
async function cancelClearChatController(_request, reply) {
  const cancelled = cancelClearChatService(_request.user.sub);
  return reply.send({
    message: cancelled ? "Processo de exclus\xE3o cancelado" : "Nenhum processo em execu\xE7\xE3o",
    cancelled
  });
}
async function clearChannelController(request, reply) {
  await clearChannelService(request.user.sub, request.body);
  return reply.code(202).send({ message: "Processo iniciado. Use POST /clear-chat/cancel para cancelar." });
}
async function clearServerController(request, reply) {
  await clearServerService(request.user.sub, request.body);
  return reply.code(202).send({ message: "Processo iniciado. Use POST /clear-chat/cancel para cancelar." });
}
async function clearDmsController(request, reply) {
  await clearDmMessagesService(request.user.sub, request.body);
  return reply.code(202).send({ message: "Processo iniciado. Use POST /clear-chat/cancel para cancelar." });
}

// src/modules/clear-chat/routes.ts
var SNOWFLAKE_PATTERN = "^[0-9]{15,21}$";
var commonOptionalFields = {
  author_ids: {
    type: "array",
    items: { type: "string", pattern: SNOWFLAKE_PATTERN },
    maxItems: 20,
    description: "IDs dos autores cujas mensagens ser\xE3o exclu\xEDdas. Padr\xE3o: apenas suas pr\xF3prias mensagens."
  },
  min_id: {
    type: "string",
    pattern: SNOWFLAKE_PATTERN,
    description: "ID m\xEDnimo de mensagem (limite inferior, n\xE3o incluso)."
  },
  max_id: {
    type: "string",
    pattern: SNOWFLAKE_PATTERN,
    description: "ID m\xE1ximo de mensagem (ponto de partida, mais recente)."
  }
};
var acceptedSchema = {
  type: "object",
  properties: {
    message: { type: "string", description: "Processo iniciado em background" }
  }
};
async function clearChatRoutes(app) {
  const auth = { onRequest: [app.authenticate] };
  const security = [{ bearerAuth: [] }];
  app.post("/clear-chat/cancel", {
    ...auth,
    config: { rateLimit: { max: 20, timeWindow: "1 hour" } },
    schema: {
      tags: ["clear-chat"],
      summary: "Cancela o processo de exclus\xE3o em andamento",
      security,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            cancelled: { type: "boolean" }
          }
        }
      }
    },
    handler: cancelClearChatController
  });
  app.post("/clear-chat/channel", {
    ...auth,
    config: { rateLimit: { max: 5, timeWindow: "1 hour" } },
    schema: {
      tags: ["clear-chat"],
      summary: "Exclui mensagens em um canal espec\xEDfico",
      description: "Usa o token de my-token para excluir mensagens no canal informado. Freemium: limite de 500 mensagens por per\xEDodo de 24h. Apenas 1 processo por vez.",
      security,
      body: {
        type: "object",
        required: ["channel_id"],
        properties: {
          channel_id: {
            type: "string",
            pattern: SNOWFLAKE_PATTERN,
            description: "ID do canal Discord onde as mensagens ser\xE3o exclu\xEDdas"
          },
          ...commonOptionalFields
        }
      },
      response: { 202: acceptedSchema }
    },
    handler: clearChannelController
  });
  app.post("/clear-chat/server", {
    ...auth,
    config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
    schema: {
      tags: ["clear-chat"],
      summary: "Exclui mensagens em todos os canais de um servidor",
      description: "Itera por todos os canais de texto do servidor e exclui as mensagens correspondentes ao filtro. Use ignored_channel_ids para pular canais espec\xEDficos.",
      security,
      body: {
        type: "object",
        required: ["guild_id"],
        properties: {
          guild_id: {
            type: "string",
            pattern: SNOWFLAKE_PATTERN,
            description: "ID do servidor (guild) Discord"
          },
          ignored_channel_ids: {
            type: "array",
            items: { type: "string", pattern: SNOWFLAKE_PATTERN },
            maxItems: 100,
            description: "IDs de canais a ignorar durante a varredura"
          },
          ...commonOptionalFields
        }
      },
      response: { 202: acceptedSchema }
    },
    handler: clearServerController
  });
  app.post("/clear-chat/dms", {
    ...auth,
    config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
    schema: {
      tags: ["clear-chat"],
      summary: "Exclui mensagens em todos os canais de DM abertos",
      description: "Itera por todos os canais de DM do cliente e exclui as mensagens correspondentes. Use ignored_channel_ids para pular DMs espec\xEDficas.",
      security,
      body: {
        type: "object",
        properties: {
          ignored_channel_ids: {
            type: "array",
            items: { type: "string", pattern: SNOWFLAKE_PATTERN },
            maxItems: 200,
            description: "IDs de canais de DM a ignorar"
          },
          ...commonOptionalFields
        }
      },
      response: { 202: acceptedSchema }
    },
    handler: clearDmsController
  });
}

// src/modules/me/service.ts
import bcrypt2 from "bcrypt";

// src/modules/me/repository.ts
async function findMeProfile(usuarioId) {
  return prisma_default.usuarios.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      username: true,
      email: true,
      is_premium: true,
      is_admin: true,
      premium_expires_at: true,
      referral_code: true,
      referral_count: true,
      created_at: true,
      clear_chat_usage: {
        select: { messages_deleted: true, period_start_at: true }
      },
      my_token: {
        select: { is_valid: true }
      }
    }
  });
}
async function findReferrals(usuarioId) {
  return prisma_default.usuarios.findMany({
    where: { referred_by_id: usuarioId },
    select: { username: true, created_at: true },
    orderBy: { created_at: "desc" }
  });
}
async function findPasswordById(usuarioId) {
  return prisma_default.usuarios.findUnique({
    where: { id: usuarioId },
    select: { password: true }
  });
}
async function updatePassword(usuarioId, newPasswordHash) {
  return prisma_default.usuarios.update({
    where: { id: usuarioId },
    data: { password: newPasswordHash },
    select: { id: true }
  });
}

// src/modules/me/service.ts
async function getMeService(usuarioId) {
  const user = await findMeProfile(usuarioId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usu\xE1rio n\xE3o encontrado");
  const premium = isPremiumActive(user);
  const plan = user.is_admin ? "admin" : premium ? "premium" : "freemium";
  let clearChat;
  if (premium || user.is_admin) {
    clearChat = { messages_deleted: null, messages_remaining: null, period_start_at: null, period_resets_at: null };
  } else {
    const cooldownMs = PLAN_RULES.clear_chat.freemium_cooldown_hours * 60 * 60 * 1e3;
    const now = /* @__PURE__ */ new Date();
    const usage = user.clear_chat_usage;
    if (usage && new Date(usage.period_start_at.getTime() + cooldownMs) > now) {
      const remaining = Math.max(0, PLAN_RULES.clear_chat.freemium_max_deletions - usage.messages_deleted);
      const periodResetsAt = new Date(usage.period_start_at.getTime() + cooldownMs);
      clearChat = {
        messages_deleted: usage.messages_deleted,
        messages_remaining: remaining,
        period_start_at: usage.period_start_at.toISOString(),
        period_resets_at: periodResetsAt.toISOString()
      };
    } else {
      clearChat = {
        messages_deleted: 0,
        messages_remaining: PLAN_RULES.clear_chat.freemium_max_deletions,
        period_start_at: null,
        period_resets_at: null
      };
    }
  }
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    plan,
    is_admin: user.is_admin,
    premium_expires_at: user.premium_expires_at?.toISOString() ?? null,
    referral_code: user.referral_code,
    referral_count: user.referral_count,
    created_at: user.created_at.toISOString(),
    my_token: {
      has_token: user.my_token !== null,
      is_valid: user.my_token?.is_valid ?? false
    },
    clear_chat: clearChat
  };
}
async function getReferralsService(usuarioId) {
  const items = await findReferrals(usuarioId);
  return { items, total: items.length };
}
async function changePasswordService(usuarioId, currentPassword, newPassword) {
  const user = await findPasswordById(usuarioId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usu\xE1rio n\xE3o encontrado");
  const valid = await bcrypt2.compare(currentPassword, user.password);
  if (!valid) throw new AppError(401, "INVALID_PASSWORD", "Senha atual incorreta");
  const hash = await bcrypt2.hash(newPassword, 12);
  await updatePassword(usuarioId, hash);
}

// src/modules/me/controller.ts
async function getMeController(request, reply) {
  const data = await getMeService(request.user.sub);
  return reply.send(data);
}
async function getReferralsController(request, reply) {
  const data = await getReferralsService(request.user.sub);
  return reply.send(data);
}
async function changePasswordController(request, reply) {
  await changePasswordService(request.user.sub, request.body.current_password, request.body.new_password);
  return reply.send({ message: "Senha atualizada com sucesso" });
}

// src/modules/me/routes.ts
async function meRoutes(fastify) {
  const auth = { onRequest: [fastify.authenticate] };
  const security = [{ bearerAuth: [] }];
  fastify.get("/me", {
    ...auth,
    schema: {
      tags: ["me"],
      summary: "Perfil do usu\xE1rio autenticado com status do plano e quotas",
      security,
      response: {
        200: {
          type: "object",
          properties: {
            id: { type: "number" },
            username: { type: "string" },
            email: { type: "string" },
            plan: { type: "string", enum: ["freemium", "premium", "admin"] },
            is_admin: { type: "boolean" },
            premium_expires_at: { type: "string", nullable: true },
            referral_code: { type: "string" },
            referral_count: { type: "number" },
            created_at: { type: "string" },
            my_token: {
              type: "object",
              properties: {
                has_token: { type: "boolean" },
                is_valid: { type: "boolean" }
              }
            },
            clear_chat: {
              type: "object",
              description: "Quota de exclus\xE3o de mensagens. null = ilimitado (premium/admin)",
              properties: {
                messages_deleted: { type: "number", nullable: true },
                messages_remaining: { type: "number", nullable: true },
                period_start_at: { type: "string", nullable: true },
                period_resets_at: { type: "string", nullable: true }
              }
            }
          }
        }
      }
    },
    handler: getMeController
  });
  fastify.get("/me/referrals", {
    ...auth,
    schema: {
      tags: ["me"],
      summary: "Usu\xE1rios que se registraram usando seu c\xF3digo de indica\xE7\xE3o",
      security,
      response: {
        200: {
          type: "object",
          properties: {
            total: { type: "number" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  created_at: { type: "string" }
                }
              }
            }
          }
        }
      }
    },
    handler: getReferralsController
  });
  fastify.patch("/me/password", {
    ...auth,
    config: { rateLimit: { max: 5, timeWindow: 15 * 60 * 1e3, ban: 2 } },
    schema: {
      tags: ["me"],
      summary: "Alterar senha da conta",
      security,
      body: {
        type: "object",
        required: ["current_password", "new_password"],
        properties: {
          current_password: { type: "string", minLength: 1 },
          new_password: { type: "string", minLength: 6 }
        }
      },
      response: {
        200: {
          type: "object",
          properties: { message: { type: "string" } }
        },
        401: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } }
      }
    },
    handler: changePasswordController
  });
}

// src/app.ts
async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "warn" : "info"
    }
  });
  fastify.addContentTypeParser("application/json", { parseAs: "string" }, function(_req, body, done) {
    try {
      const safe = body.replace(/([:,\[])\s*(\d{16,})(?=[\s,\]\}])/g, '$1 "$2"');
      done(null, JSON.parse(safe));
    } catch (err) {
      done(err, void 0);
    }
  });
  await fastify.register(cors, { origin: true });
  await fastify.register(cookie);
  if (process.env.SWAGGER_ENABLED !== "false") {
    await fastify.register(swagger_default);
  }
  await fastify.register(auth_default);
  await fastify.register(rate_limit_default);
  fastify.get("/health", { schema: { hide: true } }, async () => {
    await prisma_default.$queryRaw`SELECT 1`;
    return { status: "ok" };
  });
  await fastify.register(authRoutes);
  await fastify.register(monitoringRoutes);
  await fastify.register(targetRoutes);
  await fastify.register(messageRoutes);
  await fastify.register(eventRoutes);
  await fastify.register(serverRoutes);
  await fastify.register(paymentRoutes);
  await fastify.register(webhookRoutes);
  await fastify.register(myTokenRoutes);
  await fastify.register(utilsRoutes);
  await fastify.register(toolsRoutes);
  await fastify.register(clearChatRoutes);
  await fastify.register(meRoutes);
  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
        ...error.meta ? { meta: error.meta } : {}
      });
    }
    if (error.validation) {
      return reply.code(400).send({ error: "VALIDATION_ERROR", message: error.message });
    }
    fastify.log.error(error);
    return reply.code(500).send({ error: "INTERNAL_ERROR", message: "Erro interno do servidor" });
  });
  return fastify;
}

// src/server.ts
var PORT = Number(process.env.PORT) || 3e3;
async function main() {
  const app = await buildApp();
  try {
    await prisma_default.$connect();
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`\u{1F680} API rodando em http://0.0.0.0:${PORT}`);
    console.log(`\u{1F4D6} Swagger dispon\xEDvel em http://localhost:${PORT}/api-docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
  try {
    const validTokens = await findAllValidTokens();
    if (validTokens.length > 0) {
      console.log(`[Selfbot] Iniciando ${validTokens.length} cliente(s) de monitoramento...`);
      await startAllValidClients(validTokens);
    } else {
      console.log("[Selfbot] Nenhum token v\xE1lido encontrado. Adicione tokens via API.");
    }
  } catch (err) {
    console.error("[Selfbot] Falha ao iniciar clientes selfbot (DB indispon\xEDvel?). API continua funcionando.", err);
  }
  const ONE_DAY_MS = 24 * 60 * 60 * 1e3;
  void checkAllUsersServerCountPremium();
  setInterval(() => void checkAllUsersServerCountPremium(), ONE_DAY_MS);
}
process.on("SIGINT", async () => {
  console.log("\n[Server] Encerrando...");
  await prisma_default.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma_default.$disconnect();
  process.exit(0);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Server] unhandledRejection capturada \u2014 processo mantido:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Server] uncaughtException capturada \u2014 processo mantido:", err.message);
});
main();
//# sourceMappingURL=server.js.map