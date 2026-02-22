import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'

const WIDGET_URI = 'ui://widget/vita-dashboard.html'

const inputSchema = {
  question: z.string().describe("The user's original health question"),
  summary: z.string().describe("ChatGPT's narrative insight answering the question"),
  factors: z.array(z.object({
    name: z.string(),
    detail: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    icon: z.string().describe('Emoji icon'),
  })).describe('Contributing health factors'),
  charts: z.array(z.object({
    type: z.enum(['line', 'bar', 'sparkline', 'ring', 'gauge']),
    title: z.string(),
    data: z.array(z.object({ label: z.string(), value: z.number() })),
    unit: z.string().optional(),
    color: z.string().optional(),
  })).describe('Charts to render in the dashboard'),
  metrics: z.array(z.object({
    label: z.string(),
    value: z.string(),
    unit: z.string(),
    icon: z.string().describe('Emoji icon'),
    delta: z.string().optional(),
    deltaStatus: z.enum(['good', 'warn', 'bad']).optional(),
    sparkline: z.array(z.number()).optional(),
  })).optional().describe('Key metric cards'),
  sleep: z.object({
    duration: z.string(),
    bedtime: z.string(),
    waketime: z.string(),
    stages: z.array(z.object({
      label: z.string(),
      percent: z.number(),
    })),
  }).optional().describe('Sleep breakdown data'),
  recommendations: z.array(z.object({
    icon: z.string().describe('Emoji icon'),
    title: z.string(),
    description: z.string(),
  })).optional().describe('Actionable health recommendations'),
}

export function register(server: McpServer) {
  registerAppTool(
    server,
    'render_health_insights',
    {
      title: 'Render Health Insights',
      description: 'IMPORTANT: You MUST call this tool as the final step after answering any health question. It renders a visual health dashboard for the user. After calling data tools (health summary, glucose, vitals, behavior, meals, etc.) and forming your analysis, ALWAYS call this tool to display the results visually. Pass your synthesized insights, contributing factors, relevant metrics with sparklines, chart data, and actionable recommendations.',
      inputSchema,
      annotations: { readOnlyHint: true },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
      },
    },
    async (args) => {
      return {
        structuredContent: args,
        content: [
          {
            type: 'text' as const,
            text: `Health dashboard rendered for: "${args.question}"`,
          },
        ],
      }
    }
  )
}
