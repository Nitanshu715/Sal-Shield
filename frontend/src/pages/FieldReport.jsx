import { useState, useRef } from 'react'
import { Camera, MapPin, Send, RefreshCw, CheckCircle, Leaf, Lock, Info, Smartphone } from 'lucide-react'
import { useGPS, useOnlineStatus } from '../hooks/useGPS'
import { useToast } from '../hooks/useToast'
import { apiPost, mockPredictImage, saveOfflineReport } from '../utils/api'

const CLASS = {
  healthy:     { emoji:'🌿', label:'Healthy',     color:'var(--low)',  advice:'Tree appears healthy. No immediate action needed. Continue periodic seasonal monitoring.' },
  stressed:    { emoji:'⚠️', label:'Stressed',    color:'var(--mod)',  advice:'Early foliar stress detected. Inspect trunk within 2 weeks for resin leakage or initial borer entry holes.' },
  infected:    { emoji:'🚨', label:'Infected',    color:'var(--high)', advice:'High probability of active Sal Heartwood Borer (Hoplocerambyx spinicornis) infestation. Flag for FRI assessment immediately.' },
  non_foliage: { emoji:'🚫', label:'Not a Tree',  color:'#f06060',     advice:'Non-botanical image detected (document, certificate, or screen capture). Please photograph an actual tree trunk, bark, or canopy.' },
}

function GPSBlock({ location, loading, permissionState, refresh }) {
  const isOk = location && !location.isFallback
  const cls = isOk ? 'ok' : location ? 'warn' : 'error'
  const dotColor = isOk ? 'var(--low)' : location ? 'var(--mod)' : 'var(--high)'

  return (
    <div className={`gps-widget ${cls}`}>
      <div className="gps-icon" style={{ color: dotColor }}>
        {permissionState === 'https-required' ? <Lock size={17}/> : <MapPin size={17}/>}
      </div>
      <div style={{ flex:1 }}>
        {loading ? (
          <div style={{fontSize:13, color:'var(--text-muted)'}}>Getting location…</div>
        ) : location ? (
          <>
            <div style={{fontSize:13, fontWeight:600, color:'var(--text-primary)'}}>
              {location.isFallback ? 'Study Area Center (fallback)' : '✓ Location acquired'}
            </div>
            <div style={{fontSize:11, fontFamily:'var(--font-mono)', color:'var(--accent)', marginTop:2}}>
              {location.lat.toFixed(5)}°N, {location.lng.toFixed(5)}°E
              {location.accuracy && <span style={{color:'var(--text-muted)'}}> ±{Math.round(location.accuracy)}m</span>}
            </div>
            {location.isFallback && (
              <div style={{fontSize:10, color:'var(--mod)', marginTop:3}}>
                {permissionState === 'https-required'
                  ? '⚠ GPS needs HTTPS — deploy to Vercel for real GPS on phone'
                  : '⚠ GPS unavailable — using study area center'}
              </div>
            )}
          </>
        ) : (
          <div style={{fontSize:13, color:'var(--high)'}}>Location unavailable</div>
        )}
      </div>
      <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}>
        <RefreshCw size={12} style={loading?{animation:'spin 1s linear infinite'}:{}}/>
      </button>
    </div>
  )
}

