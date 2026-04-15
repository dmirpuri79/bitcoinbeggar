import { mapPublicState } from '../../lib/public-state.mjs';
import { loadEnv } from '../../lib/config.mjs';
import { createSupabaseDb } from '../../lib/db.mjs';
import { jsonResponse } from '../../lib/http.mjs';

export function createPublicStateHandler({ db }) {
  return async function handler() {
    const [throne, transactions] = await Promise.all([
      db.getThroneState(),
      db.listRecentTransactions(20)
    ]);

    return jsonResponse(200, mapPublicState({ throne, transactions }));
  };
}

export const handler = async () => {
  const env = loadEnv(process.env);
  const db = createSupabaseDb(env);
  return createPublicStateHandler({ db })();
};
