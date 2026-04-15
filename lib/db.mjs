import { createClient } from '@supabase/supabase-js';

export function createSupabaseClients(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not fully configured');
  }

  return {
    admin: createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    }),
    anon: createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    })
  };
}

export function createSupabaseDb(env) {
  const { admin } = createSupabaseClients(env);

  return {
    async getNextDerivationIndex() {
      const { data, error } = await admin
        .from('donation_claims')
        .select('derivation_index')
        .order('derivation_index', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? Number(data.derivation_index) + 1 : 0;
    },

    async insertIntent(intent) {
      const { data, error } = await admin
        .from('donation_claims')
        .insert(intent)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },

    async getIntentById(id) {
      const { data, error } = await admin
        .from('donation_claims')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async listPendingIntents() {
      const { data, error } = await admin
        .from('donation_claims')
        .select('*')
        .in('status', ['pending', 'seen'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },

    async markIntentSeen(id, patch) {
      const { error } = await admin.from('donation_claims').update({ status: 'seen', ...patch }).eq('id', id);
      if (error) throw error;
    },

    async markIntentConfirmed(id, patch) {
      const { error } = await admin.from('donation_claims').update({ status: 'confirmed', ...patch }).eq('id', id);
      if (error) throw error;
    },

    async listConfirmedClaims() {
      const { data, error } = await admin
        .from('donation_claims')
        .select('*')
        .eq('status', 'confirmed')
        .order('confirmed_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async upsertTransaction(transaction) {
      const { error } = await admin
        .from('transactions')
        .upsert(transaction, { onConflict: 'txid' });
      if (error) throw error;
    },

    async setThroneState(state) {
      const { error } = await admin
        .from('throne_state')
        .upsert({ id: true, ...state, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (error) throw error;
    },

    async getThroneState() {
      const { data, error } = await admin.from('throne_state').select('*').eq('id', true).maybeSingle();
      if (error) throw error;
      return data;
    },

    async listRecentTransactions(limit = 20) {
      const { data, error } = await admin
        .from('transactions')
        .select('*')
        .order('confirmed_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    }
  };
}
