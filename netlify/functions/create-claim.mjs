import { z } from 'zod';
import { loadEnv } from '../../lib/config.mjs';
import { createSupabaseDb } from '../../lib/db.mjs';
import { jsonResponse } from '../../lib/http.mjs';
import { deriveClaimAddress } from '../../lib/bitcoin.mjs';

const payloadSchema = z.object({
  alias: z.string().trim().min(1).max(60),
  message: z.string().trim().min(1).max(160)
});

export function createCreateClaimHandler({ env, db, now = () => new Date().toISOString() }) {
  return async function handler(event) {
    if (event.httpMethod && event.httpMethod !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' });
    }

    let parsedBody;
    try {
      parsedBody = payloadSchema.parse(JSON.parse(event.body || '{}'));
    } catch (error) {
      return jsonResponse(400, { error: 'Invalid claim payload' });
    }

    const derivationIndex = await db.getNextDerivationIndex();
    const address = deriveClaimAddress({
      xpub: env.BITCOIN_XPUB,
      index: derivationIndex,
      networkName: env.BITCOIN_NETWORK
    });

    const createdAt = new Date(now());
    const expiresAt = new Date(createdAt.getTime() + env.THRONE_DURATION_HOURS * 60 * 60 * 1000).toISOString();

    const inserted = await db.insertIntent({
      derivation_index: derivationIndex,
      address,
      alias: parsedBody.alias,
      message: parsedBody.message,
      status: 'pending',
      sats_received: 0,
      confirmations: 0,
      created_at: createdAt.toISOString(),
      expires_at: expiresAt
    });

    return jsonResponse(200, {
      claim_id: inserted.id,
      alias: inserted.alias,
      address: inserted.address,
      expires_at: inserted.expires_at
    });
  };
}

export const handler = async (event) => {
  const env = loadEnv(process.env);
  const db = createSupabaseDb(env);
  return createCreateClaimHandler({ env, db })(event);
};
