import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Camera, Crosshair, Gauge, Radar, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAtlas, useMonitoring } from "@/components/AtlasCore";
import { ConnectionCallout, Footer, formatNumber, formatTime, Header, TrackingViewport } from "@/components/AtlasUI";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — ATLAS Live Tracking" },
    { name: "description", content: "Monitor ATLAS backend connectivity, target location, tracking status, velocity and camera commands in real time." },
    { property: "og:title", content: "Dashboard — ATLAS Live Tracking" },
    { property: "og:description", content: "Live ATLAS target tracking and camera command monitoring console." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  useMonitoring();
  const { tracking, history, connection, trackingError, apiBaseUrl, setApiBaseUrl, pollInterval, setPollInterval } = useAtlas();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [grid, setGrid] = useState(true);
  const [telemetryVisible, setTelemetryVisible] = useState(true);
  const [urlDraft, setUrlDraft] = useState(apiBaseUrl);
  const status = connection === "offline" ? "BACKEND OFFLINE" : tracking?.status?.detected && tracking?.status?.tracking ? "TARGET ACQUIRED" : tracking?.status?.tracking ? "DETECTION LOST" : tracking ? "TRACKING INACTIVE" : "AWAITING DATA";
  const substatus = connection === "offline" ? "Tracking service unreachable" : tracking?.status?.detected && tracking?.status?.tracking ? "TRACKING ACTIVE" : tracking?.status?.tracking ? "PREDICTIVE TRACKING" : tracking ? "TRACKING INACTIVE" : "NO TRACKING TELEMETRY";
  const x = tracking?.target?.x;
  const y = tracking?.target?.y;
  const points = history.filter(item => typeof item.target?.x === "number" && typeof item.target?.y === "number").slice(-60);
  const plot = (axis: "x" | "y") => points.map((item, index) => `${(index / Math.max(1, points.length - 1) * 600).toFixed(1)},${(120 - ((item.target?.[axis] ?? 0) / (axis === "x" ? 640 : 480) * 120)).toFixed(1)}`).join(" ");

  return <div className="atlas-site dashboard-site"><Header active="dashboard" /><main className="dashboard-content"><div className="dashboard-heading"><div><p className="eyebrow">ATLAS / MONITORING CONSOLE</p><h1>Tracking Dashboard</h1><p>Autonomous Target Localization and Acquisition System</p></div><div className="dashboard-heading-right"><span className="update-label">LAST UPDATE <strong>{formatTime(tracking?.metadata?.timestamp)}</strong></span><Button variant="outline" size="icon" title="Visualization settings" aria-label="Visualization settings" onClick={() => setSettingsOpen(true)}><Settings2 size={18} /></Button></div></div>
    <ConnectionCallout />
    <div className="dashboard-layout"><div className="dashboard-primary"><div className="section-caption"><span><Radar size={16} /> TRACKING VIEWPORT</span><span>FRAME COORDINATES / 640 × 480</span></div><TrackingViewport tracking={tracking} grid={grid} /><div className="dashboard-status-row"><div className="state-panel"><span className="panel-icon"><Crosshair size={20} /></span><div><small>TARGET STATUS</small><strong>{status}</strong><span>{substatus}</span></div></div><div className="state-panel"><span className="panel-icon"><Activity size={20} /></span><div><small>CONNECTION</small><strong>{trackingError ? "CONNECTION LOST" : connection === "connected" ? "CONNECTED" : connection === "connecting" ? "CONNECTING" : "BACKEND OFFLINE"}</strong><span>{trackingError ? "Retrying / previous data shown" : connection === "connected" ? "ATLAS core reachable" : "Waiting for ATLAS core"}</span></div></div></div>
      <div className="history-panel"><div className="section-caption"><span><Gauge size={16} /> TRACKING HISTORY</span><span>{points.length} SAMPLES / RECENT UPDATES</span></div><div className="chart-wrap">{points.length > 1 ? <svg viewBox="0 0 600 120" preserveAspectRatio="none" role="img" aria-label="Recent target X and Y coordinates"><line x1="0" y1="60" x2="600" y2="60" className="chart-midline" /><polyline points={plot("x")} className="chart-line chart-x" /><polyline points={plot("y")} className="chart-line chart-y" /></svg> : <span>Waiting for tracking samples</span>}</div><div className="chart-legend"><span><i className="legend-x" /> TARGET X</span><span><i className="legend-y" /> TARGET Y</span></div></div></div>
      <aside className="dashboard-telemetry"><div className="section-caption"><span>LIVE TELEMETRY</span><Button variant="ghost" size="sm" onClick={() => setTelemetryVisible(value => !value)}>{telemetryVisible ? "Hide" : "Show"}</Button></div>{telemetryVisible && <><div className="telemetry-panel"><div className="telemetry-heading"><Crosshair size={17} /><span>TARGET POSITION</span></div><div className="value-pair"><div><small>X COORDINATE</small><strong>{formatNumber(x)}</strong></div><div><small>Y COORDINATE</small><strong>{formatNumber(y)}</strong></div></div><div className="telemetry-foot">CENTER OFFSET <span>ΔX {typeof x === "number" ? formatNumber(x - 320) : "N/A"} <b>/</b> ΔY {typeof y === "number" ? formatNumber(y - 240) : "N/A"}</span></div></div>
      <div className="telemetry-panel"><div className="telemetry-heading"><Activity size={17} /><span>VELOCITY</span></div><div className="value-pair"><div><small>VX</small><strong>{formatNumber(tracking?.velocity?.x)}</strong></div><div><small>VY</small><strong>{formatNumber(tracking?.velocity?.y)}</strong></div></div></div>
      <div className="telemetry-panel"><div className="telemetry-heading"><Camera size={17} /><span>CAMERA COMMAND</span></div><div className="value-pair"><div><small>PAN SPEED</small><strong>{formatNumber(tracking?.camera?.pan_speed)}</strong></div><div><small>TILT SPEED</small><strong>{formatNumber(tracking?.camera?.tilt_speed)}</strong></div></div></div>
      <div className="telemetry-panel"><div className="telemetry-heading"><Radar size={17} /><span>DETECTION</span></div><div className="info-line"><span>DETECTED</span><strong>{tracking ? tracking.status.detected ? "YES" : "NO" : "N/A"}</strong></div><div className="info-line"><span>TRACKING</span><strong>{tracking ? tracking.status.tracking ? "ACTIVE" : "INACTIVE" : "N/A"}</strong></div><div className="info-line"><span>CONFIDENCE</span><strong>{tracking?.metadata?.confidence == null ? "N/A" : formatNumber(tracking.metadata.confidence)}</strong></div><div className="info-line"><span>TIMESTAMP</span><strong>{formatTime(tracking?.metadata?.timestamp)}</strong></div></div></>}
      <div className="pipeline-panel"><small>PROCESSING PIPELINE</small><p>SIMULATOR <b>→</b> CAMERA FRAME <b>→</b> ML DETECTOR <b>→</b> KALMAN FILTER <b>→</b> CAMERA CONTROLLER <b>→</b> CAMERA COMMAND</p></div></aside></div>
    {settingsOpen && <div className="settings-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSettingsOpen(false); }}><section className="settings-dialog" role="dialog" aria-modal="true" aria-label="Visualization settings"><div className="settings-heading"><h2>Settings</h2><Button variant="ghost" size="icon" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><X size={18} /></Button></div><form onSubmit={event => { event.preventDefault(); setApiBaseUrl(urlDraft.trim() || apiBaseUrl); setSettingsOpen(false); }}><label>API BASE URL<input value={urlDraft} onChange={event => setUrlDraft(event.target.value)} type="url" required /></label><label>POLLING INTERVAL (MS)<input type="number" min="100" max="10000" step="100" value={pollInterval} onChange={event => setPollInterval(Number(event.target.value) || 100)} /></label><label className="check-row"><input type="checkbox" checked={grid} onChange={event => setGrid(event.target.checked)} /> Visualization grid</label><label className="check-row"><input type="checkbox" checked={telemetryVisible} onChange={event => setTelemetryVisible(event.target.checked)} /> Show telemetry</label><Button type="submit">Apply settings</Button></form></section></div>}
  </main><Footer /></div>;
}