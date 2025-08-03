// app/api/slippage/route.ts
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

// Path to relayer analytics.json (sibling directory)
const ANALYTICS_FILE = path.join(process.cwd(), '../relayer/analytics.json')

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let analytics: any[] = []

  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const data = fs.readFileSync(ANALYTICS_FILE, 'utf-8')
      analytics = JSON.parse(data)
    }
  } catch (err) {
    console.error('❌ Failed to read analytics.json:', err)
    return new Response(JSON.stringify({ data: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Filter data
  let filtered = analytics

  if (orderId) {
    filtered = filtered.filter(r => r.orderId === Number(orderId))
  }
  if (from) {
    const fromTime = new Date(from).getTime()
    filtered = filtered.filter(r => new Date(r.timestamp).getTime() >= fromTime)
  }
  if (to) {
    const toTime = new Date(to).getTime()
    filtered = filtered.filter(r => new Date(r.timestamp).getTime() <= toTime)
  }

  return new Response(JSON.stringify({ data: filtered }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}