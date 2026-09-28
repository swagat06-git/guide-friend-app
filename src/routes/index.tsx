import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ArrowRight, Camera, Crosshair, MapPin, ScanSearch, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPreview, Footer, Header } from "@/components/AtlasUI";
import landscape from "@/assets/atlas-landscape.jpg";
import optics from "@/assets/atlas-optics.jpg";
import "@/styles/atlas-immersive.css";

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

function OpticalWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let pointerX = 0;
    let pointerY = 0;

    const particles = Array.from({ length: 180 }, (_, i) => ({
      angle: (i / 180) * Math.PI * 2,
      radius: 0.18 + Math.random() * 0.82,
      speed: 0.00008 + Math.random() * 0.00018,
      depth: 0.2 + Math.random() * 0.8,
      size: 0.35 + Math.random() * 1.8,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const move = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const draw = () => {
      frame += 1;
      ctx.clearRect(0, 0, width, height);

      const cx = width * (0.55 + pointerX * 0.018);
      const cy = height * (0.48 + pointerY * 0.012);
      const horizon = height * 0.5;

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.58);
      glow.addColorStop(0, "rgba(145, 232, 255, .16)");
      glow.addColorStop(.35, "rgba(79, 148, 201, .07)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(pointerX * 0.015);

      for (let i = 0; i < 11; i += 1) {
        const r = Math.min(width, height) * (0.08 + i * 0.065);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.42, r, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(173, 230, 246, ${0.035 + (11 - i) * 0.006})`;
        ctx.lineWidth = i === 5 ? 1.1 : .55;
        ctx.stroke();
      }

      for (let i = 0; i < 18; i += 1) {
        const x = -width * .5 + i * width / 17;
        ctx.beginPath();
        ctx.moveTo(x, horizon - cy);
        ctx.lineTo(x * .12, height * .5);
        ctx.strokeStyle = "rgba(139, 209, 231, .045)";
        ctx.stroke();
      }

      ctx.restore();

      particles.forEach((p, i) => {
        p.angle += p.speed;
        const orbit = p.radius * Math.min(width, height) * .7;
        const perspective = 0.35 + p.depth * 0.65;
        const x = cx + Math.cos(p.angle + frame * p.speed) * orbit * perspective;
        const y = cy + Math.sin(p.angle) * orbit * .45 * perspective;
        const alpha = Math.max(0.04, 0.22 * p.depth);
        ctx.beginPath();
        ctx.arc(x, y, p.size * perspective, 0, Math.PI * 2);
        ctx.fillStyle = i % 9 === 0
          ? `rgba(214, 249, 255, ${alpha + .1})`
          : `rgba(117, 204, 233, ${alpha})`;
        ctx.fill();
      });

      const targetX = width * (0.62 + pointerX * .045);
      const targetY = height * (0.43 + pointerY * .025);
      const pulse = 1 + Math.sin(frame * .035) * .035;

      ctx.save();
      ctx.translate(targetX, targetY);
      ctx.scale(pulse, pulse);
      [18, 33, 54].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(173, 239, 255, ${i === 0 ? .8 : .16})`;
        ctx.lineWidth = i === 0 ? 1.4 : .65;
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(-42, 0); ctx.lineTo(-13, 0);
      ctx.moveTo(13, 0); ctx.lineTo(42, 0);
      ctx.moveTo(0, -42); ctx.lineTo(0, -13);
      ctx.moveTo(0, 13); ctx.lineTo(0, 42);
      ctx.strokeStyle = "rgba(194, 244, 255, .8)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return <canvas ref={canvasRef} className="optical-world" aria-hidden="true" />;
}

function Home() {
  return <div className="atlas-immersive-site">
    <Header active="home" />
    <main>
      <section className="immersive-hero" aria-labelledby="hero-title">
        <OpticalWorld />
        <div className="immersive-noise" />
        <div className="immersive-vignette" />
        <div className="immersive-topline">
          <span>ATLAS / 01</span>
          <span>FSOC ACQUISITION SYSTEM</span>
          <span>30 FPS / ONLINE</span>
        </div>

        <div className="immersive-hero-copy">
          <p className="immersive-kicker">AUTONOMOUS TARGET LOCALIZATION AND ACQUISITION SYSTEM</p>
          <h1 id="hero-title">ATLAS</h1>
          <p className="immersive-lead">A machine that finds the signal.</p>
          <p className="immersive-body">Computer vision, state estimation and camera control working as one continuous acquisition loop.</p>
          <div className="immersive-actions">
            <Link to="/dashboard" className="immersive-primary">ENTER TRACKING CONSOLE <ArrowRight size={15} /></Link>
            <Link to="/benchmark-live" className="immersive-text-link">VERIFIED PERFORMANCE</Link>
          </div>
        </div>

        <div className="immersive-target-label">
          <span className="target-ping" />
          TARGET ACQUIRED
          <strong>0.03 S</strong>
        </div>

        <div className="immersive-metric metric-left"><span>LOCK RETENTION</span><strong>100%</strong></div>
        <div className="immersive-metric metric-right"><span>AVG CENTROID ERROR</span><strong>4.33 PX</strong></div>

        <div className="immersive-scroll"><span>SCROLL TO EXPLORE</span><i /></div>
      </section>

      <section className="immersive-story">
        <div className="story-index">02 / THE ACQUISITION LOOP</div>
        <div className="story-heading">
          <p>FROM SIGNAL TO LOCK</p>
          <h2>Five systems.<br /><em>One pursuit.</em></h2>
        </div>
        <div className="story-orbit" aria-hidden="true">
          <div className="orbit-core"><Crosshair size={30} /></div>
          <div className="orbit-line orbit-a" />
          <div className="orbit-line orbit-b" />
          <div className="orbit-line orbit-c" />
        </div>
        <div className="story-copy">
          <p>ATLAS continuously observes a virtual optical scene, identifies the beacon, estimates its motion and commands the camera toward the predicted position.</p>
          <Link to="/dashboard">OPEN LIVE SYSTEM <ArrowRight size={14} /></Link>
        </div>
      </section>

      <section className="immersive-pipeline" id="pipeline">
        <div className="pipeline-header">
          <span>03 / THE ARCHITECTURE</span>
          <p>DETECTION → LOCALIZATION → ESTIMATION → CONTROL</p>
        </div>
        <div className="pipeline-rail">
          {steps.slice(0, 4).map(({ number, title, description, icon: Icon }) => (
            <article key={number} className="immersive-node">
              <span>{number}</span>
              <Icon size={18} strokeWidth={1.2} />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="immersive-proof">
        <div>
          <span>04 / VERIFIED IN MOTION</span>
          <h2>The numbers<br /><em>hold the lock.</em></h2>
        </div>
        <div className="proof-grid">
          <div><strong>4.33</strong><span>PX AVG ERROR</span></div>
          <div><strong>0.03</strong><span>SEC ACQUISITION</span></div>
          <div><strong>1318</strong><span>FPS PROCESSING</span></div>
          <div><strong>100</strong><span>% LOCK RETENTION</span></div>
        </div>
        <Link to="/benchmark-live" className="immersive-proof-link">VIEW COMPLETE BENCHMARK <ArrowRight size={14} /></Link>
      </section>
    </main>
    <Footer />
  </div>;
}
