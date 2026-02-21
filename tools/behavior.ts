import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../server.js'
import { fetchFromWorker } from '../server.js'

export function register(server: McpServer, ctx: ToolContext) {
  server.tool(
    'query_behavior',
    'Get behavioral events: screen time, app usage, dopamine debt scores. Use for digital wellness and behavior-health correlations.',
    {
      start_date: z.string().describe('ISO datetime start'),
      end_date: z.string().describe('ISO datetime end'),
    },
    async ({ start_date, end_date }) => {
      const data = await fetchFromWorker(ctx.workerUrl, ctx.token, '/api/v1/query/behavioral', { start_date, end_date })

      const events = data.events as any[]
      if (events.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No behavioral events found for this period.' }] }
      }

      const byCategory: Record<string, { count: number; totalMinutes: number; maxDebt: number }> = {}
      for (const e of events) {
        const cat = e.category
        const entry = (byCategory[cat] ??= { count: 0, totalMinutes: 0, maxDebt: 0 })
        entry.count++
        entry.totalMinutes += (e.duration || 0) / 60
        if (e.dopamineDebtScore != null) entry.maxDebt = Math.max(entry.maxDebt, e.dopamineDebtScore)
      }

      const lines = [`## Behavioral Summary (${events.length} events)`, '']
      for (const [cat, stats] of Object.entries(byCategory)) {
        lines.push(`### ${cat}`)
        lines.push(`- **Events**: ${stats.count}`)
        lines.push(`- **Total Time**: ${stats.totalMinutes.toFixed(0)} min`)
        if (stats.maxDebt > 0) lines.push(`- **Max Dopamine Debt**: ${stats.maxDebt.toFixed(0)}/100`)
        lines.push('')
      }

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] }
    }
  )
}
