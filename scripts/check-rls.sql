-- RLS audit for the public schema.
--
-- Usage (against the linked Supabase project):
--   npx supabase db execute --file scripts/check-rls.sql
-- Or via psql with DATABASE_URL:
--   psql "$DATABASE_URL" -f scripts/check-rls.sql
--
-- Outputs two result sets:
--   1. Tables with RLS DISABLED (should be empty — any row is a red flag).
--   2. Per-table policy counts + command breakdown.

-- ═══════════════════════════════════════════════════════════════
-- 1) Tables without RLS enabled
-- ═══════════════════════════════════════════════════════════════
select
  n.nspname  as schema,
  c.relname  as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false
order by c.relname;

-- ═══════════════════════════════════════════════════════════════
-- 2) Policy coverage per table
-- ═══════════════════════════════════════════════════════════════
-- Shows the total policy count + a count per command (SELECT / INSERT /
-- UPDATE / DELETE / ALL). A table with RLS on but zero policies is lockdown
-- by default (nothing is readable) — likely a bug.
with policy_counts as (
  select
    schemaname,
    tablename,
    cmd,
    count(*) as n
  from pg_policies
  where schemaname = 'public'
  group by schemaname, tablename, cmd
)
select
  t.schemaname  as schema,
  t.tablename   as table_name,
  t.rowsecurity as rls_enabled,
  coalesce(sum(pc.n), 0)::int                                       as policies_total,
  coalesce(sum(pc.n) filter (where pc.cmd = 'SELECT'), 0)::int      as select_policies,
  coalesce(sum(pc.n) filter (where pc.cmd = 'INSERT'), 0)::int      as insert_policies,
  coalesce(sum(pc.n) filter (where pc.cmd = 'UPDATE'), 0)::int      as update_policies,
  coalesce(sum(pc.n) filter (where pc.cmd = 'DELETE'), 0)::int      as delete_policies,
  coalesce(sum(pc.n) filter (where pc.cmd = 'ALL'),    0)::int      as all_policies
from pg_tables t
left join policy_counts pc
  on pc.schemaname = t.schemaname
 and pc.tablename  = t.tablename
where t.schemaname = 'public'
group by t.schemaname, t.tablename, t.rowsecurity
order by t.tablename;

-- ═══════════════════════════════════════════════════════════════
-- 3) Tables with RLS enabled but no policies (implicit deny-all)
-- ═══════════════════════════════════════════════════════════════
-- Usually unintended. If you want a table fully locked to service_role, put
-- an explicit `-- intentionally empty` comment and bypass this alert.
select
  t.schemaname as schema,
  t.tablename  as table_name
from pg_tables t
where t.schemaname = 'public'
  and t.rowsecurity = true
  and not exists (
    select 1
    from pg_policies p
    where p.schemaname = t.schemaname
      and p.tablename  = t.tablename
  )
order by t.tablename;
