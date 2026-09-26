export interface TrackingResponse {
  status: { detected: boolean; tracking: boolean };
  target: { x: number | null; y: number | null } | null;
  velocity: { x: number | null; y: number | null } | null;
  camera: { pan_speed: number | null; tilt_speed: number | null } | null;
  metadata: { confidence: number | null; timestamp: number | null } | null;
}