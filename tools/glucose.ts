import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../server.js'
import { fetchFromWorker } from '../server.js'

export function register(server: McpServer, ctx: ToolContext) {
  server.tool(
    'query_glucose',
    'Get CGM glucose readings with trend (rising/stable/falling) and energy state. Use for glucose analysis, meal impact, and energy patterns.',
    {
      start_date: z.string().describe('ISO datetime start'),
      end_date: z.string().describe('ISO datetime end'),
      limit: z.number().default(100).describe('Max readings to return'),
    },
    { readOnlyHint: true },
    async ({ start_date, end_date, limit }) => {
      const data = await fetchFromWorker(ctx.workerUrl, '/api/v1/query/glucose', {
        start_date, end_date, limit: String(limit),
      })

      const readings = data.readings as any[]
      if (readings.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No glucose readings found for this period.' }] }
      }

      const values = readings.map((r: any) => r.glucoseMgDL)
      const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)

      const lines = [
        `## Glucose Readings (${readings.length} samples)`,
        `- **Average**: ${avg.toFixed(0)} mg/dL`,
        `- **Range**: ${min}\u2013${max} mg/dL`,
        '',
        '### Recent Readings',
        ...readings.slice(0, 20).map((r: any) =>
          `- ${r.timestamp}: **${r.glucoseMgDL}** mg/dL (${r.trend}, ${r.energyState})`
        ),
      ]

      return {
        structuredContent: data,
        content: [{ type: 'text' as const, text: lines.join('\n') }],
      }
    }
  )
}
