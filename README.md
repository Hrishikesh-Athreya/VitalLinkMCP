# VitalLink MCP

> A Model Context Protocol (MCP) server that connects your personal health data to AI assistants like Claude and ChatGPT — giving them real-time access to your glucose, vitals, sleep, meals, behavior, and more.

---

## What It Does

VitalLink MCP bridges a personal health data backend with any MCP-compatible AI client. Once connected, your AI assistant can:

- Retrieve your current health score, HRV, glucose, sleep, and steps
- Query continuous glucose monitor (CGM) readings and spot trends
- Analyze meals, glycemic load, and their impact on glucose
- Track behavioral patterns like screen time and dopamine debt
- Check environmental conditions (AQI, UV, pollen) and their health correlations
- Inspect skin analysis scores across acne, dark circles, oiliness, and more
- Explore a causal graph of how your health metrics influence each other
- Render a **live visual health dashboard** directly inside the AI client

---

## How It Works

```
AI Client (Claude / ChatGPT)
        │  MCP over StreamableHTTP
        ▼
  VitalLink MCP Server  (Node.js, port 3000)
        │
        ├── Registers 10 tools per session
        │
        └── fetchFromWorker() ──► Cloudflare Worker (health data API)
                                    /api/v1/query/...
```

Each AI client session gets its own isolated `McpServer` instance. Tools proxy requests to a Cloudflare Worker that stores and processes health data. One special tool — `render_health_insights` — passes synthesized data into a self-contained HTML dashboard widget that renders directly inside the AI client UI.

---

## Tools

| Tool | Description |
|---|---|
| `get_health_summary` | Overall health score, latest vitals, and active causal patterns |
| `query_glucose` | CGM glucose readings with trend and energy state |
| `query_meals` | Meal events with ingredients, glycemic load, and cooking method |
| `query_vitals` | HRV, heart rate, sleep, SpO2, steps, and body weight |
| `query_behavior` | Screen time and dopamine debt by app category |
| `query_environment` | Temperature, humidity, AQI, UV index, and pollen |
| `query_skin` | Skin analysis scores: acne, dark circles, redness, oiliness, pores, wrinkles |
| `query_causal_patterns` | Discovered health patterns (e.g. "high-GL meals → glucose spikes → poor sleep") |
| `query_causal_graph` | Causal edges between health nodes with strength and temporal offset |
| `render_health_insights` | Renders a visual health dashboard inside the AI client |

---

## Required APIs & Services

### 1. VitalLink Cloudflare Worker (Backend)
This is the core data API. It must be deployed separately and exposes the following endpoints consumed by this MCP server:

| Endpoint | Used By |
|---|---|
| `GET /api/v1/query/health-summary` | `get_health_summary` |
| `GET /api/v1/query/glucose` | `query_glucose` |
| `GET /api/v1/query/meals` | `query_meals` |
| `GET /api/v1/query/vitals` | `query_vitals` |
| `GET /api/v1/query/behavioral` | `query_behavior` |
| `GET /api/v1/query/environmental` | `query_environment` |
| `GET /api/v1/query/skin` | `query_skin` |
| `GET /api/v1/query/causal-patterns` | `query_causal_patterns` |
| `GET /api/v1/query/causal-graph` | `query_causal_graph` |

The default worker URL is `https://vita-cloud.hrishikesha40.workers.dev`. You can override this with the `VITA_CLOUD_URL` environment variable to point to your own deployment.

---

## Setup

### Prerequisites
- Node.js 18+
- npm
- A running instance of the VitalLink Cloudflare Worker (or access to the default one)

### Install

```bash
git clone https://github.com/your-username/VitalLinkMCP.git
cd VitalLinkMCP
npm install
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITA_CLOUD_URL` | `https://vita-cloud.hrishikesha40.workers.dev` | URL of the Cloudflare Worker health data API |
| `PORT` | `3000` | Port for the MCP HTTP server |

Create a `.env` file or export variables before running:

```bash
export VITA_CLOUD_URL=https://your-worker.workers.dev
export PORT=3000
```

### Run (Development)

```bash
npm run dev
```

### Run (Production)

```bash
npm run build
npm start
```

### Verify

```bash
curl http://localhost:3000/health
# → {"status":"ok","service":"vita-mcp"}
```

---

## Connecting to an AI Client

### Claude (via MCP settings)
Add the following to your MCP client config:

```json
{
  "mcpServers": {
    "vita-health": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### ChatGPT / OpenAI
Point a custom tool integration at `http://localhost:3000/mcp` using the StreamableHTTP transport.

---

## Project Structure

```
├── server.ts                     # HTTP server, session management, worker proxy
├── tools/
│   ├── health-summary.ts
│   ├── glucose.ts
│   ├── meals.ts
│   ├── vitals.ts
│   ├── behavior.ts
│   ├── environment.ts
│   ├── skin.ts
│   ├── causal-patterns.ts
│   ├── causal-graph.ts
│   └── render-health-insights.ts
├── widget.html                   # Self-contained health dashboard UI
├── resources/                    # Standalone React chart widgets
│   ├── causal-graph/
│   ├── glucose-chart/
│   ├── vitals-chart/
│   └── skin-report/
├── tsconfig.json
└── package.json
```

---

## Tech Stack

- **[Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)** — MCP server + StreamableHTTP transport
- **[@modelcontextprotocol/ext-apps](https://www.npmjs.com/package/@modelcontextprotocol/ext-apps)** — Embeds the widget as an MCP App resource/tool
- **[Zod](https://zod.dev)** — Runtime schema validation for all tool inputs
- **TypeScript** — Full type safety across server and tools
- **Cloudflare Workers** — Serverless health data backend (separate repo)
