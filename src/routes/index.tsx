import { createFileRoute, Link } from "@tanstack/react-router";
import type { PointerEvent } from "react";
import { ArrowRight, Camera, Crosshair, MapPin, Radio, ScanSearch, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPreview, Footer, Header } from "@/components/AtlasUI";
import landscape from "@/assets/atlas-landscape.jpg";
import optics from "@/assets/atlas-optics.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "ATLAS — Autonomous Target Localization and Acquisition System" },
    { name: "description", content: "ATLAS combines computer vision, state estimation, and camera control for autonomous target tracking. Explore the system and open the live monitoring dashboard." },
    { property: "og:title", content: "ATLAS — Autonomous Target Localization and Acquisition System" },
    { property: "og:description", content: "Explore the ATLAS autonomous target tracking system and its live monitoring dashboard." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

const steps = [
  { number: "01", title: "Target Detection", description: "CNN-based ML detector identifies the target in real time.", icon: ScanSearch },
  { number: "02", title: "Localization", description: "Precise target position estimation in the frame.", icon: MapPin },
  { number: "03", title: "Motion Estimation", description: "Kalman filter estimates position and velocity.", icon: TrendingUp },
  { number: "04", title: "Camera Control", description: "Velocity-aware controller generates pan/tilt commands.", icon: Camera },
  { number: "05", title: "System Health", description: "Live monitoring and telemetry for reliable operation.", icon: ShieldCheck },
];

function moveBackground(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const section = event.currentTarget;
  const rect = section.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  section.style.setProperty("--cursor-x", `${x}px`);
  section.style.setProperty("--cursor-y", `${y}px`);
  section.style.setProperty("--image-shift-x", `${(x / rect.width - 0.5) * -18}px`);
  section.style.setProperty("--image-shift-y", `${(y / rect.height - 0.5) * -12}px`);
  section.classList.add("background-active");
}

function leaveBackground(event: PointerEvent<HTMLElement>) {
  event.currentTarget.classList.remove("background-active");
  event.currentTarget.style.setProperty("--image-shift-x", "0px");
  event.currentTarget.style.setProperty("--image-shift-y", "0px");
}

function Home() {
  return <div className="atlas-site"><Header active="home" /><main>
    <section className="home-hero" aria-labelledby="hero-title" onPointerMove={moveBackground} onPointerLeave={leaveBackground}><img className="hero-landscape" src={landscape} width={1920} height={1088} alt="Dark mountain ridges beneath Earth from space" /><div className="hero-overlay" /><div className="hero-inner"><div className="hero-copy"><p className="eyebrow">AUTONOMOUS <span>/</span> PRECISE <span>/</span> RELIABLE</p><h1 id="hero-title" className="hero-wordmark"><Crosshair aria-hidden="true" strokeWidth={1.2} />ATLAS</h1><h2>Autonomous Target Localization<br />and Acquisition System</h2><p>ATLAS is an autonomous vision pipeline for coarse alignment of mobile Free Space Optical Communication terminals. It combines learned target detection, state estimation, and velocity-aware camera control.</p><p>A live operations interface for observing acquisition, tracking state, camera commands, and verified benchmark performance.</p><div className="hero-actions"><Button asChild variant="hero" size="lg"><Link to="/dashboard">Launch Tracking Console <ArrowRight size={16} /></Link></Button><Link className="hero-secondary-link" to="/benchmark-live">View verified performance <TrendingUp size={15} /></Link></div></div><div className="hero-preview-wrap"><div className="hero-terminal-label"><span className="status-dot status-dot-live" /> LIVE CORE LINK <b>30 FPS</b></div><DashboardPreview /><div className="hero-readout"><span>ACQUISITION</span><strong>0.03 s</strong><span>AVG ERROR</span><strong>4.33 px</strong><span>LOCK</span><strong>100%</strong></div></div></div></section>
    <section className="system-section" id="system" aria-labelledby="system-title" onPointerMove={moveBackground} onPointerLeave={leaveBackground}><div className="system-image" style={{ backgroundImage: `url(${optics})` }} /><div className="system-inner"><div className="system-intro"><p className="eyebrow">THE SYSTEM</p><h2 id="system-title">From Detection to<br /><em>Acquisition</em></h2><p>ATLAS combines computer vision, state estimation, and control to deliver real-time autonomous target tracking and camera control.</p><span className="intro-rule" /><a href="#pipeline" className="text-link">Explore the Pipeline <ArrowRight size={15} /></a></div><div className="radar-art" aria-label="Illustrative target localization visualization"><div className="radar-ring radar-ring-outer" /><div className="radar-ring radar-ring-mid" /><div className="radar-ring radar-ring-inner" /><div className="radar-cross radar-cross-horizontal" /><div className="radar-cross radar-cross-vertical" /><div className="radar-orbit" /><div className="radar-core"><img src={optics} width={1536} height={1024} loading="lazy" alt="Optical tracking camera in a mountain environment" /><Crosshair size={38} strokeWidth={1} /></div><span className="radar-node node-one" /><span className="radar-node node-two" /><span className="radar-node node-three" /></div><div className="pipeline" id="pipeline">{steps.map(({ number, title, description, icon: Icon }) => <div className="pipeline-step" key={number}><div className="step-icon"><Icon size={20} strokeWidth={1.4} /></div><span className="step-number">{number}</span><div><h3>{title}</h3><p>{description}</p></div></div>)}</div></div></section>
  </main><Footer /></div>;
}