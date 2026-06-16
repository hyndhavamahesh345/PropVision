# VisionVault 📦🔍

VisionVault is a high-performance, full-stack AI web application designed to automatically scan user-uploaded videos and generate highly accurate household inventory lists. By simply uploading a video walkthrough of a room or house, VisionVault uses state-of-the-art computer vision to identify, track, and count furniture, appliances, and decor.

**💰 100% Free & Local:** Everything in this project relies on free, open-source technology. There are **zero paid APIs, no cloud subscriptions, and no hidden costs**. All AI inference runs locally on your machine.

---

## 📁 High-Level Codebase Structure

```text
VisionVault/
├── frontend/               # React + Vite UI
│   ├── src/
│   │   ├── App.jsx         # Main dashboard, UI components, and API polling
│   │   ├── index.css       # Tailwind & custom CSS styles
│   │   └── main.jsx        # React entry point
│   └── package.json        # Node dependencies
│
├── backend/                # FastAPI + AI Detection Engine
│   ├── main.py             # FastAPI application entry point
│   ├── config.py           # Environment variables, thresholds, and paths
│   ├── worker/
│   │   ├── tasks.py        # Celery background tasks (video processing workflow)
│   │   └── redis.py        # Redis & Celery configuration
│   ├── api/
│   │   └── routes.py       # API endpoints (/api/upload, /api/status, /api/inventory)
│   ├── detection_engine/   # Core AI Logic 
│   │   ├── router.py       # Detection router routing frames to YOLO-World
│   │   ├── tier1_yolo26.py # Legacy: Tier 1 (Deprecated)
│   │   ├── tier2_yolov12_world.py # Active: YOLO-World (Open-Vocabulary engine)
│   │   └── tier3_rtdetr.py # Legacy: Tier 3 (Deprecated)
│   ├── aggregator/
│   │   └── aggregator.py   # Merges detections & eliminates duplicates across frames
│   ├── services/
│   │   ├── video/          # Extracts frames & downscales them
│   │   ├── room/           # AI heuristic logic to assign items to specific rooms
│   │   └── inventory/      # Deduplicates terminology (e.g., "couch" -> "sofa")
│   ├── db/
│   │   └── postgres.py     # Database schema and SQLAlchemy setup
│   └── storage/
│       └── minio.py        # MinIO S3 bucket integrations
│
├── docker-compose.yml      # Spins up PostgreSQL, Redis, and MinIO
└── start_app.bat           # Utility script to launch the full stack locally
```

---

## 🧠 The AI Architecture: Open-Vocabulary YOLO-World

The core brain of VisionVault resides in `backend/detection_engine/`. 
Previously, the system utilized a complex 3-tier escalation engine. We have since upgraded and streamlined the architecture to exclusively rely on a highly-capable **YOLO-World Open-Vocabulary Engine** (`tier2_yolov12_world.py`).

1. **Massive Restricted Vocabulary:** By restricting YOLO-World to an exact list of 76 unique household objects (`UNIQUE_HOUSEHOLD_OBJECTS`), the AI is perfectly tuned to look for the precise objects relevant to a household inventory without hallucinating.
2. **Simplified Routing:** `router.py` now bypasses legacy, less capable models and routes every extracted video frame directly to YOLO-World, completely solving the "double counting" issues caused by multiple tiers detecting the same object.

---

## 🛡️ The Anti-Hallucination Aggregator & Dual-Validation Tracking

Once the AI engine processes the frames, `aggregator.py` acts as a strict filter before items hit your inventory list. It utilizes native `roboflow/supervision` pipelines to guarantee precision.

1. **Size & Overlap Filtering:** Rejects impossibly small bounding boxes (Area < 400px) and applies Non-Maximum Suppression (NMS) via `sv.with_nms(threshold=0.45)` to clean up overlapping bounding boxes natively.
2. **Dynamic Confidence Thresholds:** Applies tailored strictness thresholds per item type to prevent specific hallucinations. For example, to prevent windows from being falsely identified as wall art, the threshold for `picture frame` is aggressively tightened to 60%, while a standard `chair` only requires 35%.
3. **Dual-Validation Temporal Tracking:**
   - **ByteTrack Engine:** Uses `sv.ByteTrack` to assign unique integer `tracker_id`s to objects spanning across multiple frames, guaranteeing we don't double-count items as the camera pans back and forth.
   - **Scene-Max Fallback:** Operates simultaneously alongside ByteTrack. Bounding boxes detected across multiple frames are aggregated using maximum counts per frame rather than a running sum.
   - **Diagnostic Reconciliation:** The aggregator constantly compares outputs from both tracking logic pathways and logs any numerical discrepancies to the terminal for deep validation.

---

## 🖥️ The Interactive UI

The frontend is a single-page React application built with Tailwind CSS.

- **Status Polling:** Once you upload a video, the UI pings `/api/status` dynamically updating the loading bar as Celery runs the AI pipeline.
- **Dynamic Verification Gallery:** When processing finishes, the UI automatically fetches the AI-annotated frames directly from `backend/static/annotated` and seamlessly renders them **right in the middle of your inventory report**. This gives you visual proof of what the AI detected.
- **Export System:** Generates professional CSV, JSON, and PDF reports directly in the browser.

---

## ⚙️ Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
- Node.js & npm
- Python 3.9+
- Docker Desktop (Required to run Redis & PostgreSQL)

### 2. Start Dependencies
Run the required background services via Docker (ensure they are active before starting the backend).

### 3. Start the Backend API
Open a terminal and start the FastAPI server:
```bash
cd backend
python main.py
```
*(The backend will run at `http://localhost:8001`)*

### 4. Start the Celery Worker
Open a **new** terminal and start the asynchronous processing queue:
```bash
cd backend
celery -A worker.tasks worker --loglevel=info --pool=solo
```

### 5. Start the Frontend
Open a **new** terminal and launch the React application:
```bash
cd frontend
npm run dev
```
*(The frontend will run at `http://localhost:5173`)*

## 💡 Usage

1. Open your web browser and navigate to `http://localhost:5173`.
2. Click **"Upload Video"** and select any household video clip.
3. The video will be sent to the single Celery worker and routed through the YOLO-World AI Engine.
4. Watch as your final, perfectly deduplicated inventory populates on the screen automatically alongside the AI annotated verification frames!
