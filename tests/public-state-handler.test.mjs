import { describe, expect, it, vi } from 'vitest';
import { createPublicStateHandler } from '../netlify/functions/public-state.mjs';

describe('public-state handler', () => {
  it('returns mapped throne and transaction state', async () => {
    const handler = createPublicStateHandler({
      db: {
        getThroneState: vi.fn().mockResolvedValue({
          current_alias: 'Sovereign',
          current_message: 'On-chain.',
          current_sats: 5100000,
          treasury_sats: 7600000,
          throne_expires_at: '2026-04-17T01:00:00.000Z',
          current_address: 'bc1qnewer'
        }),
        listRecentTransactions: vi.fn().mockResolvedValue([
          {
            alias: 'Sovereign',
            sats: 5100000,
            txid: 'abc123',
            confirmed_at: '2026-04-16T01:00:00.000Z',
            won_throne: true
          }
        ])
      }
    });

    const response = await handler({ httpMethod: 'GET' });
    expect(response.statusCode).toBe(200);

    const payload = JSON.parse(response.body);
    expect(payload.throne.alias).toBe('Sovereign');
    expect(payload.transactions).toHaveLength(1);
    expect(payload.treasury_btc).toBe('0.07600000');
  });
});
