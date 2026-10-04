-- pgTAP wrapper: a failed assertion aborts the script and fails pg_prove.
-- The same assertions run in scripts/test-interest-sql.cjs without pgTAP.
begin;
select plan(1);
\ir property-interest-assertions.inc
select pass('Interest scoring, pagination, demand, novelties and RLS assertions');
select * from finish();
rollback;
