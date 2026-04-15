import { describe, expect, it } from 'vitest';
import { buildThroneState, formatSatsAsBtc, selectWinningClaim } from '../lib/throne.mjs';

const claims = [
  {
    id: 'older-smaller',
    address: 'bc1qolder',
    alias: 'Early Bird',
    message: 'first',
    sats_received: 2500000,
    confirmations: 2,
    confirmed_at: '2026-04-16T00:00:00.000Z'
  },
  {
    id: 'newer-larger',
    address: 'bc1qnewer',
    alias: 'Sovereign',
    message: 'I backed it.',
    sats_received: 5100000,
    confirmations: 1,
    confirmed_at: '2026-04-16T01:00:00.000Z'
  }
];

describe('throne logic', () => {
  it('selects the highest confirmed donor as sovereign', () => {
    expect(selectWinningClaim(claims)).toMatchObject({
      id: 'newer-larger',
      alias: 'Sovereign',
      sats_received: 5100000
    });
  });

  it('builds throne state with a 24 hour expiry from the winning claim confirmation time', () => {
    const throne = buildThroneState({
      claims,
      now: '2026-04-16T02:00:00.000Z',
      durationHours: 24,
      defaultMessage: 'The sign belongs to whoever makes this impossible to ignore.'
    });

    expect(throne.current_alias).toBe('Sovereign');
    expect(throne.current_message).toBe('I backed it.');
    expect(throne.current_sats).toBe(5100000);
    expect(throne.treasury_sats).toBe(7600000);
    expect(throne.throne_expires_at).toBe('2026-04-17T01:00:00.000Z');
    expect(throne.time_remaining_ms).toBe(23 * 60 * 60 * 1000);
  });

  it('formats sats as fixed BTC strings', () => {
    expect(formatSatsAsBtc(5100000)).toBe('0.05100000');
  });
});
