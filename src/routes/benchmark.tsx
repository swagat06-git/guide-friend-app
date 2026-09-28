import { createFileRoute } from "@tanstack/react-router";
import { Activity, CheckCircle2, Clock3, Gauge, LockKeyhole, Target, Zap } from "lucide-react";
import { Footer, Header } from "@/components/AtlasUI";

export const Route = createFileRoute("/benchmark")({
  head: () => ({ meta: [
    { title: "Performance — ATLAS Benchmark Validation" },
    { name: "description", content: "ATLAS benchmark validation results from the 30-second synthetic MP4 tracking scenario." },
  ] }),
  component: Benchmark,
});

const metrics = [
  { label: "Processing FPS", value: "1318.77", unit: "FPS", icon: Gauge, note: "30 FPS video input" },
  { label: "Average centroid error", value: "4.333", unit: "px", icon: Target, note: "Measured over 900 frames" },
  { label: "RMSE", value: "5.509", unit: "px", icon: Activity, note: "Frame-level tracking error" },
  { label: "Lock retention", value: "100.00", unit: "%", icon: LockKeyhole, note: "Continuous tracking lock" },
  { label: "Detection rate", value: "97.11", unit: "%", icon: Zap, note: "Detector measurements accepted" },
  { label: "Target loss", value: "0.00", unit: "%", icon: CheckCircle2, note: "No declared tracking loss" },
  { label: "Acquisition", value: "0.033", unit: "s", icon: Clock3, note: "Initial target acquisition" },
  { label: "Maximum error", value: "47.384", unit: "px", icon: Target, note: "Largest observed frame error" },
];

function Benchmark() {
  return <div className="atlas-site dashboard-site"><Header active="benchmark" /><main className="benchmark-content">
    <div className="benchmark-hero">
      <div><p className="eyebrow">ATLAS / PERFORMANCE VALIDATION</p><h1>Benchmark Results</h1><p>Measured tracking performance from the frozen 30-second synthetic MP4 benchmark.</p></div>
      <div className="benchmark-badge"><span className="status-dot status-dot-live" /><span>VALIDATION BASELINE</span><small>900 FRAMES · 30 FPS · 30.0 S</small></div>
    </div>

    <section className="benchmark-summary">
      <div className="benchmark-summary-copy"><span className="benchmark-kicker">PRIMARY RESULT</span><strong>4.333 <em>px</em></strong><p>Average centroiding error across the complete benchmark sequence.</p></div>
      <div className="benchmark-summary-side"><span>INPUT</span><b>30 FPS MP4</b><span>PROCESSING</span><b>1318.77 FPS</b></div>
    </section>

    <section aria-labelledby="metrics-title"><div className="section-caption"><span id="metrics-title">MEASURED PERFORMANCE</span><span>FROZEN BASELINE</span></div>
      <div className="benchmark-grid">{metrics.map(({ label, value, unit, icon: Icon, note }) => <article className="benchmark-card" key={label}><div className="benchmark-card-top"><Icon size={17} /><span>{label}</span></div><div className="benchmark-value">{value}<small>{unit}</small></div><p>{note}</p></article>)}</div>
    </section>

    <section className="benchmark-analysis"><div><div className="section-caption"><span>VALIDATION STATUS</span><span>REQUIREMENT CHECK</span></div><div className="validation-list">
      <div><CheckCircle2 size={16} /><span>Average tracking error ≤ 10 px</span><strong>PASS · 4.333 px</strong></div>
      <div><CheckCircle2 size={16} /><span>Processing rate ≥ 20 FPS</span><strong>PASS · 1318.77 FPS</strong></div>
      <div><CheckCircle2 size={16} /><span>Acquisition ≤ 2 s</span><strong>PASS · 0.033 s</strong></div>
      <div><CheckCircle2 size={16} /><span>Target loss &lt; 5%</span><strong>PASS · 0.00%</strong></div>
    </div></div>
      <aside className="benchmark-note"><span>IMPORTANT</span><p>The 10 px requirement is represented here by the measured <b>average</b> centroid error. The maximum observed error was 47.384 px and is shown separately rather than hidden.</p></aside>
    </section>
  </main><Footer /></div>;
}
