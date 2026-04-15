import { describe, expect, it, vi } from 'vitest';
import { createCreateClaimHandler } from '../netlify/functions/create-claim.mjs';

const XPUB = 'xpub6C1HVMz946r433QEjZGpYYWYcspxXXBPys5PBGkmQboRXE6RLfFiStEkKbWKCZaPgDrzZh9nUEunxuiuy6MNdw23du2Ek7GoKYMJVH8eK5E';

describe('create-claim handler', () => {
  it('validates alias/message, derives a unique address, and stores the claim', async () => {
    const insertIntent = vi.fn().mockResolvedValue({
      id: 'intent-1',
      derivation_index: 0,
      address: 'bc1qpux3z758ulsxg69eptaakukraanqwtdxe5yy4c',
      alias: 'Dheeraj',
      message: 'I backed it.',
      expires_at: '2026-04-16T13:00:00.000Z'
    });

    const handler = createCreateClaimHandler({
      env: {
        BITCOIN_XPUB: XPUB,
        BITCOIN_NETWORK: 'mainnet',
        THRONE_DURATION_HOURS: 24
      },
      db: {
        getNextDerivationIndex: vi.fn().mockResolvedValue(0),
        insertIntent
      },
      now: () => '2026-04-16T12:00:00.000Z'
    });

    const response = await handler({
      httpMethod: 'POST',
      body: JSON.stringify({ alias: 'Dheeraj', message: 'I backed it.' })
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload).toMatchObject({
      claim_id: 'intent-1',
      alias: 'Dheeraj',
      address: 'bc1qpux3z758ulsxg69eptaakukraanqwtdxe5yy4c'
    });
    expect(insertIntent).toHaveBeenCalledWith(expect.objectContaining({
      derivation_index: 0,
      address: 'bc1qpux3z758ulsxg69eptaakukraanqwtdxe5yy4c',
      alias: 'Dheeraj',
      message: 'I backed it.'
    }));
  });

  it('rejects invalid payloads', async () => {
    const handler = createCreateClaimHandler({
      env: {
        BITCOIN_XPUB: XPUB,
        BITCOIN_NETWORK: 'mainnet',
        THRONE_DURATION_HOURS: 24
      },
      db: {
        getNextDerivationIndex: vi.fn(),
        insertIntent: vi.fn()
      },
      now: () => '2026-04-16T12:00:00.000Z'
    });

    const response = await handler({
      httpMethod: 'POST',
      body: JSON.stringify({ alias: '', message: '' })
    });

    expect(response.statusCode).toBe(400);
  });
});
