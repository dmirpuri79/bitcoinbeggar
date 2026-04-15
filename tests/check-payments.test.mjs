import { describe, expect, it, vi } from 'vitest';
import { syncPendingClaims } from '../netlify/functions/check-payments.mjs';

describe('payment sync', () => {
  it('marks confirmed intents, writes transactions, and updates throne state', async () => {
    const db = {
      listPendingIntents: vi.fn().mockResolvedValue([
        {
          id: 'intent-1',
          alias: 'Sovereign',
          message: 'On-chain.',
          address: 'bc1qpux3z758ulsxg69eptaakukraanqwtdxe5yy4c',
          derivation_index: 0,
          sats_received: 0,
          confirmations: 0
        }
      ]),
      markIntentSeen: vi.fn().mockResolvedValue(undefined),
      markIntentConfirmed: vi.fn().mockResolvedValue(undefined),
      upsertTransaction: vi.fn().mockResolvedValue(undefined),
      listConfirmedClaims: vi.fn().mockResolvedValue([
        {
          id: 'intent-1',
          alias: 'Sovereign',
          message: 'On-chain.',
          address: 'bc1qpux3z758ulsxg69eptaakukraanqwtdxe5yy4c',
          sats_received: 5100000,
          confirmations: 1,
          confirmed_at: '2026-04-16T01:00:00.000Z'
        }
      ]),
      setThroneState: vi.fn().mockResolvedValue(undefined)
    };

    const fetchAddressActivity = vi.fn().mockResolvedValue({
      txid: 'abc123',
      sats: 5100000,
      confirmations: 1,
      confirmed_at: '2026-04-16T01:00:00.000Z'
    });

    const result = await syncPendingClaims({
      db,
      fetchAddressActivity,
      now: () => '2026-04-16T02:00:00.000Z',
      throneDurationHours: 24,
      minConfirmations: 1
    });

    expect(db.markIntentConfirmed).toHaveBeenCalledWith('intent-1', expect.objectContaining({
      sats_received: 5100000,
      txid: 'abc123',
      confirmations: 1
    }));
    expect(db.upsertTransaction).toHaveBeenCalledWith(expect.objectContaining({
      txid: 'abc123',
      alias: 'Sovereign',
      won_throne: true
    }));
    expect(db.setThroneState).toHaveBeenCalledWith(expect.objectContaining({
      current_alias: 'Sovereign',
      current_message: 'On-chain.',
      current_sats: 5100000
    }));
    expect(result.confirmed).toBe(1);
  });
});
