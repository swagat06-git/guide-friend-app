import type { BenchmarkResponse, TrackingResponse, VideoBenchmarkResponse, ScenarioBenchmarkResponse } from "@/types/tracking";

export const DEFAULT_API_BASE_URL =
  import.meta.env['VITE_API_BASE_URL'] || "https://atlas-2ejd.onrender.com";

export const DEFAULT_POLL_INTERVAL = 100;

async function request<T>(path: string, baseUrl: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    let detail = `ATLAS core returned ${response.status}`;

    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }

    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: (baseUrl = DEFAULT_API_BASE_URL) =>
    request<{ status: string }>("/health", baseUrl),

  getTracking: (baseUrl = DEFAULT_API_BASE_URL) =>
    request<TrackingResponse>("/tracking", baseUrl),

  getBenchmark: (baseUrl = DEFAULT_API_BASE_URL) =>
    request<BenchmarkResponse | null>("/benchmark", baseUrl),

  runBenchmark: (baseUrl = DEFAULT_API_BASE_URL) =>
    request<BenchmarkResponse>("/benchmark", baseUrl, {
      method: "POST",
    }),

  runScenarioBenchmark: (
    scenario: {
      motion: string;
      atmosphere: string;
      noise_type: string;
      noise_level: number;
    },
    baseUrl = DEFAULT_API_BASE_URL,
  ) =>
    request<ScenarioBenchmarkResponse>("/benchmark/scenario", baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scenario),
    }),

  runVideoBenchmark: (file: File, baseUrl = DEFAULT_API_BASE_URL) => {
    const formData = new FormData();
    formData.append("video", file);
    return request<VideoBenchmarkResponse>("/benchmark/video", baseUrl, {
      method: "POST",
      body: formData,
    });
  },
};
