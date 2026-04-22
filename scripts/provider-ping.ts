#!/usr/bin/env node
// Lightweight auth ping for each video provider. Read-only calls, no billing.
import jwt from 'jsonwebtoken'
import LumaAI from 'lumaai'
import RunwayML from '@runwayml/sdk'

async function pingKling() {
  const ak = process.env.KLING_API_KEY
  const sk = process.env.KLING_API_SECRET
  if (!ak || !sk) return console.log('❌ Kling: keys missing')
  const now = Math.floor(Date.now() / 1000)
  const token = jwt.sign(
    { iss: ak, exp: now + 1800, nbf: now - 5 },
    sk,
    { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } },
  )
  const res = await fetch(
    'https://api-singapore.klingai.com/v1/videos/text2video?pageNum=1&pageSize=1',
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
  )
  const text = await res.text()
  if (!res.ok) return console.log(`❌ Kling: HTTP ${res.status} ${text.slice(0, 200)}`)
  const parsed = JSON.parse(text) as { code: number; message: string }
  if (parsed.code === 0) console.log('✅ Kling: auth OK')
  else console.log(`❌ Kling: code=${parsed.code} ${parsed.message}`)
}

async function pingRunway() {
  const key = process.env.RUNWAY_API_KEY
  if (!key) return console.log('❌ Runway: key missing')
  try {
    const client = new RunwayML({ apiKey: key })
    // Cheapest call — list organization usage, a read-only endpoint.
    // Fall back to a minimal HEAD if the SDK lacks it.
    const res = await fetch('https://api.dev.runwayml.com/v1/organization', {
      headers: {
        Authorization: `Bearer ${key}`,
        'X-Runway-Version': '2024-11-06',
      },
    })
    const text = await res.text()
    if (res.ok) console.log(`✅ Runway: auth OK (${text.slice(0, 120)})`)
    else console.log(`❌ Runway: HTTP ${res.status} ${text.slice(0, 200)}`)
    void client
  } catch (e) {
    console.log('❌ Runway:', e instanceof Error ? e.message : e)
  }
}

async function pingLuma() {
  const key = process.env.LUMA_API_KEY
  if (!key) return console.log('❌ Luma: key missing')
  try {
    const client = new LumaAI({ authToken: key })
    const list = await client.generations.list({ limit: 1 })
    console.log(`✅ Luma: auth OK (${list.generations?.length ?? 0} recent gens)`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.log('❌ Luma:', msg.slice(0, 300))
  }
}

async function main() {
  console.log('=== provider auth ping ===')
  await pingKling()
  await pingRunway()
  await pingLuma()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
