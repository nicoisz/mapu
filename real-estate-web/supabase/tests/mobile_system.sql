begin;
select plan(1);
\ir mobile-system-assertions.inc
select pass('mobile drafts, private conversations and administrator diagnostics');
select * from finish();
rollback;
