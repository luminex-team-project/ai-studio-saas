// Apply a SQL file to the linked Supabase project via its transaction pooler.
//
// Usage:
//   SUPABASE_DB_PASSWORD=... node scripts/db-exec.mjs <file.sql>
//
// Requires: pg (installed as devDependency).

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/db-exec.mjs <file.sql>')
  process.exit(1)
}

const password = process.env.SUPABASE_DB_PASSWORD
const projectRef = process.env.SUPABASE_PROJECT_REF || 'xupmjsewhqcokapomcws'
const poolerHost =
  process.env.SUPABASE_POOLER_HOST || 'aws-1-ap-northeast-1.pooler.supabase.com'

if (!password) {
  console.error('Set SUPABASE_DB_PASSWORD in env (see .env.supabase).')
  process.exit(1)
}

const sql = readFileSync(resolve(file), 'utf8')

const client = new pg.Client({
  host: poolerHost,
  port: 5432,
  user: `postgres.${projectRef}`,
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  await client.query(sql)
  console.log(`✓ executed ${file}`)
} catch (err) {
  console.error(`✗ failed to execute ${file}:`)
  console.error(err.message)
  process.exit(1)
} finally {
  await client.end()
}
