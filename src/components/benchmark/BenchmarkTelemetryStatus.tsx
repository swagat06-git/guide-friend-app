import { Activity } from "lucide-react";

type Props = {
  locked: boolean;
  fps?: number | null;
};

export function BenchmarkTelemetryStatus({ locked, fps }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 14px",
        border: "1px solid var(--border)",
        background: "var(--background)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Activity size={13} />
        <strong>{locked ? "TRACKING LOCKED" : "TRACKING ACTIVE"}</strong>
      </span>
      <span style={{ color: "var(--muted-foreground)" }}>
        {fps == null ? "FPS —" : `FPS ${fps.toFixed(2)}`}
      </span>
    </div>
  );
}
