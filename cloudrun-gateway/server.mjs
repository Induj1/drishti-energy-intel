import http from 'node:http'

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://drishti-sentinelmesh-500608.web.app'
const SUPABASE_API_BASE = process.env.SUPABASE_API_BASE ?? 'https://bkzbcolbucbvnvyqveoe.supabase.co/functions/v1/drishti-api'
const PORT = Number(process.env.PORT ?? 8080)

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type,x-client-info,apikey',
  'access-control-max-age': '86400',
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    ...corsHeaders,
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

function sendRedirect(res, url) {
  res.writeHead(302, {
    location: url,
    'cache-control': 'no-store',
  })
  res.end()
}

function nasikoProbe() {
  return {
    ok: true,
    sponsor: 'Nasiko',
    mode: 'adapter-ready',
    cloudRun: true,
    summary:
      'DRISHTI includes a real Nasiko router client, AgentCard package, and local Nasiko deployment guide. Live router mode requires the Nasiko Docker stack or sponsor credentials.',
    agentPackage: 'nasiko-agents/sentinelmesh-crisis-agent',
    workflowId: 'sentinelmesh-energy-crisis',
  }
}

async function requestBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

function proxyHeaders(req) {
  const headers = {}
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase()
    if (['host', 'connection', 'content-length', 'transfer-encoding', 'accept-encoding'].includes(lower)) continue
    if (value) headers[key] = Array.isArray(value) ? value.join(',') : value
  }
  headers['x-sentinelmesh-gateway'] = 'cloud-run'
  return headers
}

function responseHeaders(upstream) {
  const headers = { ...corsHeaders, 'cache-control': 'no-store' }
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (['connection', 'content-encoding', 'content-length', 'transfer-encoding'].includes(lower)) return
    headers[key] = value
  })
  return headers
}

function stripJsonBom(payload, upstream) {
  const contentType = upstream.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return payload
  if (payload.length >= 3 && payload[0] === 0xef && payload[1] === 0xbb && payload[2] === 0xbf) {
    return payload.subarray(3)
  }
  return payload
}

async function proxyApi(req, res, url) {
  const upstreamUrl = `${SUPABASE_API_BASE}${url.pathname}${url.search}`
  const method = req.method ?? 'GET'
  const body = ['GET', 'HEAD'].includes(method) ? undefined : await requestBody(req)
  const upstream = await fetch(upstreamUrl, {
    method,
    headers: proxyHeaders(req),
    body,
  })
  const payload = stripJsonBom(Buffer.from(await upstream.arrayBuffer()), upstream)
  res.writeHead(upstream.status, responseHeaders(upstream))
  res.end(payload)
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://gateway.local')

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders)
      res.end()
      return
    }

    if (url.pathname === '/health') {
      sendJson(res, 200, {
        ok: true,
        service: 'drishti-sentinelmesh-cloudrun-gateway',
        apiProxy: true,
        frontend: FRONTEND_URL,
        backend: SUPABASE_API_BASE,
      })
      return
    }

    if (url.pathname === '/api/nasiko/probe') {
      sendJson(res, 200, nasikoProbe())
      return
    }

    if (url.pathname === '/api/nasiko') {
      sendJson(res, 200, nasikoProbe())
      return
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        await proxyApi(req, res, url)
      } catch (error) {
        sendJson(res, 502, {
          ok: false,
          service: 'drishti-sentinelmesh-cloudrun-gateway',
          error: error instanceof Error ? error.message : 'proxy_failed',
        })
      }
      return
    }

    sendRedirect(res, `${FRONTEND_URL}${url.pathname}${url.search}`)
  })
  .listen(PORT, '0.0.0.0')
