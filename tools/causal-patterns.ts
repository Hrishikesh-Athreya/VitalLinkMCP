import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../server.js'
import { fetchFromWorker } from '../server.js'

export function register(server: McpServer, ctx: ToolContext) {
  server.tool(
    'query_causal_patterns',
    'Get discovered causal patterns from the health graph. Patterns show relationships like \'high-GL meals \u2192 glucose spikes \u2192 poor sleep\'. Only returns patterns with 5+ observations.',
    {
      min_strength: z.number().default(0.6).describe('Minimum pattern strength (0-1)'),
      limit: z.number().default(20).describe('Max patterns to return'),
    },
    async ({ min_strength, limit }) => {
      const data = await fetchFromWorker(ctx.workerUrl, '/api/v1/query/causal-patterns', {
        min_strength: String(min_strength),
        limit: String(limit),
      })

      const patterns = data.patterns as any[]
      if (patterns.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No significant causal patterns discovered yet. More data observations are needed.' }] }
      }

      const lines = [`## Causal Patterns (${patterns.length} discovered)`, '']
      for (const p of patterns) {
        const pct = (p.strength * 100).toFixed(0)
        lines.push(`### ${p.pattern}`)
        lines.push(`- **Strength**: ${pct}%`)
        lines.push(`- **Observations**: ${p.observationCount}`)
        lines.push(`- **Last Updated**: ${p.updatedAt}`)
        lines.push('')
      }

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] }
    }
  )
}
