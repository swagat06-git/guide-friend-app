import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, CheckCircle2, Clock3, Download, Gauge, LockKeyhole, Play, Target, Zap } from "lucide-react";
import { Footer, Header } from "@/components/AtlasUI";
import { BenchmarkTelemetryStatus } from "@/components/benchmark/BenchmarkTelemetryStatus";
import { api, DEFAULT_API_BASE_URL } from "@/services/api";
import type { BenchmarkResponse, TrackingResponse, VideoBenchmarkResponse } from "@/types/tracking";

export const Route = createFileRoute("/benchmark-live")({
  head: () => ({ meta: [
    { title: "Performance — ATLAS Live Benchmark" },
    { name: "description", content: "Live ATLAS benchmark validation results." },
  ] }),
  component: BenchmarkLive,
});

const f=(v:number|null|undefined,d=2)=>v==null?"—":v.toFixed(d);

const VERIFIED_SNAPSHOT: BenchmarkResponse = {
  status: "completed",
  generated_at: 0,
  result: {
    video: {
      path: "videos/atlas_synthetic_30s.mp4",
      ground_truth_path: "videos/atlas_synthetic_30s_ground_truth.csv",
      width: 640,
      height: 480,
      fps: 30,
      frames: 900,
      duration_seconds: 30,
    },
    benchmark: {
      benchmark_runtime_seconds: 0.8494581669801846,
      measured_processing_fps: 1318.7661670623702,
      average_processing_ms: 0.7582845427613292,
      max_processing_ms: 96.5091249672696,
    },
    tracking: {
      detected_frames: 874,
      tracking_frames: 900,
      detection_rate_percent: 97.11111111111111,
      lock_retention_percent: 100,
      target_loss_percent: 0,
      first_detection_frame: 1,
      acquisition_time_seconds: 0.03333333333333333,
    },
    accuracy: {
      frames_with_error: 900,
      average_centroid_error_pixels: 4.33320946260667,
      maximum_centroid_error_pixels: 47.3836643395427,
      rmse_pixels: 5.50894621741145,
    },
  },
};

function downloadBenchmark(filename:string, content:string, type:string){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=filename;
  a.click();
  URL.revokeObjectURL(url);
}

