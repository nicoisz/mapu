/* eslint-disable @typescript-eslint/no-require-imports -- Test-only CommonJS runner uses the external PostgreSQL runtime. */
const fs = require('node:fs')
const { createTestDatabase } = require('./test-interest-sql.cjs')

async function createMobileDatabase() {
  const db = await createTestDatabase()
  const baseline = fs.readFileSync('supabase/migrations/20260904162725_remote_schema.sql', 'utf8')
  for (const table of ['error_logs', 'favorites']) {
    await db.exec(
      baseline.match(
        new RegExp('CREATE TABLE IF NOT EXISTS "public"\\."' + table + '"[\\s\\S]*?\\n\\);')
      )[0]
    )
    await db.exec(`alter table public.${table} add primary key(id)`)
  }
  await db.exec(`
    create function public.is_superadmin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.profiles where id=auth.uid() and platform_role='superadmin')$$;
    alter table public.error_logs enable row level security;
    create policy "superadmin can read error logs" on public.error_logs for select using(public.is_superadmin());
    grant all on public.error_logs to anon,authenticated,service_role;
    grant usage on schema auth to anon;
    grant execute on function auth.uid() to anon;
  `)
  for (const migration of [
    '20260926120000_notifications.sql',
    '20261004130000_interest_drafts_and_error_resolution.sql',
    '20261004140000_message_conversations.sql',
  ]) {
    await db.exec(fs.readFileSync('supabase/migrations/' + migration, 'utf8'))
  }
  return db
}
async function main() {
  const db = await createMobileDatabase()
  try {
    await db.exec(
      'begin;\n' +
        fs.readFileSync('supabase/tests/mobile-system-assertions.inc', 'utf8') +
        '\nrollback;'
    )
    console.log(
      'PASS: draft retries/ownership, message participants/replies/pagination/read markers, administrator-only error resolution.'
    )
  } finally {
    await db.close()
  }
}
module.exports = { createMobileDatabase }
if (require.main === module)
  main().catch((e) => {
    console.error(e.message, e.where ?? '')
    process.exitCode = 1
  })
