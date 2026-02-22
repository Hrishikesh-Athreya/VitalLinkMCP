import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'
import type { ToolContext } from '../server.js'
import { fetchFromWorker } from '../server.js'

const WIDGET_URI = 'ui://widget/vita-dashboard.html'

export function register(server: McpServer, ctx: ToolContext) {
  registerAppTool(
    server,
    'get_health_summary',
    {
      title: 'Health Summary',
      description: 'Get health score, latest vitals, and active causal patterns. Best starting point for understanding a user\'s current health state.',
      inputSchema: { window_hours: z.number().default(6).describe('Hours of data to consider') },
      annotations: { readOnlyHint: true },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        'openai/toolInvocation': {
          invoking: 'Analyzing your health data…',
          invoked: 'Here is your health dashboard',
        },
      },
    },
    async ({ window_hours }) => {
      const data = await fetchFromWorker(ctx.workerUrl, '/api/v1/query/health-summary', {
        window_hours: String(window_hours),
      })

      const lines = [
        `## Health Score: ${data.healthScore}/100 (${data.healthLabel})`,
        '',
        '### Current Vitals',
        data.glucose != null ? `- **Glucose**: ${data.glucose} mg/dL` : '- **Glucose**: No data',
        data.hrv != null ? `- **HRV**: ${Math.round(data.hrv)} ms` : '- **HRV**: No data',
        data.heartRate != null ? `- **Heart Rate**: ${data.heartRate} bpm` : '- **Heart Rate**: No data',
        data.sleepHours != null ? `- **Sleep**: ${data.sleepHours.toFixed(1)} hours` : '- **Sleep**: No data',
        data.steps != null ? `- **Steps**: ${data.steps.toLocaleString()}` : '- **Steps**: No data',
        data.dopamineDebt != null ? `- **Dopamine Debt**: ${Math.round(data.dopamineDebt)}/100` : '',
        data.skinScore != null ? `- **Skin Score**: ${data.skinScore}/100` : '',
      ]

      if (data.topPatterns?.length > 0) {
        lines.push('', '### Active Causal Patterns')
        for (const p of data.topPatterns) {
          lines.push(`- ${p.pattern} (strength: ${(p.strength * 100).toFixed(0)}%)`)
        }
      }

      return {
        structuredContent: data,
        content: [{ type: 'text' as const, text: lines.filter(Boolean).join('\n') }],
      }
    }
  )
}
