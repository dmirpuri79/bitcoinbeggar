import { describe, expect, it } from 'vitest';
import { mapPublicState } from '../lib/public-state.mjs';

describe('public state mapping', () => {
  it('converts backend rows into a frontend-safe state payload', () => {
    const state = mapPublicState({
      throne: {
        current_alias: 'Sovereign',
        current_message: 'On-chain.',
        current_sats: 5100000,
        treasury_sats: 7600000,
        throne_expires_at: '2026-04-17T01:00:00.000Z',
        time_remaining_ms: 3600000,
        current_address: 'bc1qnewer'
      },
      transactions: [
        {
          alias: 'Sovereign',
          sats: 5100000,
          txid: 'abc123',
          confirmed_at: '2026-04-16T01:00:00.000Z',
          won_throne: true
        }
      ]
    });

    expect(state.throne.alias).toBe('Sovereign');
    expect(state.throne.amount_btc).toBe('0.05100000');
    expect(state.throne.wallet_short).toBe('bc1qne...ewer');
    expect(state.throne.time_remaining_ms).toBe(3600000);
    expect(state.treasury_btc).toBe('0.07600000');
    expect(state.transactions[0]).toMatchObject({
      alias: 'Sovereign',
      amount_btc: '0.05100000',
      won_throne: true
    });
  });
});
