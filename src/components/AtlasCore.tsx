import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, DEFAULT_API_BASE_URL, DEFAULT_POLL_INTERVAL } from "@/services/api";
import type { TrackingResponse } from "@/types/tracking";

type Connection = "connecting" | "connected" | "offline";
type AtlasContextValue = {
  connection: Connection;
  trackingError: boolean;
  tracking: TrackingResponse | null;
  history: TrackingResponse[];
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  pollInterval: number;
  setPollInterval: (ms: number) => void;
  monitoring: boolean;
  setMonitoring: (active: boolean) => void;
};

const AtlasContext = createContext<AtlasContextValue | null>(null);

export function AtlasProvider({ children }: { children: ReactNode }) {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [pollInterval, setPollInterval] = useState(DEFAULT_POLL_INTERVAL);
  const [monitoring, setMonitoring] = useState(false);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [trackingError, setTrackingError] = useState(false);
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);
  const [history, setHistory] = useState<TrackingResponse[]>([]);
  const trackingBusy = useRef(false);

  useEffect(() => {
    let active = true;
    setConnection("connecting");
    async function check() {
      try {
        const result = await api.health(apiBaseUrl);
        if (active) setConnection(result.status === "ok" ? "connected" : "offline");
      } catch {
        if (active) setConnection("offline");
      }
    }
    void check();
    const interval = window.setInterval(check, 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!monitoring) return;
    let active = true;
    async function poll() {
      if (trackingBusy.current) return;
      trackingBusy.current = true;
      try {
        const result = await api.getTracking(apiBaseUrl);
        if (active) {
          setTracking(result);
          setHistory(prev => [...prev.slice(-79), result]);
          setTrackingError(false);
          setConnection("connected");
        }
      } catch {
        if (active) setTrackingError(true);
      } finally {
        trackingBusy.current = false;
      }
    }
    void poll();
    const interval = window.setInterval(poll, Math.max(100, pollInterval));
    return () => { active = false; window.clearInterval(interval); };
  }, [monitoring, apiBaseUrl, pollInterval]);

  return <AtlasContext.Provider value={{ connection, trackingError, tracking, history, apiBaseUrl, setApiBaseUrl, pollInterval, setPollInterval, monitoring, setMonitoring }}>{children}</AtlasContext.Provider>;
}

export function useAtlas() {
  const value = useContext(AtlasContext);
  if (!value) throw new Error("AtlasProvider is missing");
  return value;
}

export function useMonitoring() {
  const { setMonitoring } = useAtlas();
  useEffect(() => {
    setMonitoring(true);
    return () => setMonitoring(false);
  }, [setMonitoring]);
}