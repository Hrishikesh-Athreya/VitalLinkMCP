/** Vitals Chart Widget — sparkline cards for HRV, HR, sleep, SpO2, steps */

interface VitalSeries {
  label: string;
  unit: string;
  latest: number;
  average: number;
  values: { timestamp: string; value: number }[];
  color: string;
}

interface VitalsChartProps {
  series: VitalSeries[];
}

function Sparkline({ values, color, width = 120, height = 32 }: {
  values: number[]; color: string; width?: number; height?: number;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export default function VitalsChart(props: VitalsChartProps) {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: "480px", padding: "16px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Vitals Overview</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {props.series.map((s) => (
          <div key={s.label} style={{
            padding: "12px", borderRadius: "8px",
            background: "rgba(255,255,255,0.05)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", opacity: 0.6 }}>{s.label}</span>
              <span style={{ fontSize: "11px", opacity: 0.4 }}>avg {s.average.toFixed(1)}</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>
              {s.latest.toFixed(s.unit === "hrs" ? 1 : 0)}
              <span style={{ fontSize: "12px", opacity: 0.5 }}> {s.unit}</span>
            </div>
            <Sparkline values={s.values.map((v) => v.value)} color={s.color} />
          </div>
        ))}
      </div>
    </div>
  );
}
