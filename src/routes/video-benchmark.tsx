import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2, Gauge, LockKeyhole, Play, Target, Upload, X } from "lucide-react";
import { Footer, Header } from "@/components/AtlasUI";
import { api, DEFAULT_API_BASE_URL } from "@/services/api";
import type { VideoBenchmarkResponse } from "@/types/tracking";

export const Route = createFileRoute("/video-benchmark")({
  head: () => ({
    meta: [
      { title: "Video Benchmark — ATLAS" },
      {
        name: "description",
        content: "Upload a short MP4 and run it through the ATLAS tracking pipeline.",
      },
    ],
  }),
  component: VideoBenchmark,
});

const MAX_SECONDS = 30;
const MAX_BYTES = 100 * 1024 * 1024;

const fmt = (value: number | null | undefined, digits = 2) =>
  value == null ? "—" : value.toFixed(digits);

function VideoBenchmark() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<{ duration: number; width: number; height: number; fps: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<VideoBenchmarkResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setVideoInfo(null);
    setData(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectFile(next: File | null) {
    setError("");
    setData(null);

    if (!next) return;

    if (!next.name.toLowerCase().endsWith(".mp4")) {
      setError("Only MP4 files are supported.");
      return;
    }

    if (next.size > MAX_BYTES) {
      setError("The video must be 100 MB or smaller.");
      return;
    }

    const url = URL.createObjectURL(next);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const duration = probe.duration;
      const width = probe.videoWidth;
      const height = probe.videoHeight;

      if (!Number.isFinite(duration) || duration <= 0) {
        URL.revokeObjectURL(url);
        setError("ATLAS could not read the video's duration.");
        return;
      }

      if (duration > MAX_SECONDS + 0.05) {
        URL.revokeObjectURL(url);
        setError("Video must be 30 seconds or shorter.");
        return;
      }

      if (width !== 640 || height !== 480) {
        URL.revokeObjectURL(url);
        setError("The current detector expects a 640 × 480 video.");
        return;
      }

      setFile(next);
      setPreviewUrl(url);
      setVideoInfo({ duration, width, height, fps: 0 });
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      setError("The selected file is not a readable video.");
    };
    probe.src = url;
  }

  async function runTest() {
    if (!file || busy) return;

    setBusy(true);
    setError("");
    setData(null);

    try {
      const result = await api.runVideoBenchmark(file);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video benchmark failed.");
    } finally {
      setBusy(false);
    }
  }

  const r = data?.result;

  return (
    <div className="atlas-site dashboard-site">
      <Header active="benchmark" />
      <main style={{ minHeight: "calc(100vh - 160px)", padding: "110px 7% 80px", background: "radial-gradient(circle at 70% 10%, rgba(67,160,190,.10), transparent 35%), #030506" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <Link to="/benchmark-live" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(200,225,232,.48)", textDecoration: "none", font: "9px var(--font-mono)", letterSpacing: ".15em", marginBottom: 28 }}>
            <ArrowLeft size={14} /> BACK TO PERFORMANCE
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 40, alignItems: "end", flexWrap: "wrap" }}>
            <div style={{ maxWidth: 720 }}>
              <p className="eyebrow">ATLAS / VIDEO BENCHMARK</p>
              <h1 style={{ margin: "12px 0", fontSize: "clamp(44px, 7vw, 88px)", lineHeight: .92, letterSpacing: "-.06em", fontWeight: 450 }}>Test your own MP4.</h1>
              <p style={{ maxWidth: 620, color: "rgba(195,219,227,.52)", lineHeight: 1.8, fontSize: 14 }}>
                Upload a short 640 × 480 MP4 and run the same detector → Kalman tracker → velocity-aware controller pipeline used by ATLAS.
              </p>
            </div>
            <div style={{ border: "1px solid rgba(125,232,255,.16)", padding: "16px 18px", minWidth: 220, background: "rgba(125,232,255,.025)" }}>
              <span style={{ display: "block", color: "rgba(125,232,255,.5)", font: "8px var(--font-mono)", letterSpacing: ".18em" }}>SAFE UPLOAD LIMITS</span>
              <strong style={{ display: "block", marginTop: 9, font: "14px var(--font-mono)", color: "#a9efff" }}>MP4 · ≤ 30 S · ≤ 100 MB</strong>
              <small style={{ display: "block", marginTop: 6, color: "rgba(195,219,227,.4)" }}>Expected frame size: 640 × 480</small>
            </div>
          </div>

          <section style={{ marginTop: 55, display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(300px, .85fr)", gap: 20 }}>
            <div style={{ border: "1px solid rgba(125,232,255,.13)", background: "rgba(8,15,18,.72)", minHeight: 390, position: "relative", overflow: "hidden" }}>
              {previewUrl ? (
                <>
                  <video src={previewUrl} controls muted style={{ width: "100%", display: "block", aspectRatio: "4 / 3", objectFit: "contain", background: "#010203" }} />
                  <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", gap: 15, alignItems: "center", borderTop: "1px solid rgba(125,232,255,.1)" }}>
                    <div>
                      <strong style={{ display: "block", fontSize: 13 }}>{file?.name}</strong>
                      <small style={{ color: "rgba(195,219,227,.42)", fontFamily: "var(--font-mono)" }}>
                        {videoInfo ? videoInfo.width + " × " + videoInfo.height + " · " + fmt(videoInfo.duration, 2) + " S" : "Reading video metadata..."}
                      </small>
                    </div>
                    <button type="button" onClick={clearFile} aria-label="Remove selected video" style={{ border: 0, background: "transparent", color: "rgba(220,240,245,.5)", cursor: "pointer" }}><X size={17} /></button>
                  </div>
                </>
              ) : (
                <button type="button" onClick={() => inputRef.current?.click()} style={{ width: "100%", minHeight: 390, border: 0, background: "transparent", color: "inherit", cursor: "pointer", display: "grid", placeItems: "center", padding: 30 }}>
                  <span style={{ display: "grid", placeItems: "center", gap: 15 }}>
                    <span style={{ width: 62, height: 62, border: "1px solid rgba(125,232,255,.25)", display: "grid", placeItems: "center", color: "#7de8ff" }}><Upload size={25} /></span>
                    <strong style={{ font: "12px var(--font-mono)", letterSpacing: ".13em" }}>SELECT MP4 VIDEO</strong>
                    <small style={{ color: "rgba(195,219,227,.38)" }}>30 seconds maximum · 640 × 480</small>
                  </span>
                </button>
              )}
              <input ref={inputRef} type="file" accept="video/mp4,.mp4" hidden onChange={e => selectFile(e.target.files?.[0] ?? null)} />
            </div>

            <aside style={{ border: "1px solid rgba(125,232,255,.13)", background: "rgba(8,15,18,.72)", padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span style={{ color: "rgba(125,232,255,.5)", font: "8px var(--font-mono)", letterSpacing: ".18em" }}>TEST PIPELINE</span>
                <div style={{ marginTop: 28, display: "grid", gap: 18 }}>
                  {["VIDEO FRAME INPUT", "CNN TARGET DETECTOR", "KALMAN TRACKER", "VELOCITY-AWARE CONTROL", "PERFORMANCE LOG"].map((step, i) => (
                    <div key={step} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ color: "#7de8ff", font: "9px var(--font-mono)" }}>0{i + 1}</span>
                      <span style={{ color: "rgba(220,238,242,.68)", fontSize: 11 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => void runTest()} disabled={!file || busy || !videoInfo} style={{ marginTop: 30, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, padding: "15px 18px", border: "1px solid rgba(125,232,255,.45)", background: file ? "rgba(125,232,255,.09)" : "rgba(255,255,255,.025)", color: file ? "#a9efff" : "rgba(220,238,242,.25)", font: "10px var(--font-mono)", letterSpacing: ".12em", cursor: !file || busy ? "not-allowed" : "pointer" }}>
                <Play size={15} fill="currentColor" /> {busy ? "PROCESSING VIDEO..." : "RUN VIDEO TEST"}
              </button>
            </aside>
          </section>

          {error && (
            <div style={{ marginTop: 20, border: "1px solid rgba(255,110,110,.35)", background: "rgba(100,20,20,.14)", padding: "15px 18px", display: "flex", gap: 12, alignItems: "center" }}>
              <AlertTriangle size={17} />
              <span style={{ color: "rgba(245,220,220,.78)", fontSize: 12 }}>{error}</span>
            </div>
          )}

          {r && (
            <section style={{ marginTop: 40 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 18 }}>
                <div>
                  <span style={{ color: "rgba(125,232,255,.5)", font: "8px var(--font-mono)", letterSpacing: ".18em" }}>VIDEO TEST COMPLETE</span>
                  <h2 style={{ margin: "10px 0 0", fontSize: 32, fontWeight: 450 }}>Tracking performance</h2>
                </div>
                <span style={{ color: "rgba(125,232,255,.65)", font: "9px var(--font-mono)" }}>{r.video.frames} FRAMES · {fmt(r.video.fps, 0)} FPS</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "rgba(125,232,255,.1)", border: "1px solid rgba(125,232,255,.1)" }}>
                {[
                  ["PROCESSING FPS", fmt(r.benchmark.measured_processing_fps), Gauge],
                  ["DETECTION RATE", fmt(r.tracking.detection_rate_percent) + "%", Target],
                  ["LOCK RETENTION", fmt(r.tracking.lock_retention_percent) + "%", LockKeyhole],
                  ["ACQUISITION", fmt(r.tracking.acquisition_time_seconds, 3) + " S", CheckCircle2],
                ].map(([label, value, Icon]) => {
                  const I = Icon as typeof Gauge;
                  return <div key={label as string} style={{ padding: 22, background: "#050a0c" }}><I size={16} color="#7de8ff" /><span style={{ display: "block", marginTop: 17, color: "rgba(190,216,224,.4)", font: "7px var(--font-mono)", letterSpacing: ".16em" }}>{label as string}</span><strong style={{ display: "block", marginTop: 7, font: "24px var(--font-mono)", color: "#a9efff" }}>{value as string}</strong></div>;
                })}
              </div>
              <div style={{ marginTop: 16, border: "1px solid rgba(125,232,255,.1)", padding: "17px 20px", color: "rgba(195,219,227,.48)", fontSize: 12, lineHeight: 1.7 }}>
                {r.accuracy.ground_truth_available
                  ? "Ground truth was supplied, so centroid error and RMSE were calculated. Average error: " + fmt(r.accuracy.average_centroid_error_pixels, 3) + " px."
                  : "This upload did not include ground truth. ATLAS reports acquisition, detection, lock retention and processing metrics, but does not invent a centroid-error score."}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
