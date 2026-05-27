import {
  updateMonitoringValidity,
  validateToken
} from "../chunk-A7PPCHXN.js";
import {
  prisma_default
} from "../chunk-MV7YXRMU.js";

// src/workers/token-validator.ts
var INTERVAL_MS = Number(process.env.TOKEN_CHECK_INTERVAL_HOURS ?? 6) * 60 * 60 * 1e3;
var DELAY_MS = Number(process.env.TOKEN_CHECK_DELAY_MS ?? 5e3);
var API_URL = (process.env.API_INTERNAL_URL ?? "http://api:3000").replace(/\/$/, "");
var INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? "";
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function waitForDB() {
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma_default.$queryRaw`SELECT 1`;
      return;
    } catch {
      console.log(`[token-validator] Aguardando banco de dados... (tentativa ${i + 1}/${maxRetries})`);
      await sleep(5e3);
    }
  }
  throw new Error("[token-validator] N\xE3o foi poss\xEDvel conectar ao banco de dados ap\xF3s 10 tentativas");
}
async function notifyAPIDestroyClient(id) {
  if (!INTERNAL_SECRET) {
    console.warn("[token-validator] INTERNAL_SECRET n\xE3o configurado \u2014 cliente selfbot n\xE3o ser\xE1 destru\xEDdo via API");
    return;
  }
  try {
    const res = await fetch(`${API_URL}/internal/destroy-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SECRET
      },
      body: JSON.stringify({ id })
    });
    if (!res.ok) {
      console.warn(`[token-validator] API retornou HTTP ${res.status} ao destruir cliente id=${id}`);
    }
  } catch (err) {
    console.warn(`[token-validator] Falha ao notificar API para id=${id}:`, err);
  }
}
async function runCheckCycle() {
  const tokens = await prisma_default.contas_monitoramento.findMany({
    where: { is_valid: true },
    select: { id: true, token: true }
  });
  if (tokens.length === 0) {
    console.log("[token-validator] Nenhum token ativo para verificar");
    return;
  }
  console.log(`[token-validator] Ciclo iniciado: ${tokens.length} token(s) para verificar`);
  let invalidated = 0;
  for (let i = 0; i < tokens.length; i++) {
    const account = tokens[i];
    try {
      const valid = await validateToken(account.token);
      if (!valid) {
        await updateMonitoringValidity(account.id, false);
        await notifyAPIDestroyClient(account.id);
        console.log(`[token-validator] Token id=${account.id} invalidado`);
        invalidated++;
      }
    } catch (err) {
      console.error(`[token-validator] Erro ao verificar token id=${account.id}:`, err);
    }
    if (i < tokens.length - 1) {
      await sleep(DELAY_MS);
    }
  }
  console.log(`[token-validator] Ciclo conclu\xEDdo \u2014 ${invalidated} invalidado(s) de ${tokens.length}`);
}
async function main() {
  console.log("[token-validator] Worker iniciando...");
  console.log(`[token-validator] Intervalo: ${process.env.TOKEN_CHECK_INTERVAL_HOURS ?? 6}h | Delay entre tokens: ${DELAY_MS}ms`);
  await waitForDB();
  console.log("[token-validator] Banco de dados conectado");
  while (true) {
    try {
      await runCheckCycle();
    } catch (err) {
      console.error("[token-validator] Erro inesperado no ciclo:", err);
    }
    const nextHours = process.env.TOKEN_CHECK_INTERVAL_HOURS ?? 6;
    console.log(`[token-validator] Pr\xF3ximo ciclo em ${nextHours}h`);
    await sleep(INTERVAL_MS);
  }
}
main().catch((err) => {
  console.error("[token-validator] Erro fatal:", err);
  process.exit(1);
});
//# sourceMappingURL=token-validator.js.map