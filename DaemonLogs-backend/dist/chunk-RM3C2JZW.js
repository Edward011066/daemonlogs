import {
  prisma_default
} from "./chunk-MV7YXRMU.js";

// src/modules/auth/repository.ts
async function findUsuarioByUsername(username) {
  return prisma_default.usuarios.findUnique({ where: { username } });
}
async function findUsuarioByEmail(email) {
  return prisma_default.usuarios.findUnique({ where: { email } });
}
async function findUsuarioById(id) {
  return prisma_default.usuarios.findUnique({ where: { id } });
}
async function findUsuarioByReferralCode(code) {
  return prisma_default.usuarios.findUnique({ where: { referral_code: code }, select: { id: true } });
}
async function createUsuario(data) {
  return prisma_default.usuarios.create({ data });
}
async function upsertUsuarioByDiscordId(data) {
  return prisma_default.usuarios.upsert({
    where: { discord_id: data.discord_id },
    update: { username: data.username },
    create: {
      discord_id: data.discord_id,
      username: data.username,
      email: data.email ?? null,
      password: null,
      is_activated: true,
      referral_code: data.referral_code
    }
  });
}
async function activateUsuario(id) {
  return prisma_default.usuarios.update({ where: { id }, data: { is_activated: true } });
}
async function incrementReferralCount(usuarioId) {
  return prisma_default.usuarios.update({
    where: { id: usuarioId },
    data: { referral_count: { increment: 1 } },
    select: { referral_count: true, is_premium: true, premium_expires_at: true }
  });
}
async function findActiveSession(usuarioId) {
  return prisma_default.sessions.findFirst({
    where: {
      usuario_id: usuarioId,
      expires_at: { gt: /* @__PURE__ */ new Date() }
    },
    orderBy: { created_at: "desc" }
  });
}
async function deleteAllSessionsForUser(usuarioId) {
  return prisma_default.sessions.deleteMany({ where: { usuario_id: usuarioId } });
}
async function createSession(data) {
  return prisma_default.sessions.create({ data });
}
async function deleteSession(jwtToken) {
  return prisma_default.sessions.deleteMany({ where: { jwt_token: jwtToken } });
}
async function findValidTokensForUser(usuarioId) {
  return prisma_default.contas_monitoramento.findMany({
    where: { usuario_id: usuarioId, is_valid: true },
    select: { id: true, token: true }
  });
}
async function markTokenInvalid(tokenId) {
  return prisma_default.contas_monitoramento.update({
    where: { id: tokenId },
    data: { is_valid: false }
  });
}
async function createEmailVerification(data) {
  return prisma_default.email_verifications.create({ data });
}
async function findEmailVerification(code) {
  return prisma_default.email_verifications.findUnique({ where: { code } });
}
async function markEmailVerificationUsed(id) {
  return prisma_default.email_verifications.update({ where: { id }, data: { used: true } });
}
async function deleteOldVerificationsForUser(usuarioId) {
  return prisma_default.email_verifications.deleteMany({ where: { usuario_id: usuarioId } });
}
async function createPasswordReset(data) {
  return prisma_default.password_resets.create({ data });
}
async function findPasswordReset(code) {
  return prisma_default.password_resets.findUnique({ where: { code } });
}
async function markPasswordResetUsed(id) {
  return prisma_default.password_resets.update({ where: { id }, data: { used: true } });
}
async function deleteOldPasswordResetsForUser(usuarioId) {
  return prisma_default.password_resets.deleteMany({ where: { usuario_id: usuarioId } });
}
async function updateUserPassword(usuarioId, hashedPassword) {
  return prisma_default.usuarios.update({ where: { id: usuarioId }, data: { password: hashedPassword } });
}

export {
  findUsuarioByUsername,
  findUsuarioByEmail,
  findUsuarioById,
  findUsuarioByReferralCode,
  createUsuario,
  upsertUsuarioByDiscordId,
  activateUsuario,
  incrementReferralCount,
  findActiveSession,
  deleteAllSessionsForUser,
  createSession,
  deleteSession,
  findValidTokensForUser,
  markTokenInvalid,
  createEmailVerification,
  findEmailVerification,
  markEmailVerificationUsed,
  deleteOldVerificationsForUser,
  createPasswordReset,
  findPasswordReset,
  markPasswordResetUsed,
  deleteOldPasswordResetsForUser,
  updateUserPassword
};
//# sourceMappingURL=chunk-RM3C2JZW.js.map