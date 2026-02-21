import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../server.js'
import { fetchFromWorker } from '../server.js'

export function register(server: McpServer, ctx: ToolContext) {
  server.tool(
    'query_causal_graph',
    'Get causal graph edges showing relationships between health metrics (meal\u2192glucose, glucose\u2192HRV, behavior\u2192sleep, etc). Use for understanding health interconnections.',
    {
      edge_type: z.string().optional().describe('Filter by edge type: meal_to_glucose, glucose_to_hrv, glucose_to_energy, behavior_to_hrv, meal_to_sleep, behavior_to_sleep, environment_to_hrv, environment_to_sleep, etc.'),
      start_date: z.string().optional().describe('ISO datetime start'),
      end_date: z.string().optional().describe('ISO datetime end'),
    },
    async ({ edge_type, start_date, end_date }) => {
      const params: Record<string, string> = {}
      if (edge_type) params.edge_type = edge_type
      if (start_date) params.start_date = start_date
      if (end_date) params.end_date = end_date

      const data = await fetchFromWorker(ctx.workerUrl, ctx.token, '/api/v1/query/causal-graph', params)

      const edges = data.edges as any[]
      if (edges.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No causal graph edges found for this query.' }] }
      }

      const byType: Record<string, any[]> = {}
      for (const e of edges) {
        (byType[e.edgeType] ??= []).push(e)
      }

      const lines = [`## Causal Graph (${edges.length} edges)`, '']
      for (const [type, group] of Object.entries(byType)) {
        lines.push(`### ${type} (${group.length} edges)`)
        for (const e of group.slice(0, 10)) {
          const strong = e.causalStrength >= 0.7 && e.confidence >= 0.6 ? ' **STRONG**' : ''
          const offsetMin = Math.round(e.temporalOffsetSeconds / 60)
          lines.push(
            `- ${e.sourceNodeID} \u2192 ${e.targetNodeID}: strength ${(e.causalStrength * 100).toFixed(0)}%, confidence ${(e.confidence * 100).toFixed(0)}%, offset ${offsetMin}min${strong}`
          )
        }
        lines.push('')
      }

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] }
    }
  )
}
