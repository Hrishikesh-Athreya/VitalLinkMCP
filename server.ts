import { createServer } from 'node:http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { register as registerHealthSummary } from './tools/health-summary.js'
import { register as registerGlucose } from './tools/glucose.js'
import { register as registerMeals } from './tools/meals.js'
import { register as registerVitals } from './tools/vitals.js'
import { register as registerBehavior } from './tools/behavior.js'
import { register as registerEnvironment } from './tools/environment.js'
import { register as registerSkin } from './tools/skin.js'
import { register as registerCausalPatterns } from './tools/causal-patterns.js'
import { register as registerCausalGraph } from './tools/causal-graph.js'

const CF_WORKER_URL = process.env.VITA_CLOUD_URL ?? 'https://vita-cloud.workers.dev'
const PORT = parseInt(process.env.PORT ?? '3000')

export interface ToolContext {
  workerUrl: string
}

export async function fetchFromWorker(
  workerUrl: string,
  path: string,
  params?: Record<string, string>
): Promise<any> {
  const url = new URL(path, workerUrl)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v)
    }
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }
  return res.json()
}

// --- Factory: creates a fresh McpServer with all tools registered ---

function createVitaMcpServer(): McpServer {
  const server = new McpServer({
    name: 'vita-health',
    version: '1.0.0',
  })

  const ctx: ToolContext = { workerUrl: CF_WORKER_URL }

  registerHealthSummary(server, ctx)
  registerGlucose(server, ctx)
  registerMeals(server, ctx)
  registerVitals(server, ctx)
  registerBehavior(server, ctx)
  registerEnvironment(server, ctx)
  registerSkin(server, ctx)
  registerCausalPatterns(server, ctx)
  registerCausalGraph(server, ctx)

  return server
}

// --- HTTP server: new McpServer + transport per session ---

const sessions = new Map<string, { server: McpServer; transport: StreamableHTTPServerTransport }>()

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', service: 'vita-mcp' }))
    return
  }

  // MCP endpoint
  if (url.pathname === '/mcp') {
    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined

      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!
        await session.transport.handleRequest(req, res)
      } else {
        const server = createVitaMcpServer()
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
        })

        await server.connect(transport)

        transport.onclose = () => {
          const sid = transport.sessionId
          if (sid) sessions.delete(sid)
        }

        await transport.handleRequest(req, res)

        const sid = transport.sessionId
        if (sid) {
          sessions.set(sid, { server, transport })
        }
      }
    } catch (err) {
      console.error('MCP error:', err)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal server error' }))
      }
    }
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

httpServer.listen(PORT, () => {
  console.log(`VITA MCP server listening on port ${PORT}`)
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`)
  console.log(`CF Worker: ${CF_WORKER_URL}`)
})
