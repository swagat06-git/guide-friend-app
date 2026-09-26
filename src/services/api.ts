import type { TrackingResponse } from "@/types/tracking";

export const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
export const DEFAULT_POLL_INTERVAL = 100;

async function request<T>(path: string, baseUrl: string): Promise<T> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`ATLAS core returned ${response.status}`);
  return response.json() as Promise<T>;
}

export const api = {
  health: (baseUrl = DEFAULT_API_BASE_URL) => request<{ status: string }>("/health", baseUrl),
  getTracking: (baseUrl = DEFAULT_API_BASE_URL) => request<TrackingResponse>("/tracking", baseUrl),
};