import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, BarChart3, CheckCircle2, Clock3, Download, Gauge, LockKeyhole, Play, Target, Zap } from "lucide-react";
import { Footer, Header } from "@/components/AtlasUI";
import { api, DEFAULT_API_BASE_URL } from "@/services/api";
import type { BenchmarkResponse, VideoBenchmarkResponse } from "@/types/tracking";

export const Route = createFileRoute("/benchmark-live")({
  head: () => ({ meta: [
    { title: "Performance — ATLAS Live Benchmark" },
    { name: "description", content: "Live ATLAS benchmark validation results." },
  ] }),
  component: BenchmarkLive,
});

const f=(v:number|null|undefined,d=2)=>v==null?"—":v.toFixed(d);

function downloadFile(filename:string, content:string, type:string){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;
  anchor.download=filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportBenchmarkJson(result: BenchmarkResponse["result"]){
  downloadFile("atlas-benchmark-report.json",JSON.stringify(result,null,2),"application/json");
}

function exportBenchmarkCsv(result: BenchmarkResponse["result"]){
  const rows=[
    ["metric","value","unit"],
    ["processing_fps",result.benchmark.measured_processing_fps,"FPS"],
    ["detection_rate",result.tracking.detection_rate_percent,"%"],
    ["lock_retention",result.tracking.lock_retention_percent,"%"],
    ["target_loss",result.tracking.target_loss_percent,"%"],
    ["acquisition_time",result.tracking.acquisition_time_seconds??"","s"],
    ["average_centroid_error",result.accuracy.average_centroid_error_pixels??"","px"],
    ["maximum_centroid_error",result.accuracy.maximum_centroid_error_pixels??"","px"],
    ["rmse",result.accuracy.rmse_pixels??"","px"],
    ["frames",result.video.frames,"frames"],
    ["duration",result.video.duration_seconds,"s"],
  ];
  downloadFile("atlas-benchmark-report.csv",rows.map(row=>row.join(",")).join("\\n"),"text/csv");
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
  const [telemetry,setTelemetry]=useState<{x:number|null;y:number|null;error:number|null;tracking:boolean;detected:boolean;pan:number|null;tilt:number|null}>({x:null,y:null,error:null,tracking:false,detected:false,pan:null,tilt:null});
  const [errorHistory,setErrorHistory]=useState<number[]>([]);
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{ api.getBenchmark().then(setData).catch(e=>setError(e instanceof Error?e.message:"Unable to load benchmark.")).finally(()=>setLoading(false)); },[]);
  useEffect(()=>{
    let active=true;
    const poll=async()=>{
      try{
        const t=await api.getTracking();
        if(!active)return;
        const x=t.target?.x??null;
        const y=t.target?.y??null;
        const errorPx=x!=null&&y!=null?Math.hypot(x-320,y-240):null;
        setTelemetry({x,y,error:errorPx,tracking:t.status.tracking,detected:t.status.detected,pan:t.camera?.pan_speed??null,tilt:t.camera?.tilt_speed??null});
        if(errorPx!=null)setErrorHistory(h=>[...h,errorPx].slice(-60));
      }catch{
        // Keep the last telemetry frame visible when the backend is waking up.
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
    {testOpen&&<section style={{margin:"24px 0",padding:"20px",border:"1px solid var(--border)",background:"var(--card)"}}><div className="section-caption"><span>TEST MP4</span><span>640×480 · ~30 FPS · MAX 30 S / 100 MB</span></div><input ref={fileRef} type="file" accept=".mp4,video/mp4" style={{display:"none"}} onChange={e=>{const file=e.target.files?.[0];if(file)void runVideoTest(file);e.currentTarget.value="";}}/><div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><button type="button" onClick={()=>fileRef.current?.click()} disabled={testBusy} style={{padding:"11px 15px",border:"1px solid var(--primary)",background:"var(--accent)",color:"var(--primary)",font:"11px var(--font-mono)",cursor:testBusy?"wait":"pointer"}}>{testBusy?"PROCESSING...":"SELECT MP4"}</button><span style={{color:"var(--muted-foreground)",fontSize:12}}>Upload a recorded beacon-tracking video. The existing benchmark remains unchanged.</span></div>{testError&&<div style={{marginTop:14,color:"var(--destructive)",fontSize:12}}>{testError}</div>}{testData&&(()=>{const v=testData.result;const locked=v.tracking.lock_retention_percent>=95&&v.tracking.target_loss_percent<5;return <div style={{marginTop:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:9,fontFamily:"var(--font-mono)",fontSize:11}}>
          <span className="status-dot status-dot-live"/><strong>{locked?"TRACKING LOCKED":"TRACKING ATTENTION REQUIRED"}</strong>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button type="button" onClick={()=>exportBenchmarkJson(v)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 12px",border:"1px solid var(--border)",background:"transparent",color:"var(--foreground)",font:"10px var(--font-mono)",cursor:"pointer"}}><Download size={13}/> JSON REPORT</button>
          <button type="button" onClick={()=>exportBenchmarkCsv(v)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 12px",border:"1px solid var(--border)",background:"transparent",color:"var(--foreground)",font:"10px var(--font-mono)",cursor:"pointer"}><Download size={13}/> CSV REPORT</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>{[["Processing FPS",f(v.benchmark.measured_processing_fps)],["Detection rate",f(v.tracking.detection_rate_percent)+"%"],["Lock retention",f(v.tracking.lock_retention_percent)+"%"],["Acquisition",f(v.tracking.acquisition_time_seconds,3)+" s"],["Target loss",f(v.tracking.target_loss_percent)+"%"],["Frames",String(v.video.frames)]].map(([label,value])=><div key={label} className="benchmark-card"><div className="benchmark-card-top"><span>{label}</span></div><div className="benchmark-value">{value}</div></div>)}</div>
      <div style={{marginTop:18,padding:"16px",border:"1px solid var(--border)",background:"var(--background)"}}>
        <div className="section-caption"><span>ACCURACY PROFILE</span><span>{v.accuracy.ground_truth_available?"GROUND TRUTH":"NO GROUND TRUTH"}</span></div>
        {v.accuracy.ground_truth_available&&v.accuracy.average_centroid_error_pixels!=null&&v.accuracy.rmse_pixels!=null&&v.accuracy.maximum_centroid_error_pixels!=null?<div style={{display:"grid",gap:11,marginTop:14}}>
          {[["Average",v.accuracy.average_centroid_error_pixels],["RMSE",v.accuracy.rmse_pixels],["Maximum",v.accuracy.maximum_centroid_error_pixels]].map(([label,value])=>{const n=value as number;const max=Math.max(10,v.accuracy.maximum_centroid_error_pixels||10);return <div key={label as string} style={{display:"grid",gridTemplateColumns:"72px 1fr 58px",alignItems:"center",gap:10,fontSize:11}}><span>{label as string}</span><div style={{position:"relative",height:7,background:"var(--border)"}}><div style={{height:"100%",width:`${Math.min(100,n/max*100)}%`,background:"var(--accent)"}}/><span title="10 px requirement" style={{position:"absolute",left:`${10/max*100}%`,top:-4,height:15,width:1,background:"var(--foreground)"}}/></div><b style={{fontFamily:"var(--font-mono)",textAlign:"right"}}>{n.toFixed(2)} px</b></div>})}
          <div style={{fontSize:10,color:"var(--muted-foreground)",marginTop:2}}>Marker = 10 px average-error requirement. Maximum error is reported separately.</div>
        </div>:<div style={{fontSize:11,color:"var(--muted-foreground)",marginTop:12}}>Centroid error and RMSE require a matching ground-truth CSV. The uploaded-video benchmark currently evaluates detection, lock retention, acquisition, loss and processing speed without inventing accuracy values.</div>}
      </div>
    </div>})()}</section>}
    {error&&<div style={{margin:"24px 0",padding:"15px 18px",border:"1px solid var(--destructive)",background:"var(--card)",color:"var(--foreground)",display:"flex",flexDirection:"column",gap:5}}><strong>Benchmark unavailable</strong><span style={{color:"var(--muted-foreground)",fontSize:12}}>{error}</span><small style={{fontFamily:"var(--font-mono)",color:"var(--muted-foreground)"}}>Backend: {DEFAULT_API_BASE_URL}</small></div>}
    {loading&&<div className="benchmark-loading" style={{padding:"30px 0",color:"var(--muted-foreground)",fontFamily:"var(--font-mono)",fontSize:11}}>LOADING LAST BENCHMARK...</div>}
    <section style={{marginTop:24}}>
      <div className="section-caption"><span>LIVE TRACKING TELEMETRY</span><span>500 MS SAMPLE</span></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10}}>
        {[
          ["STATUS",telemetry.tracking?"LOCKED":telemetry.detected?"ACQUIRING":"SEARCHING"],
          ["CENTROID X",telemetry.x==null?"—":f(telemetry.x,1)+" px"],
          ["CENTROID Y",telemetry.y==null?"—":f(telemetry.y,1)+" px"],
          ["CURRENT ERROR",telemetry.error==null?"—":f(telemetry.error,2)+" px"],
          ["PAN COMMAND",telemetry.pan==null?"—":f(telemetry.pan,2)],
          ["TILT COMMAND",telemetry.tilt==null?"—":f(telemetry.tilt,2)],
        ].map(([label,value])=><div className="benchmark-card" key={label}><div className="benchmark-card-top"><span>{label}</span></div><div className="benchmark-value" style={{fontSize:20}}>{value}</div></div>)}
      </div>
      <div style={{marginTop:12,padding:"14px 16px",border:"1px solid var(--border)",background:"var(--card)"}}>
        <div className="section-caption"><span>CURRENT ERROR TRACE</span><span>CAMERA CENTER = 320 / 240</span></div>
        {errorHistory.length>1?<svg viewBox="0 0 600 150" width="100%" height="150" role="img" aria-label="Live centroid error over recent samples" preserveAspectRatio="none" style={{display:"block",marginTop:12}}>
          <line x1="0" y1={150-(10/Math.max(10,...errorHistory))*150} x2="600" y2={150-(10/Math.max(10,...errorHistory))*150} stroke="currentColor" strokeOpacity="0.45" strokeDasharray="5 5"/>
          <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={errorHistory.map((v,i)=>{const max=Math.max(10,...errorHistory);return `${i/(errorHistory.length-1)*600},${150-v/max*150}`;}).join(" ")}/>
        </svg>:<div style={{height:150,display:"grid",placeItems:"center",color:"var(--muted-foreground)",fontSize:11}}>WAITING FOR TRACKING SAMPLES...</div>}
        <div style={{fontSize:10,color:"var(--muted-foreground)"}}>The trace is live telemetry from the tracking endpoint; it is not substituted for benchmark ground-truth accuracy.</div>
      </div>
    </section>
    {r&&<><section className="benchmark-summary"><div className="benchmark-summary-copy"><span className="benchmark-kicker">PRIMARY RESULT</span><strong>{f(r.accuracy.average_centroid_error_pixels,3)} <em>px</em></strong><p>Average centroiding error. Last run: {new Date(data!.generated_at*1000).toLocaleString()}.</p></div><div className="benchmark-summary-side"><span>INPUT</span><b>{f(r.video.fps,0)} FPS MP4</b><span>PROCESSING</span><b>{f(r.benchmark.measured_processing_fps)} FPS</b></div></section>
    <section><div className="section-caption"><span>MEASURED PERFORMANCE</span><span>LAST COMPLETED RUN</span></div><div className="benchmark-grid">{cards.map(([label,value,unit,Icon,note])=>{const I=Icon as typeof Gauge;return <article className="benchmark-card" key={label as string}><div className="benchmark-card-top"><I size={17}/><span>{label as string}</span></div><div className="benchmark-value">{value as string}<small>{unit as string}</small></div><p>{note as string}</p></article>})}</div></section>
    <section style={{marginTop:18}}><div className="section-caption"><span>REPORTING</span><span>EXPORT VERIFIED RESULT</span></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap",padding:"16px 0"}}><div style={{display:"flex",alignItems:"center",gap:10}}><BarChart3 size={18}/><span style={{fontSize:12,color:"var(--muted-foreground)"}}>Download the measured benchmark as machine-readable evidence for your technical report.</span></div><div style={{display:"flex",gap:8}}><button type="button" onClick={()=>exportBenchmarkJson(r)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 12px",border:"1px solid var(--border)",background:"transparent",color:"var(--foreground)",font:"10px var(--font-mono)",cursor:"pointer"}}><Download size={13}/> JSON</button><button type="button" onClick={()=>exportBenchmarkCsv(r)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 12px",border:"1px solid var(--border)",background:"transparent",color:"var(--foreground)",font:"10px var(--font-mono)",cursor:"pointer"}}><Download size={13}/> CSV</button></div></div></section>
    <section className="benchmark-analysis"><div><div className="section-caption"><span>VALIDATION STATUS</span><span>REQUIREMENT CHECK</span></div><div className="validation-list">
      <div><CheckCircle2 size={16}/><span>Average tracking error ≤ 10 px</span><strong>{r.accuracy.average_centroid_error_pixels!=null&&r.accuracy.average_centroid_error_pixels<=10?"PASS":"FAIL"} · {f(r.accuracy.average_centroid_error_pixels,3)} px</strong></div>
      <div><CheckCircle2 size={16}/><span>Processing rate ≥ 20 FPS</span><strong>{r.benchmark.measured_processing_fps>=20?"PASS":"FAIL"} · {f(r.benchmark.measured_processing_fps)} FPS</strong></div>
      <div><CheckCircle2 size={16}/><span>Acquisition ≤ 2 s</span><strong>{r.tracking.acquisition_time_seconds!=null&&r.tracking.acquisition_time_seconds<=2?"PASS":"FAIL"} · {f(r.tracking.acquisition_time_seconds,3)} s</strong></div>
      <div><CheckCircle2 size={16}/><span>Target loss &lt; 5%</span><strong>{r.tracking.target_loss_percent<5?"PASS":"FAIL"} · {f(r.tracking.target_loss_percent)}%</strong></div>
    </div></div><aside className="benchmark-note"><span>IMPORTANT</span><p>The 10 px check uses the measured <b>average</b> centroid error. Maximum error is shown separately.</p></aside></section></>}
    {!r&&!loading&&!error&&<div style={{padding:"60px 0",display:"grid",placeItems:"center",gap:8,color:"var(--muted-foreground)"}}><Target size={24}/><strong>No benchmark results yet.</strong><span>Run the benchmark to generate the first report.</span></div>}
  </main><Footer/></div>;
}
