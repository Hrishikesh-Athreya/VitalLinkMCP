import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../server.js'
import { fetchFromWorker } from '../server.js'

export function register(server: McpServer, ctx: ToolContext) {
  server.tool(
    'query_environment',
    'Get environmental conditions: temperature, humidity, AQI, UV index, pollen. Use for environment-health correlations.',
    {
      start_date: z.string().describe('ISO datetime start'),
      end_date: z.string().describe('ISO datetime end'),
    },
    async ({ start_date, end_date }) => {
      const data = await fetchFromWorker(ctx.workerUrl, '/api/v1/query/environmental', { start_date, end_date })

      const conditions = data.conditions as any[]
      if (conditions.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No environmental data found for this period.' }] }
      }

      const latest = conditions[0]
      const risks: string[] = []
      if (latest.aqiUS > 100) risks.push('High AQI')
      if (latest.temperatureCelsius > 33) risks.push('Extreme Heat')
      if (latest.temperatureCelsius < 5) risks.push('Extreme Cold')
      if (latest.pollenIndex >= 8) risks.push('High Pollen')
      if (latest.humidity > 75) risks.push('High Humidity')
      if (latest.uvIndex > 7) risks.push('High UV')

      const lines = [
        `## Environmental Conditions (${conditions.length} readings)`,
        '', '### Current',
        `- **Temperature**: ${latest.temperatureCelsius}\u00B0C`,
        `- **Humidity**: ${latest.humidity}%`,
        `- **AQI**: ${latest.aqiUS}`,
        `- **UV Index**: ${latest.uvIndex}`,
        `- **Pollen**: ${latest.pollenIndex}/12`,
        `- **Condition**: ${latest.condition}`,
      ]
      if (risks.length > 0) {
        lines.push('', `### Health Risks: ${risks.join(', ')}`)
      }

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] }
    }
  )
}
