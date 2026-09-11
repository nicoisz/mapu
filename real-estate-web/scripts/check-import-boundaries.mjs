// Verifica la frontera de imports: ningún Client Component ('use client') puede
// importar módulos server-only (admin / env server / server-only).
// Uso: node scripts/check-import-boundaries.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(process.argv[2] ?? 'src')
const SERVER_ONLY = ['@/lib/supabase/admin', '@/lib/env/server', 'server-only']
const violations = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full)
    else if (/\.(ts|tsx)$/.test(entry)) check(full)
  }
}

function check(file) {
  const content = readFileSync(file, 'utf8')
  const isClient = /['"]use client['"]/.test(content)
  if (!isClient) return
  for (const mod of SERVER_ONLY) {
    const re = new RegExp(
      `(from\\s+['"]${mod.replace(/[/]/g, '\\/')}['"]|import\\s+['"]${mod.replace(/[/]/g, '\\/')}['"])`
    )
    if (re.test(content)) {
      violations.push(`${file.replace(ROOT + '/', '')}: importa ${mod} (server-only) desde un Client Component`)
    }
  }
}

walk(ROOT)

if (violations.length) {
  console.error('Frontera de imports violada:')
  for (const v of violations) console.error('  - ' + v)
  process.exit(1)
}
console.log('OK: ningún Client Component importa módulos server-only')
