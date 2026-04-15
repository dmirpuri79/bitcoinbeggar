create extension if not exists pgcrypto;

create table if not exists donation_claims (
  id uuid primary key default gen_random_uuid(),
  derivation_index bigint not null unique,
  address text not null unique,
  alias text not null,
  message text not null,
  status text not null default 'pending',
  sats_received bigint not null default 0,
  confirmations integer not null default 0,
  txid text,
  seen_at timestamptz,
  confirmed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists throne_state (
  id boolean primary key default true,
  current_intent_id uuid references donation_claims(id),
  current_alias text,
  current_message text,
  current_sats bigint not null default 0,
  current_address text,
  throne_started_at timestamptz,
  throne_expires_at timestamptz,
  treasury_sats bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  txid text primary key,
  intent_id uuid references donation_claims(id),
  alias text not null,
  sats bigint not null,
  won_throne boolean not null default false,
  confirmed_at timestamptz not null,
  created_at timestamptz not null default now()
);

insert into throne_state (id, current_message)
values (true, 'The sign belongs to whoever makes this impossible to ignore.')
on conflict (id) do nothing;
