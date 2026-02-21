/** Causal Graph Widget — force-directed graph of health metric relationships */

interface GraphNode {
  id: string;
  type: string; // glucose, meal, sleep, behavior, environment, skin, hrv
}

interface GraphEdge {
  source: string;
  target: string;
  edgeType: string;
  strength: number;
  confidence: number;
  offsetMin: number;
}

interface CausalGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const NODE_COLORS: Record<string, string> = {
  glucose: "#3b82f6",
  meal: "#eab308",
  sleep: "#8b5cf6",
  behavior: "#f97316",
  environment: "#22c55e",
  skin: "#ec4899",
  hrv: "#06b6d4",
  energy: "#f43f5e",
  default: "#94a3b8",
};

function getNodeColor(type: string): string {
  return NODE_COLORS[type] || NODE_COLORS.default;
}

export default function CausalGraph(props: CausalGraphProps) {
  const { nodes, edges } = props;

  if (nodes.length === 0) {
    return <div style={{ padding: "16px", fontFamily: "system-ui" }}>No causal graph data available.</div>;
  }

  // Simple circular layout (force-directed would need animation/JS runtime)
  const CX = 220;
  const CY = 200;
  const R = 140;
  const W = 440;
  const H = 400;

  const nodePositions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node, i) => {
    const angle = (Math.PI * 2 * i) / nodes.length - Math.PI / 2;
    nodePositions[node.id] = {
      x: CX + R * Math.cos(angle),
      y: CY + R * Math.sin(angle),
    };
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: "480px", padding: "16px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
        Causal Health Graph
        <span style={{ fontSize: "11px", opacity: 0.5, marginLeft: "8px" }}>
          {nodes.length} nodes, {edges.length} edges
        </span>
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Edges */}
        {edges.map((e, i) => {
          const from = nodePositions[e.source];
          const to = nodePositions[e.target];
          if (!from || !to) return null;

          const opacity = Math.max(0.2, e.strength);
          const strokeWidth = 1 + e.strength * 3;
          const isStrong = e.strength >= 0.7 && e.confidence >= 0.6;

          // Arrow
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = dx / len;
          const ny = dy / len;
          const arrowX = to.x - nx * 18;
          const arrowY = to.y - ny * 18;

          return (
            <g key={`edge-${i}`}>
              <line
                x1={from.x} y1={from.y} x2={arrowX} y2={arrowY}
                stroke={isStrong ? "#f97316" : "rgba(255,255,255,0.3)"}
                strokeWidth={strokeWidth} opacity={opacity}
                markerEnd="url(#arrow)"
              />
              {/* Offset label */}
              {e.offsetMin > 0 && (
                <text
                  x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6}
                  textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)"
                >
                  {e.offsetMin}min
                </text>
              )}
            </g>
          );
        })}

        {/* Arrow marker def */}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="rgba(255,255,255,0.4)" />
          </marker>
        </defs>

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = nodePositions[node.id];
          const color = getNodeColor(node.type);
          return (
            <g key={node.id}>
              <circle cx={pos.x} cy={pos.y} r="16" fill={color} opacity={0.9} />
              <text x={pos.x} y={pos.y + 28} textAnchor="middle"
                fontSize="10" fill="rgba(255,255,255,0.7)">
                {node.id.length > 12 ? node.id.slice(0, 12) + "…" : node.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px", fontSize: "11px" }}>
        {Object.entries(NODE_COLORS).filter(([k]) => k !== "default").map(([type, color]) => (
          <span key={type} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, display: "inline-block" }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}
