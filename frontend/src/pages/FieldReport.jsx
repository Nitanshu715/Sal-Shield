import { useState, useRef } from 'react'
import { Camera, MapPin, Send, RefreshCw, CheckCircle, Leaf, Lock, Info, Smartphone } from 'lucide-react'
import { useGPS, useOnlineStatus } from '../hooks/useGPS'
import { useToast } from '../hooks/useToast'
import { apiPost, mockPredictImage, saveOfflineReport } from '../utils/api'

const CLASS = {
  healthy:  { emoji:'🌿', label:'Healthy',  color:'var(--low)',  advice:'Tree appears healthy. No immediate action. Continue periodic monitoring.' },
  stressed: { emoji:'⚠️', label:'Stressed', color:'var(--mod)',  advice:'Early stress detected. Inspect for bark entry holes within 2 weeks. Adjacent trees may show similar signs.' },
  infected: { emoji:'🚨', label:'Infected', color:'var(--high)', advice:'High probability of active Sal borer infestation. Flag for FRI assessment immediately. Check 20m radius for spread.' },
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
        <GPSBlock {...gps} />

        {!done ? (
          <>
            {/* Camera zone */}
            <div className={`camera-zone${image?' has-image':''}`} onClick={()=>!image&&inputRef.current?.click()}>
              {image
                ? <img src={image} alt="Tree" className="camera-preview"/>
                : <>
                    <div className="camera-icon-ring"><Camera size={26}/></div>
                    <div style={{fontWeight:600, color:'var(--text-primary)', fontSize:15, marginBottom:4}}>
                      Tap to photograph tree
                    </div>
                    <div style={{fontSize:12, color:'var(--text-muted)'}}>
                      Opens camera on phone · or pick from gallery
                    </div>
                    <div style={{
                      marginTop:14, display:'inline-flex', alignItems:'center', gap:5,
                      padding:'5px 12px', background:'var(--accent-dim)',
                      border:'1px solid var(--border-md)', borderRadius:20,
                      fontSize:11, color:'var(--text-secondary)'
                    }}>
                      <Smartphone size={11}/> Works offline too
                    </div>
                  </>
              }
              <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={pick} style={{display:'none'}}/>
            </div>

            {image && !result && !loading && (
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button className="btn btn-ghost" onClick={reset}>Retake</button>
                <button className="btn btn-primary" style={{flex:1}} onClick={analyse}>
                  <Leaf size={14}/> Analyse Tree
                </button>
              </div>
            )}

            {loading && (
              <div style={{
                background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:'var(--r-lg)', padding:'28px 20px',
                textAlign:'center', marginTop:12
              }}>
                <div style={{
                  width:48, height:48, borderRadius:'50%',
                  background:'var(--accent-dim)', display:'flex',
                  alignItems:'center', justifyContent:'center',
                  margin:'0 auto 12px', color:'var(--accent)'
                }}>
                  <RefreshCw size={22} style={{animation:'spin 1s linear infinite'}}/>
                </div>
                <div style={{fontWeight:600, color:'var(--text-primary)', marginBottom:3}}>Analysing…</div>
                <div style={{fontSize:12, color:'var(--text-muted)'}}>Running vegetation stress model</div>
              </div>
            )}

            {result && info && !loading && (
              <div className="result-box" style={{border:`1px solid ${info.color}44`}}>
                {/* Header */}
                <div className="result-header">
                  <div className="result-emoji" style={{background:`${info.color}18`,border:`2px solid ${info.color}44`}}>
                    {info.emoji}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:22,fontWeight:700,color:info.color}}>{info.label}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)'}}>AI Tree Classification</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:28,fontWeight:700,color:'var(--text-primary)',fontFamily:'var(--font-mono)',lineHeight:1}}>
                      {result.confidence}%
                    </div>
                    <div style={{fontSize:10,color:'var(--text-muted)'}}>confidence</div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="conf-bar">
                  <div className="conf-fill" style={{width:`${result.confidence}%`,background:info.color}}/>
                </div>

                {/* Demo notice */}
                {result.source==='demo-mode' && (
                  <div style={{
                    margin:'0 18px 12px', padding:'8px 12px',
                    background:'var(--mod-dim)', border:'1px solid var(--mod-border)',
                    borderRadius:'var(--r)', fontSize:11, color:'var(--mod)',
                    display:'flex', gap:6, alignItems:'center'
                  }}>
                    <Info size={11} style={{flexShrink:0}}/>
                    Demo model — result is illustrative. Real CNN model plugs in via backend/models/
                  </div>
                )}

                {/* Advice */}
                <div className="result-advice" style={{borderLeft:`3px solid ${info.color}`}}>
                  {info.advice}
                </div>

                {/* Form */}
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
                      placeholder="Exit holes in bark, sawdust at base, adjacent trees affected…"
                      value={notes} onChange={e=>setNotes(e.target.value)}
                    />
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-ghost" onClick={reset}>New</button>
                    <button className="btn btn-primary" style={{flex:1}} onClick={save} disabled={saving}>
                      {saving
                        ? <><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Saving…</>
                        : <><Send size={13}/>{online?'Submit':'Save Offline'}</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="success-state">
            <CheckCircle size={48} style={{color:'var(--low)',marginBottom:14}}/>
            <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>
              {online?'Report Submitted':'Saved for Sync'}
            </div>
            <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:8,lineHeight:1.7}}>
              {online
                ? 'Sent to the SAL-SHIELD dashboard successfully.'
                : 'Stored in your browser. Go to the Saved tab to sync when online or export to CSV.'
              }
            </div>
            {gps.location && (
              <div style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--accent)',marginBottom:20}}>
                📍 {gps.location.lat.toFixed(4)}°N, {gps.location.lng.toFixed(4)}°E
              </div>
            )}
            <button className="btn btn-primary btn-full btn-lg" onClick={reset}>
              <Camera size={16}/> Report Another Tree
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
