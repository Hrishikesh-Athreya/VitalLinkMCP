import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../server.js'
import { fetchFromWorker } from '../server.js'

export function register(server: McpServer, ctx: ToolContext) {
  server.tool(
    'query_meals',
    'Get meal events with ingredients, glycemic load, and cooking method. Use for nutrition analysis and glucose-meal correlations.',
    {
      start_date: z.string().describe('ISO datetime start'),
      end_date: z.string().describe('ISO datetime end'),
    },
    async ({ start_date, end_date }) => {
      const data = await fetchFromWorker(ctx.workerUrl, ctx.token, '/api/v1/query/meals', { start_date, end_date })

      const meals = data.meals as any[]
      if (meals.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No meals found for this period.' }] }
      }

      const lines = [`## Meals (${meals.length} events)`, '']
      for (const m of meals) {
        let ingredients: any[] = []
        try { ingredients = JSON.parse(m.ingredients) } catch {}
        const ingredientList = ingredients.map((i: any) => i.name).join(', ')

        lines.push(`### ${m.timestamp}`)
        lines.push(`- **Source**: ${m.source} (${m.eventType})`)
        lines.push(`- **Ingredients**: ${ingredientList || 'N/A'}`)
        if (m.cookingMethod) lines.push(`- **Cooking**: ${m.cookingMethod}`)
        if (m.estimatedGlycemicLoad != null) lines.push(`- **Glycemic Load**: ${m.estimatedGlycemicLoad.toFixed(1)}`)
        lines.push('')
      }

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] }
    }
  )
}
