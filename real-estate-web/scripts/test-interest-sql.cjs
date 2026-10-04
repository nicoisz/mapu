// Test-only PostgreSQL runtime, installed outside the application. See docs/INTERESTS.md.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { PGlite } = require(path.join(process.env.MAPU_SQL_RUNTIME_DIR, 'node_modules/@electric-sql/pglite'))
const bcrypt = require(path.join(process.env.MAPU_SQL_RUNTIME_DIR, 'node_modules/bcryptjs'))

async function createTestDatabase() {
  const db = new PGlite()
  await db.exec(`
    create schema extensions;
    create function extensions.uuid_generate_v4() returns uuid language sql as $$select gen_random_uuid()$$;
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(instance_id uuid,id uuid primary key,aud text,role text,email text unique,encrypted_password text,email_confirmed_at timestamptz,raw_app_meta_data jsonb,raw_user_meta_data jsonb,created_at timestamptz,updated_at timestamptz,confirmation_token text,recovery_token text,email_change_token_new text,email_change text);
    create table auth.identities(id uuid primary key,user_id uuid references auth.users(id),provider_id text,provider text,identity_data jsonb,created_at timestamptz,updated_at timestamptz,unique(provider_id,provider));
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
  `)
  const baseline = fs.readFileSync('supabase/migrations/20260904162725_remote_schema.sql', 'utf8')
  for (const m of baseline.matchAll(/CREATE TYPE "public"\."[^"]+" AS ENUM \([\s\S]*?\);/g)) await db.exec(m[0])
  for (const table of ['profiles', 'properties']) {
    const ddl = baseline.match(new RegExp('CREATE TABLE IF NOT EXISTS "public"\\."' + table + '"[\\s\\S]*?\\n\\);'))
    await db.exec(ddl[0])
    await db.exec(`alter table public.${table} add primary key(id)`)
  }
  await db.exec('alter table public.profiles add foreign key(id) references auth.users(id) on delete cascade')
  await db.exec(fs.readFileSync('supabase/migrations/20261003120000_property_interests.sql', 'utf8'))
  return db
}

async function main() {
  const db = await createTestDatabase()
  try {
    const script = fs.readFileSync('supabase/testing/provision-interest-users.sql', 'utf8')
    await db.exec(script)
    await db.exec("update public.profiles set name='Existing test name' where email='mapu.probe.claude@gmail.com'")
    const before = await db.query('select id,email,encrypted_password from auth.users order by email')
    await db.exec(script)
    const after = await db.query('select id,email,encrypted_password from auth.users order by email')
    assert.deepEqual(before.rows, after.rows)
    for (const row of after.rows) assert(bcrypt.compareSync('123qweasd', row.encrypted_password))
    assert.equal((await db.query("select name from public.profiles where email='mapu.probe.claude@gmail.com'")).rows[0].name, 'Existing test name')
    assert.equal((await db.query('select count(*)::int n from auth.identities')).rows[0].n, 2)
    await db.exec(fs.readFileSync('supabase/tests/property_interests.sql', 'utf8'))
    console.log('PASS: PostgreSQL scoring, RPC/RLS isolation, demand, novelties; test accounts idempotent, preserve name/UUID; bcrypt passwords verified.')
  } finally { await db.close() }
}
module.exports = { createTestDatabase }
if (require.main === module) main().catch(e => { console.error(e.message, e.where ?? '');process.exitCode=1 })