export default function FieldReport() {
  const [image, setImage] = useState(null)
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [notes, setNotes] = useState('')
  const [severity, setSeverity] = useState('moderate')
  const inputRef = useRef()
  const gps = useGPS()
  const online = useOnlineStatus()
  const toast = useToast()

  const pick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setResult(null); setDone(false)
    const r = new FileReader()
    r.onload = ev => setImage(ev.target.result)
    r.readAsDataURL(f)
    e.target.value = ''
  }

  const analyse = async () => {
    setLoading(true); setResult(null)
    try {
      let data
      try {
        const fd = new FormData(); fd.append('image', file)
        data = await apiPost('/predict/image', fd)
      } catch {
        data = await mockPredictImage(file)
        if (data.source === 'demo-mode') toast('Demo model active — real model coming soon', 'info')
      }
      setResult(data)
    } catch { toast('Analysis failed', 'error') }
    finally { setLoading(false) }
  }

  const save = async () => {
    setSaving(true)
    const report = {
      status: result.label, confidence: result.confidence,
      lat: gps.location?.lat, lng: gps.location?.lng,
      notes, severity, timestamp: new Date().toISOString(),
    }
    try {
      if (online) {
        try {
          const fd = new FormData()
          Object.entries(report).forEach(([k,v]) => v!==undefined && fd.append(k,v))
          if (file) fd.append('image', file)
          await apiPost('/field-report', fd)
          toast('✓ Report submitted to dashboard', 'success')
        } catch {
          await saveOfflineReport({ ...report, imageDataUrl: image })
          toast('Saved offline — check Saved tab to sync', 'warn')
        }
      } else {
        await saveOfflineReport({ ...report, imageDataUrl: image })
        toast('Saved offline — check Saved tab to sync', 'warn')
      }
      setDone(true)
    } catch { toast('Save failed', 'error') }
    finally { setSaving(false) }
  }

  const reset = () => {
    setImage(null); setFile(null); setResult(null)
    setDone(false); setNotes(''); setSeverity('moderate')
  }

  const info = result ? CLASS[result.label] : null

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="page-eyebrow">PWA Field Tool</div>
        <h1 className="page-title">Tree Health Report</h1>
        <p className="page-sub">Photograph a tree — AI classifies its health instantly</p>
      </div>

      <div className="field-page">
        <div className="field-grid">
          {/* Left Column: GPS & Capture Area */}
          <div className="field-col-capture">
            <GPSBlock {...gps} />

            {!done ? (
              <div className="field-card-panel">
                <div className={`camera-zone${image ? ' has-image' : ''}`} onClick={() => !image && inputRef.current?.click()}>
                  {image ? (
                    <div className="camera-preview-wrap">
                      <img src={image} alt="Sal Tree Preview" className="camera-preview" />
                      <div className="preview-badge" style={result?.label === 'non_foliage' ? {borderColor:'rgba(240,96,96,0.6)', color:'#f06060'} : {}}>
                        <Leaf size={12} /> {result?.label === 'non_foliage' ? 'Non-Botanical Image' : 'Tree Specimen'}
                      </div>
                    </div>
                  ) : (
                    <div className="camera-empty-state">
                      <div className="camera-icon-ring"><Camera size={28}/></div>
                      <div className="camera-prompt-title">
                        Take or Upload Tree Photo
                      </div>
                      <div className="camera-prompt-sub">
                        High-resolution bark, canopy, or trunk photo
                      </div>
                      <div className="camera-status-pill">
                        <Smartphone size={12}/> Instant Mobile & Desktop AI
                      </div>
                    </div>
                  )}
                  <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={pick} style={{display:'none'}}/>
                </div>

                {image && !result && !loading && (
                  <div className="field-action-bar">
                    <button className="btn btn-ghost btn-action" onClick={reset}>
                      <RefreshCw size={14}/> Retake Photo
                    </button>
                    <button className="btn btn-primary btn-action" onClick={analyse}>
                      <Leaf size={15}/> Analyse Tree Health
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Right Column: AI Analysis & Diagnosis Report */}
          <div className="field-col-result">
            {!done ? (
              <>
                {loading && (
                  <div className="analysis-loading-card">
                    <div className="analysis-spinner-wrap">
                      <RefreshCw size={26} style={{animation:'spin 1s linear infinite'}}/>
                    </div>
                    <div style={{fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:4}}>
                      Analysing Tree Specimen…
                    </div>
                    <div style={{fontSize:12.5, color:'var(--text-muted)'}}>
                      Deep learning CNN evaluating vegetative stress & Sal borer symptoms
                    </div>
                  </div>
                )}

                {result && info && !loading && (
                  <div className="result-box" style={{border:`1px solid ${info.color}55`}}>
                    {/* Header */}
                    <div className="result-header">
                      <div className="result-emoji" style={{background:`${info.color}18`, border:`2px solid ${info.color}44`}}>
                        {info.emoji}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:22, fontWeight:700, color:info.color, letterSpacing:'-0.3px'}}>{info.label}</div>
                        <div style={{fontSize:11.5, color:'var(--text-muted)'}}>AI Diagnostic Classification</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:28, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-mono)', lineHeight:1}}>
                          {result.confidence}%
                        </div>
                        <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-muted)', marginTop:2}}>confidence</div>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div className="conf-bar">
                      <div className="conf-fill" style={{width:`${result.confidence}%`, background:info.color}}/>
                    </div>

                    {/* Multi-class probability breakdown - only show for botanical foliage */}
                    {result.label !== 'non_foliage' && result.probabilities && (
                      <div className="prob-container">
                        <div className="prob-heading">
                          Class Probability Distribution · {result.model || 'CNN MobileNetV2'}
                        </div>
                        {[
                          { key: 'healthy', label: 'Healthy Canopy', color: 'var(--low)', val: result.probabilities.healthy || 0 },
                          { key: 'stressed', label: 'Vegetative Stress', color: 'var(--mod)', val: result.probabilities.stressed || 0 },
                          { key: 'infected', label: 'Sal Borer Infested', color: 'var(--high)', val: result.probabilities.infected || 0 },
                        ].map(c => (
                          <div key={c.key} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: c.color }}>{c.val}%</span>
                            </div>
                            <div style={{ height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, c.val)}%`, height: '100%', background: c.color, borderRadius: 3, transition: 'width 0.6s var(--ease)' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Advice */}
                    <div className="result-advice" style={{borderLeft:`3px solid ${info.color}`}}>
                      {info.advice}
                    </div>

                    {/* Form or Non-Tree Warning */}
                    {result.label === 'non_foliage' ? (
                      <div style={{ padding: '0 20px 20px', textAlign: 'center' }}>
                        <div style={{
                          background: 'rgba(240, 96, 96, 0.10)',
                          border: '1px solid rgba(240, 96, 96, 0.35)',
                          borderRadius: 'var(--r-lg)',
                          padding: '16px',
                          marginBottom: '16px',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          lineHeight: 1.6
                        }}>
                          <div style={{ color: '#f06060', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                            ⚠ Specimen Verification Failed
                          </div>
                          The system detected a document, certificate, or non-botanical graphic instead of a tree. Please capture a real Sal tree trunk, canopy, or bark sample to perform diagnosis.
                        </div>
                        <button className="btn btn-primary btn-action btn-full" onClick={reset}>
                          <Camera size={15}/> Retake Tree Photo
                        </button>
                      </div>
                    ) : (
                      <div className="result-form">
                        <div className="form-group">
                          <label className="form-label">Severity Assessment</label>
                          <select className="form-select" value={severity} onChange={e=>setSeverity(e.target.value)}>
                            <option value="low">Low — isolated, no spread</option>
                            <option value="moderate">Moderate — small cluster</option>
                            <option value="high">High — wide area affected</option>
                            <option value="critical">Critical — immediate action</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Field Notes</label>
                          <textarea className="form-textarea"
                            rows={3}
                            placeholder="Bark exit holes, resin extrusion, crown wilting, or adjacent infected trees…"
                            value={notes} onChange={e=>setNotes(e.target.value)}
                          />
                        </div>
                        <div className="field-action-bar">
                          <button className="btn btn-ghost btn-action" onClick={reset}>
                            <RefreshCw size={14}/> Reset
                          </button>
                          <button className="btn btn-primary btn-action" onClick={save} disabled={saving}>
                            {saving
                              ? <><RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/> Saving Report…</>
                              : <><Send size={14}/> {online ? 'Submit Report' : 'Save Offline'}</>
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State before photo */}
                {!image && !loading && !result && (
                  <div className="field-idle-card">
                    <div className="idle-icon-wrap">
                      <Leaf size={24} style={{color:'var(--accent)'}}/>
                    </div>
                    <div style={{fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:6}}>
                      Awaiting Tree Specimen
                    </div>
                    <div style={{fontSize:12.5, color:'var(--text-muted)', lineHeight:1.6, maxWidth:360, margin:'0 auto'}}>
                      Capture or select a photo on the left. The neural network will immediately analyze bark features and canopy reflectance to detect Sal Heartwood Borer stress.
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="success-state">
                <CheckCircle size={52} style={{color:'var(--low)', marginBottom:14}}/>
                <div style={{fontSize:22, fontWeight:700, marginBottom:6, color:'var(--text-primary)'}}>
                  {online ? 'Report Submitted' : 'Saved for Sync'}
                </div>
                <div style={{fontSize:13, color:'var(--text-muted)', marginBottom:12, lineHeight:1.7}}>
                  {online
                    ? 'Synced to the SAL-SHIELD central monitoring dashboard successfully.'
                    : 'Stored securely in your local browser cache. Navigate to Saved tab to sync when connected.'
                  }
                </div>
                {gps.location && (
                  <div style={{fontSize:12, fontFamily:'var(--font-mono)', color:'var(--accent)', marginBottom:22, background:'var(--bg-elevated)', padding:'6px 14px', borderRadius:20, display:'inline-block'}}>
                    📍 {gps.location.lat.toFixed(5)}°N, {gps.location.lng.toFixed(5)}°E
                  </div>
                )}
                <div>
                  <button className="btn btn-primary btn-lg" onClick={reset} style={{minWidth:220}}>
                    <Camera size={16}/> Report Another Tree
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
