// API base URL — auto-switches between dev and prod
export const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Robust fetch with timeout — won't hang forever
async function fetchWithTimeout(url, options = {}, timeout = 6000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

export async function apiPost(endpoint, body) {
  const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, { method: 'POST', body })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export async function apiGet(endpoint) {
  const res = await fetchWithTimeout(`${API_BASE}${endpoint}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// ─── MOCK AI — Demo mode until real model is connected ───────────────────
// Real model will be a trained CNN (MobileNetV2/EfficientNet) from teammate
// This just demonstrates the full UI flow with labelled demo results
export async function mockPredictImage(file) {
  return new Promise((resolve) => {
    // Use file size as a seed so same photo gives same result (feels consistent)
    const seed = file.size % 3
    const classes = ['healthy', 'stressed', 'infected']
    const label = classes[seed]
    const confidence = Math.round(72 + (file.size % 23))

    // Simulate model processing time
    setTimeout(() => resolve({
      label,
      confidence,
      probabilities: {
        healthy:  label === 'healthy'  ? confidence/100 : parseFloat((0.05 + Math.random()*0.15).toFixed(2)),
        stressed: label === 'stressed' ? confidence/100 : parseFloat((0.05 + Math.random()*0.15).toFixed(2)),
        infected: label === 'infected' ? confidence/100 : parseFloat((0.05 + Math.random()*0.15).toFixed(2)),
      },
      source: 'demo-mode',
      note: 'Demo result — real CNN model will be connected once trained'
    }), 1800)
  })
}

// ─── IndexedDB for offline queue ──────────────────────────────────────────
const DB_NAME = 'sal-shield-offline'
const STORE = 'pending-reports'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(STORE, { keyPath: 'localId', autoIncrement: true })
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveOfflineReport(report) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).add({ ...report, savedAt: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPendingReports() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function clearPendingReport(localId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(localId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function syncPendingReports(onProgress) {
  const pending = await getPendingReports()
  let synced = 0
  for (const report of pending) {
    try {
      const fd = new FormData()
      Object.entries(report).forEach(([k, v]) => {
        if (k !== 'localId' && v !== null && v !== undefined) fd.append(k, v)
      })
      await apiPost('/field-report', fd)
      await clearPendingReport(report.localId)
      synced++
      if (onProgress) onProgress(synced, pending.length)
    } catch { /* keep in queue */ }
  }
  return synced
}
