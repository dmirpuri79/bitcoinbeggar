import { loadEnv } from '../../lib/config.mjs';
import { createSupabaseDb } from '../../lib/db.mjs';
import { jsonResponse } from '../../lib/http.mjs';
import { formatSatsAsBtc } from '../../lib/throne.mjs';

export function createClaimStatusHandler({ db }) {
  return async function handler(event) {
    const claimId = event.queryStringParameters?.claim_id;
    if (!claimId) {
      return jsonResponse(400, { error: 'claim_id is required' });
    }

    const claim = await db.getIntentById(claimId);
    if (!claim) {
      return jsonResponse(404, { error: 'Claim not found' });
    }

    return jsonResponse(200, {
      claim_id: claim.id,
      alias: claim.alias,
      address: claim.address,
      status: claim.status,
      amount_btc: formatSatsAsBtc(claim.sats_received || 0),
      confirmations: Number(claim.confirmations || 0),
      txid: claim.txid || null,
      message: claim.message,
      expires_at: claim.expires_at
    });
  };
}

export const handler = async (event) => {
  const env = loadEnv(process.env);
  const db = createSupabaseDb(env);
  return createClaimStatusHandler({ db })(event);
};
