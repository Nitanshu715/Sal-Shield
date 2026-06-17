<div align="center">

<img src="./Sal-Shield-Project-Logo.png" alt="SAL-SHIELD Logo" width="450" height="450"/>

# 🌲🌳 SAL-SHIELD 🌳🌲

## AI-Powered Forest Intelligence Platform

<p>
  <img src="https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel">
  <img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask">
  <img src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white">
</p>

<p>
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img src="https://img.shields.io/badge/XGBoost-EF4444?style=for-the-badge">
  <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet">
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge">
  <img src="https://img.shields.io/badge/GIS-Sentinel--2-2563EB?style=for-the-badge">
</p>

<p>
  <img src="https://img.shields.io/badge/ML%20Accuracy-97.5%25-success?style=for-the-badge">
  <img src="https://img.shields.io/badge/CNN-92.7%25-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/Cost-₹0-brightgreen?style=for-the-badge">
  <img src="https://img.shields.io/badge/Live-salshield.com-orange?style=for-the-badge">
</p>

### 🛰️ Satellite Intelligence • 🤖 Machine Learning • 🌍 WebGIS • 📱 Offline PWA

</div>



**AI & GIS-Based Forest Infestation Early Warning Platform**

*Protecting Himalayan Sal Forests through Satellite Intelligence*

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.21-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)](https://tensorflow.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Sentinel-2](https://img.shields.io/badge/Sentinel--2-ESA%20Free-0066CC?style=flat-square)](https://sentinel.esa.int)
[![License](https://img.shields.io/badge/License-MIT-97BC62?style=flat-square)](LICENSE)

---

*Developed under the guidance of **Prof. Nadeem Yousuf Khan** · UPES Dehradun*  
*Targeting **HILL Conference** · October 2025*

</div>

---

## The Crisis

Uttarakhand is experiencing one of its worst ecological disasters in recent history. *Hoplocerambyx spinicornis* — the Sal Borer beetle — is systematically destroying *Shorea robusta* (Sal) forests across Dehradun, Thano, Asarori, Jhajhra, and surrounding regions. The beetle's larvae penetrate tree roots and tunnel through the trunk, hollowing the tree from within and severing its nutrient transport system. By the time a tree shows visible symptoms of decay, the infestation has typically already spread to dozens of surrounding trees.

**Over 19,170 Sal trees** have been identified for emergency felling in the Dehradun Forest Division alone. The Forest Research Institute (FRI) has confirmed that excessive 2025 monsoon rainfall created ideal beetle breeding conditions, and the region's dense monoculture Sal plantations — with no biodiversity barriers — allowed rapid spatial spread.

The fundamental problem: **current detection is entirely reactive.** Forest guards physically locate and report dead or dying trees. SAL-SHIELD is built to invert this — to make detection proactive, predictive, and spatially intelligent.

---

## What SAL-SHIELD Does

SAL-SHIELD is a complete forest intelligence platform that operates at two scales simultaneously:

**At the forest scale** — satellite imagery from the European Space Agency's Sentinel-2 constellation is processed to compute the Sal Borer Vulnerability Index (SBVI), a composite geospatial risk score derived from vegetation health, moisture stress, and burn ratio indicators. This produces a risk-classified map of the entire Dehradun study area, updated as new satellite passes become available.

**At the tree scale** — field forest guards use a Progressive Web App on their phones to photograph individual trees. A trained Convolutional Neural Network classifies each photo as Healthy, Stressed, or Infected in under 2 seconds, with GPS coordinates auto-tagged and reports synced to the central dashboard. The system works completely offline in zero-connectivity forest environments, queuing reports locally and syncing automatically when signal returns.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DATA ACQUISITION LAYER                          │
│                                                                     │
│  Sentinel-2 (ESA)     CHIRPS Rainfall     SRTM DEM (NASA)          │
│  10m resolution       Monthly totals      30m elevation             │
│  5-day revisit        2023 – 2025         Uttarakhand               │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GIS PROCESSING LAYER                             │
│                    Chandreyee Dey Roy                               │
│                                                                     │
│  NDVI  (Vegetation Health)    Band Math: (NIR-Red)/(NIR+Red)        │
│  NDMI  (Moisture Stress)      Band Math: (NIR-SWIR)/(NIR+SWIR)      │
│  NBR   (Burn Ratio)           Band Math: (NIR-SWIR2)/(NIR+SWIR2)    │
│  SLOPE (Terrain Factor)       Derived from SRTM DEM                 │
│                                                                     │
│  4 time periods: Baseline (Oct 23) → Pre-Stress (Mar 24)           │
│                  Peak Damage (Oct 24) → Current (Jun 25)            │
│                                                                     │
│         SBVI = (NDVI×0.35) + (NDMI×0.35) + (NBR×0.20) + (SAR×0.10)│
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ML PIPELINE LAYER                               │
│                       Nitanshu Tak                                  │
│                                                                     │
│  ┌─────────────────────────┐  ┌────────────────────────────────┐   │
│  │  SBVI Satellite Model   │  │  Tree Image Classifier (CNN)   │   │
│  │                         │  │                                │   │
│  │  21 raster features     │  │  MobileNetV2 architecture      │   │
│  │  Random Forest 200 est  │  │  96×96 input resolution        │   │
│  │  XGBoost 200 est        │  │  Trained on 691 images         │   │
│  │  5-fold stratified CV   │  │  3 classes: H / S / I          │   │
│  │                         │  │                                │   │
│  │  RF:  88.8% accuracy    │  │  Accuracy:  92.7%              │   │
│  │  XGB: 97.5% accuracy    │  │  Architecture: Custom CNN      │   │
│  └─────────────────────────┘  └────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                                │
│                                                                     │
│  Flask REST API ──────────────────── React + Vite PWA              │
│  SQLite Database                      Leaflet GIS Map               │
│  SBVI GeoJSON serving                 Recharts Analytics            │
│  CNN Inference endpoint               IndexedDB Offline Queue        │
│  Field Report storage                 Workbox Service Worker         │
│                                                                     │
│  Hosting: Render (backend) ─────── Vercel (frontend)               │
│  Cost: ₹0                                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ML Model Results

### Model 1 — SBVI Satellite Risk Classifier

Trained on 21 satellite-derived features across 4 Sentinel-2 time periods. Labels derived from SBVI thresholds, validated against known FRI infestation zones.

| Algorithm | Accuracy | Validation Strategy | Training Samples |
|---|---|---|---|
| Random Forest (200 estimators) | **88.8%** | 5-fold stratified CV | 80 labeled pixels |
| XGBoost (200 estimators) | **97.5%** | 5-fold stratified CV | 80 labeled pixels |
| Ensemble (avg probabilities) | **93.1%** | 5-fold stratified CV | 80 labeled pixels |

**Feature importance:** `sbvi_raw` (0.391) → `ndmi_diff` (0.073) → `nbr_change` (0.055) → `ndmi_total_drop` (0.049)

The dominance of NDMI-derived features confirms the ecological hypothesis: moisture stress is the earliest detectable satellite signal of Sal borer infestation, appearing weeks before visible canopy damage.

### Model 2 — Tree Image Classifier (CNN)

Custom 3-block convolutional neural network trained on field-sourced tree images. Designed for deployment on low-RAM devices and inference on CPU.

| Metric | Value |
|---|---|
| Final Validation Accuracy | **92.7%** |
| Architecture | 3-block CNN with BatchNorm + Dropout |
| Input Resolution | 96 × 96 × 3 |
| Training Images | 691 (after cleanup) |
| Classes | Healthy · Stressed · Infected |
| Training Strategy | Phase 1: head only → Phase 2: partial fine-tune |

### SBVI Risk Classification Thresholds

| SBVI Score | Risk Class | Action Required |
|---|---|---|
| < 0.45 | Very Low | Routine monitoring |
| 0.45 – 0.58 | Low | Periodic inspection |
| 0.58 – 0.68 | Moderate | Field team dispatch |
| 0.68 – 0.78 | High | FRI scientific assessment |
| > 0.78 | Very High | Immediate intervention |

**Study area statistics:** Mean SBVI 0.529 · Min 0.114 · Max 1.081 · 223 valid pixels  
**Very High Risk zones identified:** 24 pixels (SBVI > 0.78) across the study area

---

## Application Features

### Dashboard
Real-time GIS map rendering actual SBVI risk zones derived from Sentinel-2 satellite processing. Five-class risk visualization (Very High → Very Low) with toggleable layers. Click any zone to inspect SBVI score, pixel count, area, and contributing formula components. Mini NDVI trend chart shows the real vegetation decline from 0.647 (Oct 2023 baseline) to 0.500 (Jun 2025 current). Active alerts panel flags zones exceeding critical thresholds.

### Field Report (PWA)
Forest guards open the app on their phone, photograph a tree, and receive an AI health classification within 2 seconds. GPS coordinates are auto-captured and tagged to the report. Severity assessment and field notes are recorded. If the guard is in a zero-connectivity forest area, the report saves to browser IndexedDB and syncs automatically when signal returns — no data loss, no manual action required.

### Analytics
Multi-temporal vegetation analysis using real Sentinel-2 values across all 4 processed scenes. SBVI distribution by zone, NDVI/NDMI time series charts, and infestation spread correlation with vegetation decline. NDVI dropped 22.7% over the study period; NDMI dropped 0.133 points — both statistically significant indicators of active infestation progression.

### Reports
Complete table of all field reports submitted by forest guards. Filter by health status (Infected / Stressed / Healthy). Sync status indicator shows which reports are confirmed server-side vs pending.

### Saved (Offline Manager)
Full visibility into offline-captured reports. Sync All button, individual delete, CSV export for permanent local records. Explains exactly where data is stored (browser IndexedDB) and how the sync pipeline works.

---

## Repository Structure

```
SAL-SHIELD/
│
├── backend/                        Flask REST API
│   ├── app.py                      All endpoints + ML inference
│   ├── train_cnn.py                CNN image classifier training
│   ├── train_model.py              Satellite RF/XGB training
│   ├── test_model.py               Model evaluation script
│   ├── collect_dataset.py          Dataset collection utilities
│   ├── requirements.txt
│   ├── render.yaml                 Render deployment config
│   │
│   ├── models/                     Trained model files
│   │   ├── rf_model.pkl            Random Forest (88.8%)
│   │   ├── xgb_model.pkl           XGBoost (97.5%)
│   │   ├── scaler.pkl              StandardScaler
│   │   ├── model_meta.json         Accuracy + feature metadata
│   │   └── tree_classifier.h5      CNN image model (92.7%)
│   │
│   └── data/
│       └── risk_zones.geojson      Real SBVI zones from Sentinel-2
│
├── frontend/                       React + Vite PWA
│   ├── src/
│   │   ├── App.jsx                 Shell + routing + navigation
│   │   ├── index.css               Complete dark forest design system
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       GIS map + SBVI panel + alerts
│   │   │   ├── FieldReport.jsx     Camera + GPS + CNN classification
│   │   │   ├── Analytics.jsx       Temporal NDVI/SBVI charts
│   │   │   ├── Reports.jsx         Field reports table
│   │   │   └── Saved.jsx           Offline report manager
│   │   ├── data/
│   │   │   └── forestData.js       Study area bounds + real values
│   │   ├── hooks/
│   │   │   ├── useGPS.js           GPS with HTTPS detection + fallback
│   │   │   └── useToast.jsx        Notification system
│   │   └── utils/
│   │       └── api.js              API calls + IndexedDB offline queue
│   ├── vite.config.js              PWA config + service worker
│   └── vercel.json
│
└── README.md
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Satellite Data | Sentinel-2 (ESA) | 10m multispectral imagery, free |
| Terrain | SRTM DEM (NASA) | Elevation + slope features |
| Rainfall | CHIRPS | Monthly precipitation data |
| GIS Processing | QGIS · Rasterio · GDAL | Raster computation + vectorization |
| ML — Tabular | scikit-learn · XGBoost | RF + XGB satellite risk model |
| ML — Vision | TensorFlow · Keras | CNN tree image classifier |
| Backend | Python · Flask · Flask-CORS | REST API + inference server |
| Database | SQLite | Field report storage |
| Frontend | React 18 · Vite | Web application |
| Maps | Leaflet · React-Leaflet | GeoJSON risk zone rendering |
| Charts | Recharts | NDVI/SBVI analytics |
| PWA | vite-plugin-pwa · Workbox | Offline support + service worker |
| Offline Storage | IndexedDB | Browser-side report queue |
| Frontend Host | Vercel | Free HTTPS hosting |
| Backend Host | Render | Free Python hosting |
| **Total Cost** | **₹0** | **100% free infrastructure** |

---

## Local Setup

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install flask flask-cors scikit-learn==1.5.2 xgboost pillow tensorflow
python app.py
```

Backend starts at `http://localhost:5000`

Verify everything loaded:
```
✓ Tabular models loaded (RF: 88.8%, XGB: 97.5%)
✓ Production CNN Image Classifier weights successfully compiled!
Running on http://127.0.0.1:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host
```

Opens at `http://localhost:5173`  
Network URL (for phone testing): `http://192.168.x.x:5173`

---

## Production Deployment

### Backend → Render

1. Push `backend/` to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect GitHub repo → set root to `backend/`
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1`
6. Deploy → note your URL: `https://sal-shield-api.onrender.com`

### Frontend → Vercel

```bash
cd frontend
npx vercel
```

Add environment variable in Vercel dashboard:
```
VITE_API_URL = https://sal-shield-api.onrender.com/api
```

Your app is now live at `https://sal-shield.vercel.app`

---

## Testing

### Test ML Models Locally

```bash
cd backend
venv\Scripts\activate
python test_model.py
```

Output:
```
Model 1 (SBVI Satellite): RF 88.8%  XGB 97.5%  ✓ TARGET MET
Model 2 (Image CNN):      92.7%               ✓ TARGET MET
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Risk zones GeoJSON
curl http://localhost:5000/api/risk-zones

# Model information
curl http://localhost:5000/api/model-info

# Image prediction
curl -X POST http://localhost:5000/api/predict/image -F "image=@your_tree.jpg"
```

### Test on Phone

**Same WiFi (local dev):**
Run `npm run dev -- --host` and open the Network URL shown on your phone browser.
GPS will use the study area center as fallback (real GPS requires HTTPS).

**Full phone support with real GPS:**
Deploy to Vercel → open `https://your-app.vercel.app` on phone Chrome → tap "Add to Home Screen" → installs as PWA with real GPS, camera, and offline support.

### Test Offline Mode

1. Open the app on phone
2. Turn off WiFi and mobile data
3. Go to Field Report → take a photo → Analyse → Save Offline
4. Turn WiFi back on
5. Go to Saved tab → tap Sync All → report uploads to server

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | System health + model status |
| GET | `/api/risk-zones` | Real SBVI GeoJSON from Sentinel-2 |
| GET | `/api/stats` | Dashboard summary statistics |
| GET | `/api/model-info` | Model accuracies + metadata |
| GET | `/api/ndvi-timeseries` | 4-point NDVI/NDMI temporal data |
| GET | `/api/reports` | All field reports |
| POST | `/api/predict/image` | CNN tree health classification |
| POST | `/api/field-report` | Submit field report with image |

---

## Study Area

```
Dehradun Forest Division · Uttarakhand · India

Bounding Box: 77.85°E – 78.15°E  ·  30.20°N – 30.45°N
Resolution:   10 meters (Sentinel-2 native)
Satellite Scenes:
  · Baseline    — October 2023     (pre-outbreak reference)
  · Pre-Stress  — March 2024       (early stress indicators)
  · Peak Damage — October 2024     (worst measured decline)
  · Current     — June 2025        (ongoing monitoring)

Zones covered: Dehradun · Thano · Asarori · Jhajhra · Kalsi
```

---

## Research Contribution

**Original contributions of this work:**

**SBVI** — The Sal Borer Vulnerability Index is an original composite geospatial risk index specifically designed for *Hoplocerambyx spinicornis* infestation in Himalayan *Shorea robusta* forests. No equivalent domain-specific index existed in prior literature for this beetle-host combination.

**Multi-temporal framework** — Most existing bark beetle detection studies use single-date imagery. This work employs 4-scene temporal analysis tracking the infestation progression from pre-outbreak baseline through current state, enabling change detection and trend analysis unavailable in single-pass approaches.

**Integrated decision-support platform** — Combining satellite-derived risk mapping with offline-capable field reporting into a single deployable WebGIS platform represents a methodological advance for Indian forest department operational systems.

**Zero-cost replicability** — The entire pipeline uses free satellite data (ESA, NASA, USGS), open-source ML frameworks, and free hosting. Any forest division globally can deploy an equivalent system for ₹0 infrastructure cost.

---

## Dataset Sources

| Class | Source | Count |
|---|---|---|
| Healthy | iNaturalist (Shorea robusta observations) + Wikimedia Commons (Forest categories) | 211 clean images |
| Stressed | PlantDoc disease dataset (blight, scab, rot classes) | 274 images |
| Infected | PlantDoc (severe disease) + Wikimedia (Bark_beetle_damage, Coarse_woody_debris) | 206 clean images |

Training: 554 images · Validation: 137 images · Augmentation applied (rotation, flip, zoom, brightness)

---

## Team

### Nitanshu Tak
**B.Tech CSE (Cloud Computing & Virtualization Technology) · UPES Dehradun**  
SDE @ SapMen C. · Founder, MediFlow AI

*Contributions: ML pipeline design and training (RF, XGB, CNN) · Flask REST API · React WebGIS dashboard · PWA architecture · offline sync system · GeoJSON processing · system deployment · project architecture*

[![GitHub](https://img.shields.io/badge/GitHub-Nitanshu715-181717?style=flat-square&logo=github)](https://github.com/Nitanshu715)

---

### Chandreyee Dey Roy
**B.Tech · UPES Dehradun**

*Contributions: Sentinel-2 satellite data acquisition and preprocessing · NDVI / NDMI / NBR index computation across 4 temporal scenes · SBVI formula derivation and validation · GeoTIFF raster pipeline · QGIS and Google Earth Engine workflows · SBVI_raw.tif and SBVI_dissolved.shp generation*

---

### Faculty Supervisor
**Prof. Nadeem Yousuf Khan**  
*UPES Dehradun*

*Project initiated and supervised under Prof. Khan's guidance in response to the active Sal borer ecological crisis in Uttarakhand, targeting presentation at the HILL Conference (October 2025).*

---

## Conference Target

**HILL Conference · October 2025**  
Himalayan Institute of Languages and Literature · Uttarakhand

Follow-up targets: IEEE IGARSS · Springer Environmental Monitoring and Assessment

---

## License

MIT License — open for research, educational, and forest management use.

*If this work helps protect Sal forests anywhere in the world, that is contribution enough.*

---

<div align="center">

**SAL-SHIELD** · Built at UPES Dehradun · 2025  
*For the Sal forests of Uttarakhand*

`RF 88.8%` · `XGB 97.5%` · `CNN 92.7%` · `Cost ₹0`

</div>
