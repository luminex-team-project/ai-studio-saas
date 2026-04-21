-- Payments: expiry on credit grants + atomic credit-grant helper.

alter table public.transactions
  add column if not exists expires_at timestamptz;

create index if not exists transactions_expires_at_idx
  on public.transactions (expires_at)
  where expires_at is not null;

-- Grant credits atomically: confirm a pending transaction + bump profile
-- balance. Invoked by webhook/confirm handlers on the server (service_role).
create or replace function public.confirm_purchase(
  p_transaction_id uuid,
  p_provider_reference text,
  p_expires_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tx record;
begin
  select * into tx
  from public.transactions
  where id = p_transaction_id
  for update;

  if tx is null then
    raise exception 'transaction_not_found' using errcode = 'P0002';
  end if;
  if tx.status = 'succeeded' then
    -- Idempotent: already applied.
    return;
  end if;
  if tx.kind <> 'purchase' then
    raise exception 'not_a_purchase' using errcode = 'P0001';
  end if;

  update public.profiles
  set credits = credits + tx.credits_delta
  where id = tx.user_id;

  update public.transactions
  set status = 'succeeded',
      provider_reference = p_provider_reference,
      expires_at = coalesce(p_expires_at, expires_at)
  where id = p_transaction_id;
end;
$$;

revoke all on function public.confirm_purchase(uuid, text, timestamptz) from public;
grant execute on function public.confirm_purchase(uuid, text, timestamptz) to service_role;

-- Mark a pending purchase as failed.
create or replace function public.fail_purchase(
  p_transaction_id uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.transactions
  set status = 'failed',
      note = coalesce(p_note, note)
  where id = p_transaction_id
    and status = 'pending';
end;
$$;

revoke all on function public.fail_purchase(uuid, text) from public;
grant execute on function public.fail_purchase(uuid, text) to service_role;
