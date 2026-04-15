import { loadEnv } from '../../lib/config.mjs';
import { createSupabaseDb } from '../../lib/db.mjs';
import { jsonResponse } from '../../lib/http.mjs';
import { buildThroneState } from '../../lib/throne.mjs';

export async function fetchAddressActivity(address, { apiBase = 'https://mempool.space/api' } = {}) {
  const response = await fetch(`${apiBase}/address/${address}/txs`);
  if (!response.ok) {
    throw new Error(`Failed to fetch mempool data for ${address}`);
  }

  const transactions = await response.json();
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return null;
  }

  for (const transaction of transactions) {
    const outputs = Array.isArray(transaction.vout) ? transaction.vout : [];
    const output = outputs.find((item) => item.scriptpubkey_address === address);
    if (!output) continue;

    const confirmed = Boolean(transaction.status?.confirmed);
    return {
      txid: transaction.txid,
      sats: Number(output.value || 0),
      confirmations: confirmed ? 1 : 0,
      confirmed_at: confirmed
        ? new Date((transaction.status?.block_time || 0) * 1000).toISOString()
        : null,
      seen_at: new Date().toISOString()
    };
  }

  return null;
}

export async function syncPendingClaims({
  db,
  fetchAddressActivity: fetcher = fetchAddressActivity,
  now = () => new Date().toISOString(),
  throneDurationHours = 24,
  minConfirmations = 1,
  defaultMessage = 'The sign belongs to whoever makes this impossible to ignore.'
}) {
  const pendingClaims = await db.listPendingIntents();
  let confirmedCount = 0;
  const detectedTransactions = new Map();

  for (const claim of pendingClaims) {
    const activity = await fetcher(claim.address);
    if (!activity) continue;

    detectedTransactions.set(claim.id, activity);

    await db.markIntentSeen(claim.id, {
      txid: activity.txid,
      sats_received: activity.sats,
      confirmations: activity.confirmations,
      seen_at: activity.seen_at || now()
    });

    if (activity.confirmations >= minConfirmations) {
      await db.markIntentConfirmed(claim.id, {
        txid: activity.txid,
        sats_received: activity.sats,
        confirmations: activity.confirmations,
        seen_at: activity.seen_at || now(),
        confirmed_at: activity.confirmed_at || now()
      });
      confirmedCount += 1;
    }
  }

  const confirmedClaims = await db.listConfirmedClaims();
  const throne = buildThroneState({
    claims: confirmedClaims,
    now: now(),
    durationHours: throneDurationHours,
    defaultMessage
  });

  const winnerId = throne.current_intent_id || null;

  for (const claim of confirmedClaims) {
    const detected = detectedTransactions.get(claim.id);
    await db.upsertTransaction({
      intent_id: claim.id,
      alias: claim.alias,
      sats: Number(claim.sats_received || 0),
      txid: claim.txid || detected?.txid,
      confirmed_at: claim.confirmed_at || detected?.confirmed_at || now(),
      won_throne: claim.id === winnerId
    });
  }

  await db.setThroneState(throne);
  return { confirmed: confirmedCount, throne };
}

export function createCheckPaymentsHandler({ env, db, fetchAddressActivity: fetcher, now }) {
  return async function handler() {
    const result = await syncPendingClaims({
      db,
      fetchAddressActivity: (address) => fetcher(address, { apiBase: env.MEMPOOL_API_BASE }),
      now,
      throneDurationHours: env.THRONE_DURATION_HOURS,
      minConfirmations: env.MIN_CONFIRMATIONS
    });

    return jsonResponse(200, result);
  };
}

export const handler = async () => {
  const env = loadEnv(process.env);
  const db = createSupabaseDb(env);
  return createCheckPaymentsHandler({ env, db, fetchAddressActivity, now: () => new Date().toISOString() })();
};
