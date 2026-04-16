# BitcoinBeggar

Production-ready Netlify Functions + Supabase app for the automatic throne flow.

## Current status

Built and verified locally:
- unique claim address generation from XPUB
- claim creation API
- claim status API
- public state API
- payment sync / throne promotion logic
- scheduled payment checker in `netlify.toml`
- tests passing (`npm test`)

## What is still required to go live

### 1. Wallet layer (required)
Provide a **watch-only XPUB** from your own wallet.

Do **not** generate/store a seed phrase on this server.
That would violate the no-custody design.

Required env var:
- `BITCOIN_XPUB`

Optional:
- `BITCOIN_NETWORK=mainnet`

### 2. Supabase project (required)
Create a Supabase project and run the tracked timestamped migrations in `supabase/migrations/`, including:
- `supabase/migrations/20260416000100_bitcoinbeggar_throne.sql`
- `supabase/migrations/20260416000200_add_time_remaining_ms_to_throne_state.sql`

Required env vars:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

### 3. Netlify site (required)
Create/import a Git-backed Netlify site from this app folder/repo.

Required env vars in Netlify:
- `BITCOIN_XPUB`
- `BITCOIN_NETWORK`
- `MEMPOOL_API_BASE`
- `THRONE_DURATION_HOURS`
- `MIN_CONFIRMATIONS`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SITE_URL`

## Local app path
`/Users/jareed/BitcoinBeggar/app`

## Local verification
```bash
cd /Users/jareed/BitcoinBeggar/app
npm install
npm test
```

## Netlify notes
- publish directory: `.`
- functions directory: `netlify/functions`
- redirect `/api/*` -> `/.netlify/functions/:splat`
- scheduled function: `check-payments` every 2 minutes

## Remaining blockers on this machine right now
- `BITCOIN_XPUB` is now available locally via `.env`
- Supabase is linked and schema migrations were applied
- GitHub CLI is authenticated locally
- Netlify CLI is not logged in locally

Once those are available, finish by:
1. creating the remote repo
2. pushing this app
3. creating the Supabase project + migration
4. connecting Netlify to the repo
5. setting env vars
6. verifying `/api/create-claim`, `/api/public-state`, and scheduled sync
