# SAL-SHIELD 🛡️

**AI & GIS-Based Forest Infestation Early Warning Platform**

An intelligent decision-support system for early detection and spatial prediction of *Hoplocerambyx spinicornis* (Sal Borer) infestation in Himalayan Sal (*Shorea robusta*) forests using satellite remote sensing, machine learning, and a web-based GIS platform.

> Developed for HILL Conference · October 2025 · UPES Dehradun

---

## The Problem

Uttarakhand is facing an active outbreak of Sal Borer beetle destroying Sal forests across Dehradun, Thano, Asarori, and Jhajhra. Over 19,170 trees have been marked for felling in Dehradun Division alone. Current detection is entirely reactive — trees are reported only after visible death. SAL-SHIELD makes detection proactive.

---

## What It Does

- **Satellite Risk Mapping** — Processes Sentinel-2 multitemporal imagery (NDVI, NDMI, NBR) to compute the Sal Borer Vulnerability Index (SBVI) and visualise risk zones on an interactive GIS map
- **ML Risk Classification** — Random Forest (88.8%) + XGBoost (97.5%) ensemble trained on 21 satellite-derived features across 4 time periods
- **AI Tree Detection** — MobileNetV2 CNN classifies field photos as Healthy / Stressed / Infected
- **Field PWA** — Offline-capable Progressive Web App for forest guards with GPS tagging and AI classification, auto-syncs when signal returns
- **Decision Dashboard** — WebGIS platform showing risk zones, active alerts, field reports, and temporal NDVI decline charts

---

## System Architecture

```
Sentinel-2 Imagery (ESA Free)
        ↓
GIS Processing — QGIS · Google Earth Engine
NDVI · NDMI · NBR · SLOPE · SBVI Formula
        ↓
ML Pipeline — Python · scikit-learn · XGBoost
RF 88.8% · XGB 97.5% · 5-fold CV · 21 features
        ↓
Flask REST API
Risk Zones GeoJSON · Image Prediction · Field Reports
        ↓
React WebGIS Dashboard
Leaflet Map · Recharts · PWA · Offline IndexedDB
        ↓
Forest Officer Dashboard + Field Guard PWA
```

---

## SBVI Formula

```
SBVI = (NDVI_stress × 0.35) + (NDMI_stress × 0.35) + (NBR_stress × 0.20) + (SAR_stress × 0.10)
```

| SBVI Score | Risk Class | Action |
|---|---|---|
| < 0.45 | Very Low | Monitor |
| 0.45–0.58 | Low | Periodic inspection |
| 0.58–0.68 | Moderate | Field team dispatch |
| 0.68–0.78 | High | FRI assessment |
| > 0.78 | Very High | Immediate intervention |

---

## ML Model Results

| Model | Accuracy | Validation |
|---|---|---|
| Random Forest | **88.8%** | 5-fold stratified CV |
| XGBoost | **97.5%** | 5-fold stratified CV |
| MobileNetV2 CNN | **~88%** (after training) | 20% hold-out |

Top predictors: `sbvi_raw` · `ndmi_diff` · `nbr_change` · `ndmi_total_drop` · `ndvi_ratio`

---

## Tech Stack

**Backend** — Python · Flask · scikit-learn · XGBoost · TensorFlow · SQLite · Rasterio

**Frontend** — React 18 · Vite · Leaflet · Recharts · PWA (Workbox) · IndexedDB

**Data** — Sentinel-2 (ESA) · SRTM DEM (NASA) · Google Earth Engine

**Hosting** — Vercel (frontend) · Render (backend) · Cost: ₹0

---

## Project Structure

```
sal-shield/
├── backend/
│   ├── app.py                  Flask API — all endpoints
│   ├── train_model.py          CNN image classifier training
│   ├── test_model.py           Model evaluation
│   ├── collect_dataset.py      Dataset downloader
│   ├── requirements.txt
│   ├── models/
│   │   ├── rf_model.pkl        Random Forest (88.8%)
│   │   ├── xgb_model.pkl       XGBoost (97.5%)
│   │   ├── scaler.pkl
│   │   └── model_meta.json
│   └── data/
│       └── risk_zones.geojson  Real SBVI zones from Sentinel-2
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx   GIS map · alerts · NDVI charts
    │   │   ├── FieldReport.jsx Camera · GPS · AI classification
    │   │   ├── Analytics.jsx   Temporal NDVI/SBVI analysis
    │   │   ├── Reports.jsx     Field reports table
    │   │   └── Saved.jsx       Offline sync manager
    │   ├── data/forestData.js
    │   ├── hooks/
    │   └── utils/api.js
    ├── vite.config.js
    └── vercel.json
```

---

## Setup & Run

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install flask flask-cors scikit-learn xgboost pillow
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host
```

Open `http://localhost:5173`

### Train Image Classifier

```bash
cd backend
pip install tensorflow matplotlib
python train_model.py
```

### Test Both Models

```bash
python test_model.py
```

---

## Deploy Free

**Frontend → Vercel**
```bash
cd frontend && npx vercel
```

**Backend → Render**
Connect backend/ to Render. Start command: `gunicorn app:app`

---

## Dataset for CNN Training

| Class | Source | Count |
|---|---|---|
| Healthy | BarkVisionAI · figshare.com/articles/dataset/28427246 | 250 |
| Stressed | PlantDoc · github.com/pratikkayal/PlantDoc-Dataset | 200 |
| Infected | Google Images — "bark beetle damage tree" | 200 |

---

## Study Area

Dehradun Forest Division · Uttarakhand · India
Bounds: 77.85°E–78.15°E · 30.20°N–30.45°N
Sentinel-2 scenes: Oct 2023 · Mar 2024 · Oct 2024 · Jun 2025

---

## Team

**Nitanshu Tak** — ML Pipeline · Flask API · React WebGIS · PWA · System Architecture
B.Tech CSE (Cloud & Virtualization) · UPES Dehradun · [github.com/Nitanshu715](https://github.com/Nitanshu715)

**Chandreyee Dey Roy** — Satellite Data Processing · SBVI Formula · GIS Analysis
B.Tech · UPES Dehradun

---

## Research

Targeting HILL Conference · October 2025
Follow-up: IEEE IGARSS · Springer Environmental Monitoring and Assessment

**Key contributions:**
- Original SBVI composite index for Hoplocerambyx spinicornis in Himalayan Sal forests
- Multi-temporal Sentinel-2 analysis for bark borer early detection
- Integrated WebGIS + offline PWA decision-support platform
- Zero-cost replicable pipeline for any forest division

---

## License

MIT
