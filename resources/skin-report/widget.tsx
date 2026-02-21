/** Skin Report Widget — radar chart of condition scores + overall score */

interface SkinCondition {
  type: string;
  uiScore: number;
  severity: number;
}

interface SkinReportProps {
  overallScore: number;
  conditions: SkinCondition[];
  timestamp: string;
  apiSource: string;
}

const LABELS: Record<string, string> = {
  acne: "Acne",
  dark_circle_v2: "Dark Circles",
  redness: "Redness",
  oiliness: "Oiliness",
  pore: "Pores",
  wrinkle: "Wrinkles",
  eye_bag: "Eye Bags",
};

function severityColor(severity: number): string {
  if (severity >= 0.7) return "#ef4444";
  if (severity >= 0.4) return "#eab308";
  return "#22c55e";
}

export default function SkinReport(props: SkinReportProps) {
  const { overallScore, conditions, timestamp } = props;

  // Radar chart
  const CX = 140;
  const CY = 140;
  const R = 100;
  const n = conditions.length || 1;

  function polarToCart(i: number, value: number) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (value / 100) * R;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  }

  const radarPoints = conditions.map((c, i) => polarToCart(i, c.uiScore));
  const radarPath = radarPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: "480px", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600 }}>Skin Analysis</div>
          <div style={{ fontSize: "11px", opacity: 0.5 }}>{new Date(timestamp).toLocaleDateString()}</div>
        </div>
        <div style={{
          width: "56px", height: "56px", borderRadius: "50%",
          border: `4px solid ${overallScore >= 70 ? "#22c55e" : overallScore >= 40 ? "#eab308" : "#ef4444"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px", fontWeight: 700,
        }}>
          {overallScore}
        </div>
      </div>

      {conditions.length > 0 && (
        <>
          {/* Radar */}
          <svg width={280} height={280} viewBox="0 0 280 280" style={{ display: "block", margin: "0 auto 12px" }}>
            {/* Grid rings */}
            {[25, 50, 75, 100].map((v) => (
              <circle key={v} cx={CX} cy={CY} r={(v / 100) * R}
                fill="none" stroke="rgba(255,255,255,0.1)" />
            ))}
            {/* Axis lines + labels */}
            {conditions.map((c, i) => {
              const end = polarToCart(i, 100);
              const labelPos = polarToCart(i, 115);
              return (
                <g key={i}>
                  <line x1={CX} y1={CY} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.1)" />
                  <text x={labelPos.x} y={labelPos.y} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)">
                    {LABELS[c.type] || c.type}
                  </text>
                </g>
              );
            })}
            {/* Data polygon */}
            <path d={radarPath} fill="rgba(168,85,247,0.2)" stroke="#a855f7" strokeWidth="2" />
            {/* Data points */}
            {radarPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill={severityColor(conditions[i].severity)} />
            ))}
          </svg>

          {/* Condition list */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {conditions.map((c) => (
              <div key={c.type} style={{
                padding: "8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: "12px" }}>{LABELS[c.type] || c.type}</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: severityColor(c.severity) }}>
                  {c.uiScore}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
