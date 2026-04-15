import { describe, expect, it } from 'vitest';
import { deriveClaimAddress, getBitcoinNetwork } from '../lib/bitcoin.mjs';

const XPUB = 'xpub6C1HVMz946r433QEjZGpYYWYcspxXXBPys5PBGkmQboRXE6RLfFiStEkKbWKCZaPgDrzZh9nUEunxuiuy6MNdw23du2Ek7GoKYMJVH8eK5E';
const ZPUB = 'zpub6qs7n5WeA6JWZKJSNXoFEA4q9HTmSBkEGKnvPyzdVXe63JvxaogdaXHrACM6kSqXq5EVfRuPUyyjgmerGYPXYQ9gaarNwbFvwQkpTxTYPp4';

describe('bitcoin claim address derivation', () => {
  it('derives deterministic unique native segwit addresses from an xpub', () => {
    const network = getBitcoinNetwork('mainnet');

    expect(deriveClaimAddress({ xpub: XPUB, index: 0, networkName: 'mainnet' })).toBe('bc1qpux3z758ulsxg69eptaakukraanqwtdxe5yy4c');
    expect(deriveClaimAddress({ xpub: XPUB, index: 1, networkName: 'mainnet' })).toBe('bc1qytr8s7skf86x7ccl6wctal9hqrartu085r9mr5');
    expect(network.bech32).toBe('bc');
  });

  it('derives deterministic unique native segwit addresses from a zpub watch-only key', () => {
    expect(deriveClaimAddress({ xpub: ZPUB, index: 0, networkName: 'mainnet' })).toBe('bc1qhzpuzrl6x50pfgr4535r5h8f5gdejwla2ae4kw');
    expect(deriveClaimAddress({ xpub: ZPUB, index: 1, networkName: 'mainnet' })).toBe('bc1qw5paffuljcp7nd3n75a0adxwhq88e7dwnu2qa9');
  });

  it('rejects negative derivation indexes', () => {
    expect(() => deriveClaimAddress({ xpub: XPUB, index: -1, networkName: 'mainnet' })).toThrow(/index/i);
  });
});
