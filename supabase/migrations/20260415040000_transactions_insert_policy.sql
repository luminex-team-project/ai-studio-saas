-- Allow authenticated users to create their own pending purchase rows
-- (used by the buy flow: prepareTossPayment seeds a row whose id becomes
-- the Toss orderId). All other kinds (consume/refund/grant) and any non-
-- pending state remain service_role only.

drop policy if exists "transactions: insert own purchase" on public.transactions;

create policy "transactions: insert own purchase"
  on public.transactions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and kind = 'purchase'
    and status = 'pending'
    and credits_delta > 0
    and amount_krw is not null
    and amount_krw > 0
  );
