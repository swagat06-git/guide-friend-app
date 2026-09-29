import { Activity } from "lucide-react";

type Props = {
  online: boolean;
  locked: boolean;
};

export function BenchmarkTelemetryStatus({ online, locked }: Props) {
  const label = !online
    ? "TRACKING STREAM OFFLINE"
    : locked
      ? "TRACKING LOCKED"
      : "TRACKING ACTIVE";

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
        <strong>{label}</strong>
      </span>
      <span style={{ color: "var(--muted-foreground)" }}>
        {online ? "SAMPLE 2 HZ" : "FPS —"}
      </span>
    </div>
  );
}
