/** Health Dashboard Widget — circular gauge + vitals grid + pattern list */

interface HealthDashboardProps {
  healthScore: number;
  healthLabel: string;
  glucose: number | null;
  hrv: number | null;
  heartRate: number | null;
  sleepHours: number | null;
  steps: number | null;
  dopamineDebt: number | null;
  skinScore: number | null;
  topPatterns: { pattern: string; strength: number }[];
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function VitalCard({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", textAlign: "center" }}>
      <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: 700 }}>
        {value != null ? value : "—"}
        {unit && <span style={{ fontSize: "12px", opacity: 0.6 }}> {unit}</span>}
      </div>
    </div>
  );
}

export default function HealthDashboard(props: HealthDashboardProps) {
  const color = scoreColor(props.healthScore);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: "480px", padding: "16px" }}>
      {/* Score gauge */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{
          width: "120px", height: "120px", borderRadius: "50%",
          border: `6px solid ${color}`, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        }}>
          <div style={{ fontSize: "36px", fontWeight: 700, color }}>{props.healthScore}</div>
          <div style={{ fontSize: "11px", opacity: 0.6 }}>{props.healthLabel}</div>
        </div>
      </div>

      {/* Vitals grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
        <VitalCard label="Glucose" value={props.glucose != null ? Math.round(props.glucose) : null} unit="mg/dL" />
        <VitalCard label="HRV" value={props.hrv != null ? Math.round(props.hrv) : null} unit="ms" />
        <VitalCard label="Heart Rate" value={props.heartRate != null ? Math.round(props.heartRate) : null} unit="bpm" />
        <VitalCard label="Sleep" value={props.sleepHours != null ? props.sleepHours.toFixed(1) : null} unit="hrs" />
        <VitalCard label="Steps" value={props.steps != null ? props.steps.toLocaleString() : null} />
        <VitalCard label="Skin" value={props.skinScore} unit="/100" />
      </div>

      {/* Dopamine debt */}
      {props.dopamineDebt != null && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "4px" }}>Dopamine Debt</div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "8px" }}>
            <div style={{
              width: `${props.dopamineDebt}%`, height: "100%", borderRadius: "4px",
              background: props.dopamineDebt > 60 ? "#ef4444" : props.dopamineDebt > 30 ? "#eab308" : "#22c55e",
            }} />
          </div>
        </div>
      )}

      {/* Patterns */}
      {props.topPatterns.length > 0 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Active Patterns</div>
          {props.topPatterns.map((p, i) => (
            <div key={i} style={{ fontSize: "13px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              {p.pattern}
              <span style={{ float: "right", opacity: 0.6 }}>{(p.strength * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