function BenchmarkLive(){
  const [data,setData]=useState<BenchmarkResponse|null>(null);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [testOpen,setTestOpen]=useState(false);
  const [testBusy,setTestBusy]=useState(false);
  const [testData,setTestData]=useState<VideoBenchmarkResponse|null>(null);
  const [testError,setTestError]=useState("");
  const [telemetry,setTelemetry]=useState<TrackingResponse|null>(null);
  const [telemetrySamples,setTelemetrySamples]=useState<number[]>([]);
  const [systemOnline,setSystemOnline]=useState<boolean|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    api.getBenchmark()
      .then(setData)
      .catch(e=>{
        setData(VERIFIED_SNAPSHOT);
        setError("Live benchmark API unavailable. Showing the last verified benchmark snapshot.");
      })
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    let active=true;
    const check=async()=>{
      try{
        const response=await fetch(`${DEFAULT_API_BASE_URL}/health`);
        if(active)setSystemOnline(response.ok);
      }catch{
        if(active)setSystemOnline(false);
      }
    };
    void check();
    const timer=window.setInterval(()=>void check(),10000);
    return()=>{active=false;window.clearInterval(timer);};
  },[]);

  useEffect(()=>{
    let active=true;
    const poll=async()=>{
      try{
        const next=await api.getTracking();
        if(!active)return;
        setTelemetry(next);
        const x=next.target?.x;
        const y=next.target?.y;
        if(x==null||y==null)return;
        const offset=Math.hypot(x-320,y-240);
        setTelemetrySamples(prev=>[...prev.slice(-39),offset]);
      }catch{
        if(active)setTelemetry(null);
      }
    };
    void poll();
    const timer=window.setInterval(()=>void poll(),500);
    return()=>{active=false;window.clearInterval(timer);};
  },[]);

  async function run(){
    if(busy)return;
    setBusy(true);setError("");
    try{setData(await api.runBenchmark());}
    catch(e){setError(e instanceof Error?e.message:"Benchmark failed.");}
    finally{setBusy(false);}
  }

  async function runVideoTest(file: File){
    if(testBusy)return;
    setTestBusy(true);setTestError("");setTestData(null);
    try{
      if(!file.name.toLowerCase().endsWith(".mp4")) throw new Error("Only MP4 video uploads are supported.");
      if(file.size>100*1024*1024) throw new Error("Video file is too large. Maximum upload size is 100 MB.");
      setTestData(await api.runVideoBenchmark(file));
    }catch(e){setTestError(e instanceof Error?e.message:"MP4 benchmark failed.");}
    finally{setTestBusy(false);}
  }

  const r=data?.result;
  const cards=r?[
    ["Processing FPS",f(r.benchmark.measured_processing_fps),"FPS",Gauge,`${f(r.video.fps,0)} FPS video input`],
    ["Average centroid error",f(r.accuracy.average_centroid_error_pixels,3),"px",Target,`${r.accuracy.frames_with_error} frames measured`],
    ["RMSE",f(r.accuracy.rmse_pixels,3),"px",Activity,"Frame-level tracking error"],
    ["Lock retention",f(r.tracking.lock_retention_percent),"%",LockKeyhole,"Continuous tracking lock"],
    ["Detection rate",f(r.tracking.detection_rate_percent),"%",Zap,"Detector measurements accepted"],
    ["Target loss",f(r.tracking.target_loss_percent),"%",CheckCircle2,"Declared tracking loss"],
    ["Acquisition",f(r.tracking.acquisition_time_seconds,3),"s",Clock3,"Initial target acquisition"],
    ["Maximum error",f(r.accuracy.maximum_centroid_error_pixels,3),"px",Target,"Largest observed frame error"],
  ]:[];
  return <div className="atlas-site dashboard-site"><Header active="benchmark"/><main className="benchmark-content">
    <div className="benchmark-hero"><div><p className="eyebrow">ATLAS / PERFORMANCE VALIDATION</p><h1>Benchmark Results</h1><p>Run the benchmark against the actual tracking backend and refresh these measurements.</p></div>
      <div style={{display:"flex",alignItems:"stretch",gap:12,flexDirection:"column"}}><div className="benchmark-badge"><span className="status-dot status-dot-live"/><span>{busy?"BENCHMARK RUNNING":"BENCHMARK READY"}</span><small>{r?`${r.video.frames} FRAMES · ${f(r.video.fps,0)} FPS · ${f(r.video.duration_seconds,1)} S`:"READY FOR TEST RUN"}</small></div>
      <div style={{display:"flex",gap:8}}><button type="button" onClick={()=>setTestOpen(v=>!v)} disabled={busy||loading} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 16px",border:"1px solid var(--border)",background:"transparent",color:"var(--foreground)",font:"11px var(--font-mono)",cursor:"pointer"}}>TEST MP4</button><button type="button" onClick={()=>void run()} disabled={busy||loading} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 16px",border:"1px solid var(--primary)",background:"var(--accent)",color:"var(--primary)",font:"11px var(--font-mono)",cursor:busy||loading?"wait":"pointer",opacity:(busy||loading)?0.55:1}}><Play size={15} fill="currentColor"/>{busy?"RUNNING...":"RUN BENCHMARK"}</button></div></div>
    </div>
    {testOpen&&<section style={{margin:"24px 0",padding:"20px",border:"1px solid var(--border)",background:"var(--card)"}}><div className="section-caption"><span>TEST MP4</span><span>640×480 · ~30 FPS · MAX 30 S / 100 MB</span></div><input ref={fileRef} type="file" accept=".mp4,video/mp4" style={{display:"none"}} onChange={e=>{const file=e.target.files?.[0];if(file)void runVideoTest(file);e.currentTarget.value="";}}/><div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><button type="button" onClick={()=>fileRef.current?.click()} disabled={testBusy} style={{padding:"11px 15px",border:"1px solid var(--primary)",background:"var(--accent)",color:"var(--primary)",font:"11px var(--font-mono)",cursor:testBusy?"wait":"pointer"}}>{testBusy?"PROCESSING...":"SELECT MP4"}</button><span style={{color:"var(--muted-foreground)",fontSize:12}}>Upload a recorded beacon-tracking video. The existing benchmark remains unchanged.</span></div>{testError&&<div style={{marginTop:14,color:"var(--destructive)",fontSize:12}}>{testError}</div>}{testData&&(()=>{const v=testData.result;return <div style={{marginTop:20,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>{[["Processing FPS",f(v.benchmark.measured_processing_fps)],["Detection rate",f(v.tracking.detection_rate_percent)+"%"],["Lock retention",f(v.tracking.lock_retention_percent)+"%"],["Acquisition",f(v.tracking.acquisition_time_seconds,3)+" s"],["Target loss",f(v.tracking.target_loss_percent)+"%"]].map(([label,value])=><div key={label} className="benchmark-card"><div className="benchmark-card-top"><span>{label}</span></div><div className="benchmark-value">{value}</div></div>)}<div style={{gridColumn:"1 / -1",fontSize:11,color:"var(--muted-foreground)"}}>{v.accuracy.ground_truth_available?"Centroid accuracy calculated from supplied ground truth.":"Centroid error / RMSE are not shown because the uploaded MP4 has no matching ground-truth file."}</div><div style={{gridColumn:"1 / -1",display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}><button type="button" onClick={()=>downloadBenchmark("atlas-video-benchmark.json",JSON.stringify(v,null,2),"application/json")} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 12px",border:"1px solid var(--border)",background:"transparent",color:"var(--foreground)",font:"10px var(--font-mono)",cursor:"pointer"}}><Download size={13}/> EXPORT JSON</button><button type="button" onClick={()=>downloadBenchmark("atlas-video-benchmark.csv",`metric,value\nprocessing_fps,${v.benchmark.measured_processing_fps}\ndetection_rate_percent,${v.tracking.detection_rate_percent}\nlock_retention_percent,${v.tracking.lock_retention_percent}\nacquisition_time_seconds,${v.tracking.acquisition_time_seconds??""}\ntarget_loss_percent,${v.tracking.target_loss_percent}`,"text/csv")} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 12px",border:"1px solid var(--border)",background:"transparent",color:"var(--foreground)",font:"10px var(--font-mono)",cursor:"pointer"}}><Download size={13}/> EXPORT CSV</button></div></div>})()}</section>}
    <section style={{margin:"24px 0",display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10}}>
      {[
        ["BACKEND API",systemOnline===null?"CHECKING":systemOnline?"ONLINE":"OFFLINE"],
        ["TRACKING STREAM",telemetry?"LIVE":"WAITING"],
        ["BENCHMARK DATA",r?"READY":"NOT LOADED"],
      ].map(([label,value])=><div key={label} style={{padding:"12px 14px",border:"1px solid var(--border)",background:"var(--card)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
        <span style={{font:"10px var(--font-mono)",color:"var(--muted-foreground)"}}>{label}</span>
        <strong style={{font:"10px var(--font-mono)"}}>{value}</strong>
      </div>)}
    </section>
    {error&&<div style={{margin:"24px 0",padding:"15px 18px",border:"1px solid var(--destructive)",background:"var(--card)",color:"var(--foreground)",display:"flex",flexDirection:"column",gap:5}}><strong>Benchmark unavailable</strong><span style={{color:"var(--muted-foreground)",fontSize:12}}>{error}</span><small style={{fontFamily:"var(--font-mono)",color:"var(--muted-foreground)"}}>Backend: {DEFAULT_API_BASE_URL}</small></div>}
    {loading&&<div className="benchmark-loading" style={{padding:"30px 0",color:"var(--muted-foreground)",fontFamily:"var(--font-mono)",fontSize:11}}>LOADING LAST BENCHMARK...</div>}
    <section style={{margin:"24px 0",display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(260px,360px)",gap:12}}>
      <div style={{padding:"18px",border:"1px solid var(--border)",background:"var(--card)"}}>
        <div className="section-caption"><span>LIVE TRACKING TELEMETRY</span><span>2 HZ SAMPLE</span></div>
        <BenchmarkTelemetryStatus locked={Boolean(telemetry?.status.tracking)} fps={r?.benchmark.measured_processing_fps}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10,marginTop:10}}>
          <div className="benchmark-card"><div className="benchmark-card-top"><span>TARGET X</span></div><div className="benchmark-value">{f(telemetry?.target?.x,1)}<small>PX</small></div></div>
          <div className="benchmark-card"><div className="benchmark-card-top"><span>TARGET Y</span></div><div className="benchmark-value">{f(telemetry?.target?.y,1)}<small>PX</small></div></div>
          <div className="benchmark-card"><div className="benchmark-card-top"><span>CENTER OFFSET</span></div><div className="benchmark-value">{telemetry?.target?.x!=null&&telemetry?.target?.y!=null?f(Math.hypot(telemetry.target.x-320,telemetry.target.y-240),1):"—"}<small>PX</small></div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10,marginTop:10}}>
          <div className="benchmark-card"><div className="benchmark-card-top"><span>CONFIDENCE</span></div><div className="benchmark-value">{f(telemetry?.metadata?.confidence,3)}</div></div>
          <div className="benchmark-card"><div className="benchmark-card-top"><span>VELOCITY X</span></div><div className="benchmark-value">{f(telemetry?.velocity?.x,1)}<small>PX/S</small></div></div>
          <div className="benchmark-card"><div className="benchmark-card-top"><span>PAN COMMAND</span></div><div className="benchmark-value">{f(telemetry?.camera?.pan_speed,2)}<small>°/S</small></div></div>
          <div className="benchmark-card"><div className="benchmark-card-top"><span>TILT COMMAND</span></div><div className="benchmark-value">{f(telemetry?.camera?.tilt_speed,2)}<small>°/S</small></div></div>
        </div>
      </div>
      <div style={{padding:"18px",border:"1px solid var(--border)",background:"var(--card)"}}>
        <div className="section-caption"><span>OFFSET TRACE</span><span>LAST 40 SAMPLES</span></div>
        {telemetrySamples.length<2?<div style={{height:92,display:"grid",placeItems:"center",color:"var(--muted-foreground)",fontSize:11}}>WAITING FOR TELEMETRY...</div>:
          <svg viewBox="0 0 400 100" width="100%" height="100" preserveAspectRatio="none" aria-label="Recent camera-center offset trace">
            <polyline fill="none" stroke="currentColor" strokeWidth="2" points={telemetrySamples.map((v,i)=>`${(i/(telemetrySamples.length-1))*400},${100-Math.min(v,100)}`).join(" ")}/>
          </svg>}
        <p style={{margin:"8px 0 0",fontSize:10,color:"var(--muted-foreground)"}}>Live alignment offset from the 640×480 frame center. This is a control telemetry trace, not the benchmark centroid RMSE.</p>
      </div>
    </section>
    {r&&<section style={{margin:"24px 0",padding:"18px",border:"1px solid var(--border)",background:"var(--card)"}}>
      <div className="section-caption"><span>BENCHMARK SCENARIO</span><span>VERIFIED INPUT PROFILE</span></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10}}>
        {[
          ["FRAME SIZE",`${r.video.width} × ${r.video.height}`],
          ["INPUT RATE",`${f(r.video.fps,0)} FPS`],
          ["FRAME COUNT",String(r.video.frames)],
          ["DURATION",`${f(r.video.duration_seconds,1)} S`],
          ["DETECTIONS",String(r.tracking.detected_frames)],
          ["TRACKING FRAMES",String(r.tracking.tracking_frames)],
          ["ERROR SAMPLES",String(r.accuracy.frames_with_error)],
          ["FIRST DETECTION",`FRAME ${r.tracking.first_detection_frame ?? "—"}`],
        ].map(([label,value])=><div key={label} className="benchmark-card">
          <div className="benchmark-card-top"><span>{label}</span></div>
          <div className="benchmark-value" style={{fontSize:18}}>{value}</div>
        </div>)}
      </div>
      <p style={{margin:"12px 0 0",fontSize:10,color:"var(--muted-foreground)"}}>These are the actual inputs and counts associated with the verified benchmark result currently served by the backend.</p>
    </section>}
    {r&&<><section className="benchmark-summary"><div className="benchmark-summary-copy"><span className="benchmark-kicker">PRIMARY RESULT</span><strong>{f(r.accuracy.average_centroid_error_pixels,3)} <em>px</em></strong><p>Average centroiding error. Last run: {new Date(data!.generated_at*1000).toLocaleString()}.</p></div><div className="benchmark-summary-side"><span>INPUT</span><b>{f(r.video.fps,0)} FPS MP4</b><span>PROCESSING</span><b>{f(r.benchmark.measured_processing_fps)} FPS</b></div></section>
    <section style={{margin:"24px 0",padding:"18px",border:"1px solid var(--border)",background:"var(--card)"}}>
      <div className="section-caption"><span>ACCURACY PROFILE</span><span>PIXEL ERROR · VERIFIED RUN</span></div>
      {r&&<div style={{display:"grid",gap:14}}>
        {[
          ["AVERAGE ERROR",r.accuracy.average_centroid_error_pixels,10],
          ["RMSE",r.accuracy.rmse_pixels,10],
          ["MAXIMUM ERROR",r.accuracy.maximum_centroid_error_pixels,null],
        ].map(([label,value,limit])=>{
          const numeric=typeof value==="number"?value:null;
          const scale=Math.max(10,numeric??10);
          return <div key={label as string} style={{display:"grid",gridTemplateColumns:"130px minmax(0,1fr) 72px",gap:12,alignItems:"center"}}>
            <span style={{font:"10px var(--font-mono)"}}>{label as string}</span>
            <div style={{position:"relative",height:8,background:"var(--muted)",overflow:"hidden"}}>
              {limit!=null&&<span style={{position:"absolute",left:`${Math.min(100,(limit/scale)*100)}%`,top:-4,bottom:-4,width:1,background:"var(--foreground)",opacity:.7}}/>}
              <span style={{display:"block",height:"100%",width:`${Math.min(100,((numeric??0)/scale)*100)}%`,background:"var(--accent)"}}/>
            </div>
            <strong style={{font:"11px var(--font-mono)",textAlign:"right"}}>{f(numeric,3)} px</strong>
          </div>
        })}
        <div style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:10,color:"var(--muted-foreground)"}}>
          <span>REFERENCE: 10 PX AVERAGE-ERROR REQUIREMENT</span>
          <span>MAXIMUM ERROR IS REPORTED SEPARATELY</span>
        </div>
        <div style={{fontSize:11,color:"var(--muted-foreground)",lineHeight:1.5}}>This profile uses the verified benchmark measurements already served by the backend. It does not fabricate a frame-by-frame error series; the live trace above is the current control-offset telemetry.</div>
      </div>}
    </section>
    <section><div className="section-caption"><span>MEASURED PERFORMANCE</span><span>LAST COMPLETED RUN</span></div><div className="benchmark-grid">{cards.map(([label,value,unit,Icon,note])=>{const I=Icon as typeof Gauge;return <article className="benchmark-card" key={label as string}><div className="benchmark-card-top"><I size={17}/><span>{label as string}</span></div><div className="benchmark-value">{value as string}<small>{unit as string}</small></div><p>{note as string}</p></article>})}</div></section>
    <section className="benchmark-analysis"><div><div className="section-caption"><span>VALIDATION STATUS</span><span>REQUIREMENT CHECK</span></div><div className="validation-list">
      <div><CheckCircle2 size={16}/><span>Average tracking error ≤ 10 px</span><strong>{r.accuracy.average_centroid_error_pixels!=null&&r.accuracy.average_centroid_error_pixels<=10?"PASS":"FAIL"} · {f(r.accuracy.average_centroid_error_pixels,3)} px</strong></div>
      <div><CheckCircle2 size={16}/><span>Processing rate ≥ 20 FPS</span><strong>{r.benchmark.measured_processing_fps>=20?"PASS":"FAIL"} · {f(r.benchmark.measured_processing_fps)} FPS</strong></div>
      <div><CheckCircle2 size={16}/><span>Acquisition ≤ 2 s</span><strong>{r.tracking.acquisition_time_seconds!=null&&r.tracking.acquisition_time_seconds<=2?"PASS":"FAIL"} · {f(r.tracking.acquisition_time_seconds,3)} s</strong></div>
      <div><CheckCircle2 size={16}/><span>Target loss &lt; 5%</span><strong>{r.tracking.target_loss_percent<5?"PASS":"FAIL"} · {f(r.tracking.target_loss_percent)}%</strong></div>
    </div></div><aside className="benchmark-note"><span>IMPORTANT</span><p>The 10 px check uses the measured <b>average</b> centroid error. Maximum error is shown separately.</p></aside></section></>}
    {!r&&!loading&&!error&&<div style={{padding:"60px 0",display:"grid",placeItems:"center",gap:8,color:"var(--muted-foreground)"}}><Target size={24}/><strong>No benchmark results yet.</strong><span>Run the benchmark to generate the first report.</span></div>}
  </main><Footer/></div>;
}
