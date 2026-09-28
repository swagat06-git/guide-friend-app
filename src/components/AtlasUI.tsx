import { Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight, Crosshair, Gauge, Radar, Settings2, Wifi, WifiOff } from "lucide-react";
import { useAtlas } from "./AtlasCore";
import type { TrackingResponse } from "@/types/tracking";

export const formatNumber = (value: number | null | undefined, digits = 2) => typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "N/A";
export const formatTime = (timestamp: number | null | undefined) => typeof timestamp === "number" && Number.isFinite(timestamp) ? new Date(timestamp * 1000).toLocaleTimeString() : "N/A";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className={`atlas-brand ${compact ? "atlas-brand-small" : ""}`} aria-label="ATLAS Home"><Crosshair aria-hidden="true" strokeWidth={1.5} /><span>ATLAS</span></Link>;
}

export function SystemStatus() {
  const { connection, trackingError } = useAtlas();
  const label = connection === "connecting" ? "Connecting to ATLAS core" : connection === "offline" ? "Backend unavailable" : trackingError ? "Connection lost" : "Backend connected";
  return <span className={`status-pill status-${connection === "connected" && trackingError ? "offline" : connection}`} role="status"><span className="status-dot" />{label}</span>;
}

export function Header({ active }: { active: "home" | "dashboard" | "benchmark" }) {
  return <header className="site-header"><div className="header-inner"><Brand /><nav aria-label="Main navigation"><Link to="/" className={active === "home" ? "nav-active" : ""}>Home</Link><Link to="/dashboard" className={active === "dashboard" ? "nav-active" : ""}>Dashboard</Link><Link to="/benchmark" className={active === "benchmark" ? "nav-active" : ""}>Performance</Link></nav><div className="header-right"><SystemStatus /><Link to="/dashboard" className="utility-link" title="Open dashboard" aria-label="Open dashboard"><ArrowUpRight size={16} /></Link></div></div></header>;
}

export function Footer() {
  return <footer className="site-footer"><div className="footer-inner"><Brand compact /><span className="footer-divider" /><span className="footer-subtitle">Autonomous Target Localization and Acquisition System</span><span className="footer-motto">SEE <b>/</b> TRACK <b>/</b> ACQUIRE</span></div></footer>;
}

export function TrackingViewport({ tracking, preview = false, grid = true }: { tracking: TrackingResponse | null; preview?: boolean; grid?: boolean }) {
  const x = tracking?.target?.x;
  const y = tracking?.target?.y;
  const valid = typeof x === "number" && typeof y === "number" && Number.isFinite(x) && Number.isFinite(y) && tracking?.status?.detected;
  return <div className={`tracking-viewport ${grid ? "viewport-grid" : ""} ${preview ? "viewport-preview" : ""} ${tracking ? "" : "viewport-unavailable"}`} role="img" aria-label={valid ? `Tracking viewport, target at X ${formatNumber(x)} Y ${formatNumber(y)}` : "Tracking viewport, no detected target"}>
    <div className="viewport-top"><span><span className="tiny-square" /> CAMERA FRAME / 640 × 480</span><span>{preview ? "ILLUSTRATIVE VIEW" : tracking ? "TRACKING DATA" : "NO FRAME AVAILABLE"} <span className="live-indicator" /></span></div>
    <span className="viewport-axis axis-top">X 320</span><span className="viewport-axis axis-left">Y 240</span>
    <span className="viewport-center"><i /><i /></span>
    {valid && <span className="target-reticle" style={{ left: `${Math.max(0, Math.min(100, x / 640 * 100))}%`, top: `${Math.max(0, Math.min(100, y / 480 * 100))}%` }}><span>TARGET</span><i /></span>}
    {!valid && !preview && <span className="viewport-empty">NO TARGET DETECTED</span>}
    <div className="viewport-bottom"><span>ATLAS / OPTICAL TRACKING</span><span>{valid ? `X ${formatNumber(x)}  ·  Y ${formatNumber(y)}` : "X N/A  ·  Y N/A"}</span></div>
    <i className="corner corner-tl" /><i className="corner corner-tr" /><i className="corner corner-bl" /><i className="corner corner-br" />
  </div>;
}

export function DashboardPreview() {
  return <div className="dashboard-preview" aria-label="Illustrative dashboard preview, not live telemetry"><div className="preview-top"><Brand compact /><span className="preview-demo">INTERFACE PREVIEW · NO LIVE DATA</span><span className="preview-time">--:--:--</span></div><div className="preview-body"><aside className="preview-sidebar"><span className="preview-sidebar-active"><Radar size={13} /> Overview</span><span><Crosshair size={13} /> Tracking</span><span><Activity size={13} /> Telemetry</span><span><Gauge size={13} /> System health</span><span><Settings2 size={13} /> Settings</span></aside><div className="preview-main"><div className="preview-title"><span>TRACKING OVERVIEW</span><span>STANDBY</span></div><TrackingViewport tracking={null} preview /><div className="preview-bottom"><span>DETECTION<b>—</b></span><span>TRACKING<b>—</b></span><span>CONFIDENCE<b>N/A</b></span></div></div><aside className="preview-stats"><span>TARGET POSITION<b>X  —<br />Y  —</b></span><span>VELOCITY<b>VX  —<br />VY  —</b></span><span>CAMERA COMMAND<b>PAN  —<br />TILT  —</b></span><span>LAST UPDATE<b>—</b></span></aside></div></div>;
}

export function ConnectionCallout() {
  const { connection, trackingError } = useAtlas();
  return <div className={`connection-callout ${connection === "connected" && !trackingError ? "callout-online" : ""}`}><span>{connection === "connecting" ? <Activity size={18} /> : connection === "offline" || trackingError ? <WifiOff size={18} /> : <Wifi size={18} />}</span><div><strong>{connection === "connecting" ? "CONNECTING TO ATLAS CORE..." : connection === "offline" ? "BACKEND OFFLINE" : trackingError ? "CONNECTION LOST" : "SYSTEM ONLINE"}</strong><small>{connection === "offline" ? "The tracking service is unavailable. Retrying automatically." : trackingError ? "Last received data is retained. Retrying automatically." : connection === "connecting" ? "Checking backend availability" : "Tracking telemetry is available"}</small></div></div>;
}