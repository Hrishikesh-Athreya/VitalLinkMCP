import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../server.js'
import { fetchFromWorker } from '../server.js'

export function register(server: McpServer, ctx: ToolContext) {
  server.tool(
    'query_skin',
    'Get skin analysis results: overall score, condition scores (acne, dark circles, redness, oiliness, pores, wrinkles, eye bags). Use for skin health tracking and cross-domain analysis.',
    {
      start_date: z.string().optional().describe('ISO datetime start'),
      end_date: z.string().optional().describe('ISO datetime end'),
      latest_only: z.boolean().default(false).describe('If true, return only the most recent analysis'),
    },
    { readOnlyHint: true },
    async ({ start_date, end_date, latest_only }) => {
      const params: Record<string, string> = {}
      if (start_date) params.start_date = start_date
      if (end_date) params.end_date = end_date
      if (latest_only) params.latest_only = 'true'

      const data = await fetchFromWorker(ctx.workerUrl, '/api/v1/query/skin', params)

      const analyses = data.analyses as any[]
      if (analyses.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No skin analysis data found.' }] }
      }

      const lines = [`## Skin Analysis (${analyses.length} scans)`, '']
      for (const scan of analyses) {
        let conditions: any[] = []
        try { conditions = JSON.parse(scan.conditionsJSON) } catch {}
        lines.push(`### Scan: ${scan.timestamp}`)
        lines.push(`- **Overall Score**: ${scan.overallScore}/100`)
        lines.push(`- **Source**: ${scan.apiSource}`)
        if (conditions.length > 0) {
          lines.push('- **Conditions**:')
          for (const c of conditions) {
            const severity = c.severity >= 0.7 ? 'High' : c.severity >= 0.4 ? 'Moderate' : 'Low'
            lines.push(`  - ${c.type}: ${c.uiScore}/100 (${severity})`)
          }
        }
        lines.push('')
      }

      return {
        structuredContent: data,
        content: [{ type: 'text' as const, text: lines.join('\n') }],
      }
    }
  )
}
