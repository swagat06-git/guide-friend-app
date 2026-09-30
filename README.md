

````markdown
# ATLAS

## Autonomous Target Localization and Acquisition System

ATLAS is an AI-based virtual camera tracking system designed for coarse alignment of mobile Free Space Optical Communication (FSOC) terminals.

The system autonomously detects a designated moving beacon, tracks its position, estimates its motion, and continuously controls a virtual camera to maintain the target within the camera field of view.

## Live Application

[Open ATLAS](https://atlas-henna-nu.vercel.app/)

Backend API:

[ATLAS Backend API](https://atlas-2ejd.onrender.com/)

API Documentation:

[ATLAS API Docs](https://atlas-2ejd.onrender.com/docs)

## Problem Statement

Free Space Optical Communication systems use narrow laser beams for high-speed wireless communication. Because of the narrow beam divergence, accurate pointing, acquisition, and tracking of the remote terminal are essential.

ATLAS addresses the coarse alignment stage by providing an automated virtual camera tracking system capable of:

- Detecting a designated beacon target
- Continuously tracking a moving target
- Estimating target position and motion
- Controlling virtual camera pan and tilt
- Maintaining the target within the camera field of view
- Operating under different environmental and sensor disturbances
- Measuring real-time tracking and processing performance

## System Architecture

```text
Virtual Scene
     |
     v
Target Motion
     |
     v
Virtual Camera
     |
     v
Image Frame
     |
     v
AI Target Detector
     |
     v
Kalman Tracker
     |
     v
Camera Controller
     |
     v
Virtual Camera Update
     |
     +--------------------+
                          |
                          v
                    Performance
                     Monitoring
````

The main processing pipeline is:

```text
Simulator -> ML Detector -> Kalman Tracker -> Camera Controller
```

## Core Components

### Virtual Simulation Environment

The simulator generates a configurable virtual scene containing a moving beacon target and a virtual camera.

Supported target motion patterns include:

* Linear
* Circular
* Figure-8
* Random

The simulation environment supports configurable target position, target size, camera parameters, motion parameters, and disturbances.

### AI Target Detection

ATLAS uses a lightweight PyTorch-based convolutional neural network for target localization.

The detector operates on monochrome camera frames and predicts the normalized target coordinates.

The detection pipeline also includes image-processing based target localization and validation mechanisms to improve robustness.

The system includes jump-gating logic to reject implausible frame-to-frame target movements.

### Kalman Tracking

A Kalman-based tracking stage smooths the detected target position and estimates target motion.

This helps reduce the effect of noisy detections and provides a more stable position estimate for the camera controller.

### Camera Control

The camera controller converts target position error into pan and tilt commands.

The objective is to continuously minimize the displacement between the target position and the desired camera center.

The system supports configurable:

* Maximum pan speed
* Maximum tilt speed
* Controller gain
* Camera jitter

### Disturbance Simulation

ATLAS provides configurable disturbance models for testing system robustness.

Supported image noise models include:

* Gaussian noise
* Salt-and-pepper noise
* Poisson noise

Supported atmospheric conditions include:

* Clear
* Haze
* Fog
* Rain
* Low light

Camera jitter can also be introduced to simulate platform and camera disturbances.

## Benchmarking

ATLAS includes an automated benchmarking system for evaluating tracking performance.

The benchmark measures:

* Processing FPS
* Average processing time
* Maximum processing time
* Acquisition time
* Detection rate
* Lock retention
* Target loss
* Average centroid error
* Maximum centroid error
* Root Mean Square Error

## Verified Benchmark

The current verified synthetic video benchmark uses:

| Parameter               |      Value |
| ----------------------- | ---------: |
| Video Resolution        |  640 × 480 |
| Frame Rate              |     30 FPS |
| Frames                  |        900 |
| Duration                | 30 seconds |
| Processing FPS          |    1318.77 |
| Average Processing Time |    0.76 ms |
| Acquisition Time        |    0.033 s |
| Detection Rate          |     97.11% |
| Lock Retention          |       100% |
| Target Loss             |         0% |
| Average Centroid Error  |    4.33 px |
| Maximum Centroid Error  |   47.38 px |
| RMSE                    |    5.51 px |

The benchmark results represent an offline synthetic-video processing benchmark. They should not be interpreted as equivalent to the deployed web-service processing rate.

## Live Video Benchmark

The deployed backend also supports MP4 video benchmarking.

The service accepts compatible video input and processes the uploaded frames through the tracking pipeline.

The current deployed service has achieved approximately 44.82 FPS in live upload testing.

The deployed performance is lower than the offline benchmark because the web service includes video upload, decoding, request handling, and deployment-environment overhead.

## Scenario Benchmarking

ATLAS provides configurable scenario benchmarking through the web interface.

Users can select:

* Target motion
* Atmospheric condition
* Noise type
* Noise intensity

The selected configuration is sent to the backend and executed through the simulation and tracking pipeline.

This allows different tracking conditions to be tested without modifying the source code.

## Web Dashboard

The ATLAS web interface provides a live monitoring and benchmarking dashboard.

The dashboard includes:

* Live tracking status
* Target position
* Camera position
* Centroid error telemetry
* Processing performance
* Benchmark metrics
* Scenario selection
* Disturbance configuration
* Error-over-time visualization
* Benchmark report export
* System status monitoring

## API

The backend is implemented using FastAPI.

### Health Check

```http
GET /health
```

### Live Tracking

```http
GET /tracking
```

### Benchmark Results

```http
GET /benchmark
```

### Run Benchmark

```http
POST /benchmark
```

### Video Benchmark

```http
POST /benchmark/video
```

### Scenario Benchmark

```http
POST /benchmark/scenario
```

### API Documentation

[Open API Documentation](https://atlas-2ejd.onrender.com/docs)

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Vercel

### Backend

* Python
* FastAPI
* Uvicorn

### Machine Learning

* PyTorch
* Torchvision
* NumPy
* OpenCV
* SciPy
* Pandas

### Tracking

* Kalman filtering
* Computer vision based target localization
* CNN-based target detection
* Closed-loop camera control

### Deployment

Frontend:

[https://atlas-henna-nu.vercel.app/](https://atlas-henna-nu.vercel.app/)

Backend:

[https://atlas-2ejd.onrender.com/](https://atlas-2ejd.onrender.com/)

## Project Structure

```text
tracking-system/
|
├── api/
│   ├── main.py
│   ├── benchmark.py
│   ├── scenario_benchmark.py
│   ├── video_benchmark.py
│   └── response.py
|
├── simulation/
│   ├── camera.py
│   ├── simulator.py
│   ├── target.py
│   ├── motion.py
│   ├── scene.py
│   └── atmosphere.py
|
├── tracking/
│   ├── ml_detector.py
│   ├── kalman.py
│   ├── camera_controller.py
│   └── system.py
|
├── config/
│   └── config.json
|
├── scripts/
|
├── videos/
|
├── requirements.txt
├── Dockerfile
└── README.md
```

## Running the Backend Locally

Clone the repository:

```bash
git clone https://github.com/swagat06-git/tracking-system.git
cd tracking-system
```

Create and activate the virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
python -m uvicorn api.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

## Configuration

The system is configurable through:

```text
config/config.json
```

Configuration parameters include:

* Canvas dimensions
* Camera resolution
* Camera field of view
* Frame rate
* Target size
* Target motion
* Noise type
* Noise level
* Camera jitter
* Maximum pan speed
* Maximum tilt speed
* Controller gain

## Performance Optimization

The tracking pipeline has been optimized for real-time operation.

Key optimizations include:

* Lightweight CNN architecture
* MPS acceleration on Apple Silicon
* CUDA support when available
* CPU thread optimization
* PyTorch inference mode
* Efficient NumPy/OpenCV frame processing
* Detection jump gating
* Lightweight benchmark execution

## Limitations

The current implementation is primarily a virtual and synthetic tracking system.

The atmospheric disturbance models are simplified simulation models rather than physically rigorous FSOC propagation models.

The current uploaded-video benchmark does not automatically calculate centroid accuracy unless corresponding ground-truth information is available.

The standalone executable and complete end-user packaging are intended as future release deliverables.

## Future Work

Potential improvements include:

* Integration with real camera hardware
* Hardware PTZ interface
* More advanced object detection models
* Improved atmospheric propagation models
* More realistic platform motion
* GPU acceleration on deployed infrastructure
* Automatic ground-truth generation for uploaded benchmark videos
* Standalone executable packaging
* Fine alignment integration for complete FSOC PAT
* Extended multi-target tracking

## Project Objective

The primary objective of ATLAS is to demonstrate an AI-assisted virtual camera tracking system capable of autonomous target acquisition and continuous tracking under configurable motion, noise, atmospheric, and camera disturbances.

The system provides both a simulation environment and a web-based monitoring and benchmarking interface for evaluating tracking performance.

## Links

Live Application:

[https://atlas-henna-nu.vercel.app/](https://atlas-henna-nu.vercel.app/)

Backend API:

[https://atlas-2ejd.onrender.com/](https://atlas-2ejd.onrender.com/)

API Documentation:

[https://atlas-2ejd.onrender.com/docs](https://atlas-2ejd.onrender.com/docs)

GitHub Repository:

[https://github.com/swagat06-git/tracking-system](https://github.com/swagat06-git/tracking-system)

```

You can save that directly as **`README.md`** in your `tracking-system` repository and push it with your `feature/day2-interface` branch.
```

