import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  BITCOIN_XPUB: z.string().min(1),
  BITCOIN_NETWORK: z.enum(['mainnet', 'testnet']).default('mainnet'),
  MEMPOOL_API_BASE: z.string().url().default('https://mempool.space/api'),
  SITE_URL: z.string().url().optional(),
  THRONE_DURATION_HOURS: z.coerce.number().int().positive().default(24),
  MIN_CONFIRMATIONS: z.coerce.number().int().min(1).default(1)
});

export function loadEnv(source = process.env) {
  return envSchema.parse(source);
}
