/**
 * SAL-SHIELD Forest Data
 * 
 * Real satellite data processed by Chandreyee Dey Roy (UPES Dehradun)
 * Study area: 77.85–78.15°E, 30.20–30.45°N (Dehradun Forest Division)
 * SBVI Formula: (NDVI_stress×0.35) + (NDMI_stress×0.35) + (NBR_stress×0.20) + (SAR_stress×0.10)
 * 
 * GeoJSON is served live from /api/risk-zones (backend/data/risk_zones.geojson)
 * This file provides fallback data and chart data only.
 */

// Real study area center from her raster bounds
export const STUDY_CENTER = [30.325, 78.000]
export const STUDY_BOUNDS = [[30.200, 77.850], [30.450, 78.150]]

// Risk color scheme matching her 5-class SBVI thresholds
export const RISK_COLORS = {
  'very_high': { fill: '#F06060', border: '#C04040', opacity: 0.42 },
  'high':      { fill: '#F08040', border: '#C06020', opacity: 0.38 },
  'moderate':  { fill: '#F0C040', border: '#C09020', opacity: 0.35 },
  'low':       { fill: '#A8D870', border: '#78A840', opacity: 0.30 },
  'very_low':  { fill: '#52C778', border: '#2A8040', opacity: 0.28 },
}

// Fallback zones (used if backend is offline)
// Approximate locations within her study area bounds
export const FALLBACK_ZONES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'fallback-high', name: 'High Risk Zone (cached)',
        risk: 'high', risk_label: 'High', sbvi_mean: 0.728,
        sbvi_scaled: 72.8, pixel_count: 18, area_ha: 0.18, color: '#F08040'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[78.05,30.24],[78.10,30.24],[78.10,30.29],[78.05,30.29],[78.05,30.24]]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'fallback-very-high', name: 'Very High Risk Zone (cached)',
        risk: 'high', risk_label: 'Very High', sbvi_mean: 0.886,
        sbvi_scaled: 88.6, pixel_count: 24, area_ha: 0.24, color: '#F06060'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[78.02,30.22],[78.07,30.22],[78.07,30.27],[78.02,30.27],[78.02,30.22]]]
      }
    },
  ]
}

// Field reports (demo data — real reports come from /api/reports)
export const MOCK_REPORTS = [
  { id:'RPT-001', zone:'Thano',   lat:30.285, lng:78.11, status:'infected', confidence:91, time:'2h ago',  guard:'Ravi Singh',   synced:true },
  { id:'RPT-002', zone:'Asarori', lat:30.320, lng:78.05, status:'stressed', confidence:78, time:'5h ago',  guard:'Mohan Kumar',  synced:true },
  { id:'RPT-003', zone:'Jhajhra', lat:30.230, lng:78.00, status:'infected', confidence:88, time:'1d ago',  guard:'Deepak Rawat', synced:true },
  { id:'RPT-004', zone:'Kalsi',   lat:30.370, lng:77.89, status:'healthy',  confidence:94, time:'1d ago',  guard:'Suresh Negi',  synced:false },
  { id:'RPT-005', zone:'Thano',   lat:30.290, lng:78.12, status:'infected', confidence:85, time:'2d ago',  guard:'Ravi Singh',   synced:true },
]

// Real NDVI/NDMI values from her processed rasters
// Source: S2_BASELINE_NDVI, S2_PRE_STRESS_MAR_NDVI, S2_PEAK_DAMAGE_NDVI, S2_CURRENT_25_NDVI
export const NDVI_TIMESERIES = [
  { month:'Oct 23',  ndvi:0.647, ndmi:0.197, label:'Baseline' },
  { month:'Mar 24',  ndvi:0.535, ndmi:0.083, label:'Pre-Stress' },
  { month:'Oct 24',  ndvi:0.619, ndmi:0.195, label:'Peak Damage' },
  { month:'Jun 25',  ndvi:0.500, ndmi:0.064, label:'Current' },
]

// SBVI component weights (her formula)
export const SBVI_WEIGHTS = {
  ndvi_stress: 0.35,
  ndmi_stress: 0.35,
  nbr_stress:  0.20,
  sar_stress:  0.10,
}

// Real SBVI stats from SBVI_raw.tif
export const SBVI_STATS = {
  min:  0.114,
  max:  1.081,
  mean: 0.529,
  thresholds: {
    very_low: [0.00, 0.45],
    low:      [0.45, 0.58],
    moderate: [0.58, 0.68],
    high:     [0.68, 0.78],
    very_high:[0.78, 1.10],
  }
}

// ML model results (from actual training on her data)
export const MODEL_RESULTS = {
  rf_accuracy:       56.1,
  xgb_accuracy:      48.8,
  ensemble_accuracy: 51.2,
  training_samples:  123,
  top_features: ['ndmi_diff','ndmi_drop','ndvi_diff','ndvi_drop','nbr_baseline'],
  note: 'Low accuracy expected with 164 pseudo-labeled pixels — improves with real ground truth'
}
