export interface TrackingResponse {
  status: { detected: boolean; tracking: boolean };
  target: { x: number | null; y: number | null } | null;
  velocity: { x: number | null; y: number | null } | null;
  camera: { pan_speed: number | null; tilt_speed: number | null } | null;
  metadata: { confidence: number | null; timestamp: number | null } | null;
}

export interface BenchmarkResponse {
  status: "completed";
  generated_at: number;
  result: {
    video: {
      path: string;
      ground_truth_path: string;
      width: number;
      height: number;
      fps: number;
      frames: number;
      duration_seconds: number;
    };
    benchmark: {
      benchmark_runtime_seconds: number;
      measured_processing_fps: number;
      average_processing_ms: number;
      max_processing_ms: number;
    };
    tracking: {
      detected_frames: number;
      tracking_frames: number;
      detection_rate_percent: number;
      lock_retention_percent: number;
      target_loss_percent: number;
      first_detection_frame: number | null;
      acquisition_time_seconds: number | null;
    };
    accuracy: {
      frames_with_error: number;
      average_centroid_error_pixels: number | null;
      maximum_centroid_error_pixels: number | null;
      rmse_pixels: number | null;
    };
  };
}


export interface VideoBenchmarkResponse {
  status: "completed";
  generated_at: number;
  result: {
    video: {
      filename: string;
      width: number;
      height: number;
      fps: number;
      frames: number;
      duration_seconds: number;
    };
    benchmark: {
      benchmark_runtime_seconds: number;
      measured_processing_fps: number;
      average_processing_ms: number;
      max_processing_ms: number;
    };
    tracking: {
      detected_frames: number;
      tracking_frames: number;
      detection_rate_percent: number;
      lock_retention_percent: number;
      target_loss_percent: number;
      first_detection_frame: number | null;
      acquisition_time_seconds: number | null;
    };
    accuracy: {
      frames_with_error: number;
      average_centroid_error_pixels: number | null;
      maximum_centroid_error_pixels: number | null;
      rmse_pixels: number | null;
      ground_truth_available: boolean;
    };
  };
  notes: string[];
}
