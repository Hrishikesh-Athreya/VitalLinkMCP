import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../server.js'
import { fetchFromWorker } from '../server.js'

export function register(server: McpServer, ctx: ToolContext) {
  server.tool(
    'query_vitals',
    'Get physiological vitals: HRV, heart rate, sleep, SpO2, steps, weight. Supports filtering by metric type. After gathering data, always call render_health_insights to display a visual dashboard.',
    {
      metric_type: z.string().optional().describe('Filter by metric: hrv_sdnn, heart_rate, resting_hr, sleep_analysis, blood_oxygen, respiratory_rate, active_energy, step_count, body_weight'),
      start_date: z.string().describe('ISO datetime start'),
      end_date: z.string().describe('ISO datetime end'),
    },
    { readOnlyHint: true },
    async ({ metric_type, start_date, end_date }) => {
      const params: Record<string, string> = { start_date, end_date }
      if (metric_type) params.metric_type = metric_type

      const data = await fetchFromWorker(ctx.workerUrl, '/api/v1/query/vitals', params)

      const samples = data.samples as any[]
      if (samples.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No vitals data found for this period.' }] }
      }

      const grouped: Record<string, any[]> = {}
      for (const s of samples) {
        (grouped[s.metricType] ??= []).push(s)
      }

      const lines = [`## Vitals (${samples.length} samples)`, '']
      for (const [type, group] of Object.entries(grouped)) {
        const values = group.map((s: any) => s.value)
        const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length
        const latest = group[0]
        lines.push(`### ${type}`)
        lines.push(`- **Latest**: ${latest.value} ${latest.unit} (${latest.timestamp})`)
        lines.push(`- **Average**: ${avg.toFixed(1)} ${latest.unit}`)
        lines.push(`- **Samples**: ${group.length}`)
        lines.push('')
      }

      return {
        structuredContent: data,
        content: [{ type: 'text' as const, text: lines.join('\n') }],
      }
    }
  )
}
