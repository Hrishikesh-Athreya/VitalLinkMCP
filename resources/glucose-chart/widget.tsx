/** Glucose Chart Widget — 24h line chart with meal markers */

interface GlucoseReading {
  glucoseMgDL: number;
  timestamp: string;
  trend: string;
  energyState: string;
}

interface MealMarker {
  timestamp: string;
  label: string;
  glycemicLoad: number | null;
}

interface GlucoseChartProps {
  readings: GlucoseReading[];
  meals: MealMarker[];
  average: number;
  min: number;
  max: number;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function GlucoseChart(props: GlucoseChartProps) {
  const { readings, meals, average, min, max } = props;
  if (readings.length === 0) {
    return <div style={{ padding: "16px", fontFamily: "system-ui" }}>No glucose data available.</div>;
  }

  // SVG chart dimensions
  const W = 440;
  const H = 200;
  const PAD = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Scale
  const values = readings.map((r) => r.glucoseMgDL);
  const yMin = Math.min(60, ...values);
  const yMax = Math.max(180, ...values);
  const times = readings.map((r) => new Date(r.timestamp).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tRange = tMax - tMin || 1;

  const xScale = (t: number) => PAD.left + ((t - tMin) / tRange) * chartW;
  const yScale = (v: number) => PAD.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  // Path
  const sorted = [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const pathD = sorted
    .map((r, i) => {
      const x = xScale(new Date(r.timestamp).getTime());
      const y = yScale(r.glucoseMgDL);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Zone bands
  const normalLow = yScale(70);
  const normalHigh = yScale(140);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: "480px", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600 }}>Glucose</span>
        <span style={{ fontSize: "12px", opacity: 0.6 }}>
          Avg: {average.toFixed(0)} | Range: {min}–{max} mg/dL
        </span>
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Normal range band */}
        <rect x={PAD.left} y={normalHigh} width={chartW} height={normalLow - normalHigh}
          fill="rgba(34,197,94,0.1)" />

        {/* Grid lines */}
        {[70, 100, 140, 180].map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)}
              stroke="rgba(255,255,255,0.1)" strokeDasharray="3,3" />
            <text x={PAD.left - 5} y={yScale(v) + 4} textAnchor="end"
              fill="rgba(255,255,255,0.4)" fontSize="10">{v}</text>
          </g>
        ))}

        {/* Glucose line */}
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />

        {/* Data points colored by energy state */}
        {sorted.map((r, i) => {
          const x = xScale(new Date(r.timestamp).getTime());
          const y = yScale(r.glucoseMgDL);
          const color = r.energyState === "crashing" ? "#ef4444"
            : r.energyState === "rising" ? "#f97316"
            : r.energyState === "reactiveLow" ? "#a855f7"
            : "#3b82f6";
          return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
        })}

        {/* Meal markers */}
        {meals.map((m, i) => {
          const x = xScale(new Date(m.timestamp).getTime());
          return (
            <g key={`meal-${i}`}>
              <line x1={x} y1={PAD.top} x2={x} y2={H - PAD.bottom}
                stroke="#eab308" strokeDasharray="4,4" strokeWidth="1" />
              <text x={x} y={H - PAD.bottom + 14} textAnchor="middle"
                fill="#eab308" fontSize="9">
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: "12px", fontSize: "11px", opacity: 0.6, marginTop: "4px" }}>
        <span>● Stable</span>
        <span style={{ color: "#f97316" }}>● Rising</span>
        <span style={{ color: "#ef4444" }}>● Crashing</span>
        <span style={{ color: "#a855f7" }}>● Reactive Low</span>
        <span style={{ color: "#eab308" }}>┆ Meal</span>
      </div>
    </div>
  );
}
