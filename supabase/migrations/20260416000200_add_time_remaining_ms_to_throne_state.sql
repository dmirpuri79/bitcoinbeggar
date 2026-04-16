alter table if exists throne_state
  add column if not exists time_remaining_ms bigint not null default 0;
