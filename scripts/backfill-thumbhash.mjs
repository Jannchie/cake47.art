#!/usr/bin/env node
import { createClient } from '@libsql/client'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import sharp from 'sharp'
import { rgbaToThumbHash } from 'thumbhash'

const rootDir = process.cwd()
const args = new Set(process.argv.slice(2))
const remote = args.has('--remote')
const localDbPath = resolve(rootDir, process.env.LOCAL_DB_PATH || '.data/db/sqlite.db')
const localBlobDir = resolve(rootDir, process.env.LOCAL_BLOB_DIR || '.data/blob')
const wranglerConfigPath = resolve(rootDir, process.env.WRANGLER_CONFIG || '.output/server/wrangler.json')
const d1Binding = process.env.PROD_D1_BINDING || 'DB'
const allowProdBackfill = process.env.ALLOW_PROD_BACKFILL === '1'
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-')
const outDir = resolve(rootDir, '.tmp', `thumbhash-backfill-${timestamp}`)
const generatedSqlPath = join(outDir, 'updates.sql')

function log(message) {
  console.log(message)
}

function fail(message) {
  console.error(`Error: ${message}`)
  process.exit(1)
}

function quoteIdent(value) {
  return `"${value.replaceAll('"', '""')}"`
}

function sqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  return `'${String(value).replaceAll("'", "''")}'`
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: process.env,
    maxBuffer: 128 * 1024 * 1024,
    ...options,
  })

  if (result.status !== 0) {
    const stdout = result.stdout ? result.stdout.toString() : ''
    const stderr = result.stderr ? result.stderr.toString() : ''
    fail(`Command failed: ${command} ${args.join(' ')}${stdout ? `\n${stdout}` : ''}${stderr ? `\n${stderr}` : ''}`)
  }

  return result
}

function readWranglerConfig() {
  if (!existsSync(wranglerConfigPath)) {
    fail(`Missing ${relative(rootDir, wranglerConfigPath)}. Run pnpm build:cloudflare first.`)
  }

  const raw = JSON.parse(readFileSync(wranglerConfigPath, 'utf8'))
  const r2 = raw.r2_buckets?.find(bucket => bucket.binding === 'BLOB') || raw.r2_buckets?.[0]
  const bucketName = process.env.NUXT_HUB_CLOUDFLARE_R2_BUCKET || r2?.bucket_name
  if (!bucketName) {
    fail('Missing R2 bucket name. Set NUXT_HUB_CLOUDFLARE_R2_BUCKET or provide wrangler config with a BLOB bucket.')
  }
  return { bucketName }
}

async function createThumbHash(buffer) {
  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({
      width: 100,
      height: 100,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return Buffer.from(rgbaToThumbHash(info.width, info.height, data)).toString('base64')
}

async function assertLocalColumn(db) {
  const result = await db.execute(`pragma table_info(${quoteIdent('artworks')})`)
  const columns = new Set(result.rows.map(row => String(row.name)))
  if (!columns.has('thumb_hash')) {
    fail('Missing artworks.thumb_hash. Run pnpm db:migrate first.')
  }
}

async function backfillLocal() {
  if (!existsSync(localDbPath)) {
    fail(`Missing local DB: ${relative(rootDir, localDbPath)}`)
  }

  const db = createClient({ url: `file:${localDbPath}` })
  await assertLocalColumn(db)

  const result = await db.execute(`
    select id, storage_key
    from artworks
    where thumb_hash is null or thumb_hash = ''
  `)
  const rows = result.rows
  log(`Local artworks missing thumb_hash: ${rows.length}`)

  let updated = 0
  let skipped = 0
  for (const row of rows) {
    const filePath = join(localBlobDir, String(row.storage_key))
    if (!existsSync(filePath)) {
      skipped++
      log(`Skip missing blob: ${row.storage_key}`)
      continue
    }

    const thumbHash = await createThumbHash(readFileSync(filePath))
    await db.execute({
      sql: 'update artworks set thumb_hash = ? where id = ?',
      args: [thumbHash, row.id],
    })
    updated++
  }

  db.close()
  log(`Local backfill complete. Updated: ${updated}. Skipped: ${skipped}.`)
}

function parseWranglerJson(stdout) {
  const text = stdout.toString().trim()
  try {
    return JSON.parse(text)
  }
  catch {
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1))
    }
    throw new Error(`Unable to parse wrangler JSON output:\n${text}`)
  }
}

function extractD1Rows(payload) {
  const first = Array.isArray(payload) ? payload[0] : payload
  if (Array.isArray(first?.results)) {
    return first.results
  }
  if (Array.isArray(first?.result?.[0]?.results)) {
    return first.result[0].results
  }
  return []
}

function queryRemoteRows(sql) {
  const result = run('pnpm', [
    'exec',
    'wrangler',
    'd1',
    'execute',
    d1Binding,
    '--remote',
    '--config',
    wranglerConfigPath,
    '--command',
    sql,
    '--json',
  ], { encoding: 'utf8' })
  return extractD1Rows(parseWranglerJson(result.stdout))
}

function readRemoteBlob(bucketName, storageKey) {
  const result = spawnSync('pnpm', [
    'exec',
    'wrangler',
    'r2',
    'object',
    'get',
    `${bucketName}/${storageKey}`,
    '--remote',
    '--config',
    wranglerConfigPath,
    '--pipe',
  ], {
    cwd: rootDir,
    env: process.env,
    maxBuffer: 128 * 1024 * 1024,
  })

  if (result.status !== 0) {
    return null
  }
  return result.stdout
}

async function backfillRemote() {
  if (!allowProdBackfill) {
    fail('Remote backfill requires ALLOW_PROD_BACKFILL=1.')
  }

  const { bucketName } = readWranglerConfig()
  const columns = new Set(queryRemoteRows('pragma table_info(artworks)').map(row => String(row.name)))
  if (!columns.has('thumb_hash')) {
    fail('Remote D1 is missing artworks.thumb_hash. Run pnpm db:migrate:production first.')
  }

  const rows = queryRemoteRows(`
    select id, storage_key
    from artworks
    where thumb_hash is null or thumb_hash = ''
  `)
  log(`Remote artworks missing thumb_hash: ${rows.length}`)

  const updates = []
  let skipped = 0
  for (const row of rows) {
    const blob = readRemoteBlob(bucketName, row.storage_key)
    if (!blob) {
      skipped++
      log(`Skip missing remote blob: ${row.storage_key}`)
      continue
    }

    const thumbHash = await createThumbHash(blob)
    updates.push(`UPDATE ${quoteIdent('artworks')} SET ${quoteIdent('thumb_hash')} = ${sqlValue(thumbHash)} WHERE ${quoteIdent('id')} = ${sqlValue(row.id)};`)
  }

  if (updates.length === 0) {
    log(`Remote backfill complete. Updated: 0. Skipped: ${skipped}.`)
    return
  }

  await mkdir(outDir, { recursive: true })
  await writeFile(generatedSqlPath, `${updates.join('\n')}\n`)
  log(`Generated SQL: ${relative(rootDir, generatedSqlPath)}`)

  run('pnpm', [
    'exec',
    'wrangler',
    'd1',
    'execute',
    d1Binding,
    '--remote',
    '--config',
    wranglerConfigPath,
    '--file',
    generatedSqlPath,
    '--yes',
  ], { stdio: 'inherit' })

  log(`Remote backfill complete. Updated: ${updates.length}. Skipped: ${skipped}.`)
}

if (remote) {
  await backfillRemote()
}
else {
  await backfillLocal()
}
