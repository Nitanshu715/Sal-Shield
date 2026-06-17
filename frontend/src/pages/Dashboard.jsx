import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Layers, Navigation, Activity, AlertTriangle, TrendingDown, Bell, RefreshCw } from 'lucide-react'
import { STUDY_CENTER, STUDY_BOUNDS, MOCK_REPORTS, NDVI_TIMESERIES, FALLBACK_ZONES } from '../data/forestData'
import { apiGet } from '../utils/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_COLOR = { infected:'#F06060', stressed:'#F0C040', healthy:'#52C778' }

const reportIcon = (s) => L.divIcon({
  className:'',
  html:`<div style="width:11px;height:11px;border-radius:50%;background:${STATUS_COLOR[s]};border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 6px ${STATUS_COLOR[s]}88"></div>`,
  iconSize:[11,11], iconAnchor:[5,5]
})

// SBVI risk color by risk label from GeoJSON
const zoneColor = (riskLabel) => {
  const map = {
    'Very High': '#F06060',
    'High':      '#F08040',
    'Moderate':  '#F0C040',
    'Low':       '#A8D870',
    'Very Low':  '#52C778',
  }
  return map[riskLabel] || '#97BC62'
}

function RecenterControl() {
  const map = useMap()
  return (
    <button onClick={() => map.fitBounds(STUDY_BOUNDS)} style={{
      position:'absolute', bottom:10, right:10, zIndex:999,
      background:'rgba(20,46,30,0.92)', backdropFilter:'blur(8px)',
      border:'1px solid rgba(143,191,90,0.3)', color:'var(--accent)',
      borderRadius:8, padding:'7px 10px', cursor:'pointer',
      display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600
    }}>
      <Navigation size={13}/> Fit Zones
    </button>
  )
}

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
      <div style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color:p.color }}>{p.name}: <strong>{typeof p.value==='number'?p.value.toFixed(3):p.value}</strong></div>)}
    </div>
  )
}

export default function Dashboard() {
  const [zones, setZones] = useState(null)
  const [zonesLoading, setZonesLoading] = useState(true)
  const [active, setActive] = useState(['Very High','High','Moderate','Low','Very Low'])
  const [showReports, setShowReports] = useState(true)
  const [selected, setSelected] = useState(null)
  const [stats, setStats] = useState(null)

  // Fetch real GeoJSON from backend
  useEffect(() => {
    apiGet('/risk-zones')
      .then(data => { setZones(data); setZonesLoading(false) })
      .catch(() => { setZones(FALLBACK_ZONES); setZonesLoading(false) })
  }, [])

  useEffect(() => {
    apiGet('/stats')
      .then(setStats)
      .catch(() => {})
  }, [])

  const toggle = (r) => setActive(a => a.includes(r) ? a.filter(x=>x!==r) : [...a,r])

  const zoneStyle = (f) => {
    const label = f.properties.risk_label
    const on = active.includes(label)
    const color = zoneColor(label)
    return {
      fillColor: color,
      fillOpacity: on ? 0.38 : 0,
      color: color,
      weight: on ? 1.5 : 0,
      opacity: on ? 0.8 : 0
    }
  }

  const onEach = (f, layer) => {
    const p = f.properties
    layer.on({
      click: () => setSelected(p),
      mouseover: e => e.target.setStyle({ fillOpacity:0.6, weight:2.5 }),
      mouseout: e => e.target.setStyle(zoneStyle(f))
    })
    layer.bindTooltip(
      `<strong>${p.name}</strong><br/>SBVI: ${p.sbvi_mean} · ${p.risk_label}`,
      { direction:'top', sticky:true }
    )
  }

  const displayStats = {
    trees:  stats?.trees_at_risk || 19170,
    sbvi:   stats ? (stats.avg_sbvi || 52.9).toFixed(1) : '52.9',
    reports:stats?.total_reports || MOCK_REPORTS.length,
    acc:    stats?.model_accuracy || 56.1,
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="page-eyebrow">Forest Intelligence · Real Satellite Data</div>
        <h1 className="page-title">SAL-SHIELD Dashboard</h1>
        <p className="page-sub">
          SBVI derived from Sentinel-2 multitemporal analysis · Dehradun Forest Division
          {zonesLoading && <span style={{color:'var(--accent)',marginLeft:8}}>Loading zones…</span>}
        </p>
      </div>

      <div className="stats-grid">
        {[
          { label:'Trees at Risk',    value:`${displayStats.trees.toLocaleString()}+`, cls:'danger', delta:'Dehradun Division 2025' },
          { label:'Avg SBVI Score',   value:displayStats.sbvi,                         cls:'warn',   delta:'Study area mean (0–1 scale)' },
          { label:'Field Reports',    value:displayStats.reports,                       cls:'accent', delta:'Submitted by guards' },
          { label:'RF Model Acc.',    value:`${displayStats.acc}%`,                    cls:'warn',   delta:'123 training samples' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.cls}`}>{s.value}</div>
            <div className="stat-delta">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        {/* Map */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Layers size={15}/>SBVI Risk Map</div>
            <span className="card-subtitle">Sentinel-2 · 5-class SBVI thresholds</span>
          </div>
          <div className="layer-pills">
            {['Very High','High','Moderate','Low','Very Low'].map(r => {
              const color = zoneColor(r)
              const on = active.includes(r)
              return (
                <button key={r}
                  className="pill"
                  style={on ? {
                    background:`${color}22`, color, borderColor:`${color}66`
                  } : {}}
                  onClick={()=>toggle(r)}
                >{r}</button>
              )
            })}
            <button className={`pill${showReports?' on-report':''}`} onClick={()=>setShowReports(v=>!v)}>
              Field Reports
            </button>
          </div>

          <div className="map-wrap" style={{ position:'relative' }}>
            {zonesLoading && (
              <div style={{
                position:'absolute', inset:0, zIndex:998,
                background:'rgba(10,31,20,0.7)', display:'flex',
                alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10
              }}>
                <RefreshCw size={24} style={{color:'var(--accent)',animation:'spin 1s linear infinite'}}/>
                <span style={{color:'var(--text-secondary)',fontSize:13}}>Loading SBVI zones…</span>
              </div>
            )}
            <MapContainer
              center={STUDY_CENTER} zoom={11}
              style={{ height:'100%', width:'100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="© CARTO" maxZoom={19}
              />
              {zones && (
                <GeoJSON
                  key={JSON.stringify(active)}
                  data={zones}
                  style={zoneStyle}
                  onEachFeature={onEach}
                />
              )}
              {showReports && MOCK_REPORTS.map(r => (
                <Marker key={r.id} position={[r.lat,r.lng]} icon={reportIcon(r.status)}>
                  <Popup>
                    <div style={{fontSize:12}}>
                      <strong style={{color:'var(--text-primary)'}}>{r.id}</strong><br/>
                      <span style={{color:'var(--text-muted)'}}>{r.zone} · {r.guard} · {r.time}</span><br/>
                      <span style={{color:STATUS_COLOR[r.status],fontWeight:700,textTransform:'capitalize'}}>{r.status}</span>
                      <span style={{color:'var(--text-muted)'}}> — {r.confidence}% conf</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
              <RecenterControl/>
            </MapContainer>
          </div>

          {/* NDVI chart */}
          <div style={{padding:'12px 18px', borderTop:'1px solid var(--border)'}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
              <TrendingDown size={12} style={{color:'var(--high)'}}/> 
              NDVI decline · Real Sentinel-2 values · Oct 2023 → Jun 2025
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={NDVI_TIMESERIES} margin={{top:15,right:15,left:15,bottom:15}}>
                <defs>
                  <linearGradient id="ndvig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52C778" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#52C778" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ndmig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6BA8D0" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6BA8D0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="ndvi" stroke="#52C778" fill="url(#ndvig)" strokeWidth={2} dot={{r:3}} name="NDVI"/>
                <Area type="monotone" dataKey="ndmi" stroke="#6BA8D0" fill="url(#ndmig)" strokeWidth={2} dot={{r:3}} name="NDMI"/>
                <XAxis dataKey="month" tick={{fontSize:10}}/>
                <YAxis domain={[-0.1,0.8]} tick={{fontSize:10}} stroke="var(--text-muted)"/>
                <Tooltip content={<TT/>}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side panel */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* SBVI breakdown */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Activity size={15}/>SBVI Formula</div>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>Mean: 0.529</span>
            </div>
            <div className="card-body">
              <div style={{
                background:'var(--bg-elevated)', borderRadius:'var(--r)',
                padding:'8px 12px', fontSize:11, fontFamily:'var(--font-mono)',
                color:'var(--accent)', marginBottom:14, lineHeight:1.8
              }}>
                (NDVI_stress × 0.35)<br/>
                + (NDMI_stress × 0.35)<br/>
                + (NBR_stress × 0.20)<br/>
                + (SAR_stress × 0.10)
              </div>
              {[
                {l:'NDVI stress',  v:35, c:'var(--high)',   note:'0.647→0.500'},
                {l:'NDMI stress',  v:35, c:'var(--high)',   note:'0.197→0.064'},
                {l:'NBR stress',   v:20, c:'var(--mod)',    note:'Burn ratio'},
                {l:'SAR stress',   v:10, c:'var(--accent)', note:'Weight'},
              ].map(b => (
                <div key={b.l} style={{marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span style={{fontSize:11,color:'var(--text-secondary)'}}>{b.l}</span>
                    <span style={{fontSize:10,color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{b.note}</span>
                  </div>
                  <div className="sbvi-track">
                    <div className="sbvi-fill" style={{width:`${b.v*2.8}%`,background:b.c}}/>
                  </div>
                </div>
              ))}
              <div style={{
                marginTop:12, padding:'8px 10px',
                background:'var(--low-dim)', border:'1px solid var(--low-border)',
                borderRadius:'var(--r)', fontSize:11, color:'var(--low)'
              }}>
                ✓ NDMI diff is top predictor (importance: 0.133)
              </div>
            </div>
          </div>

          {/* Risk zones list */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><AlertTriangle size={15}/>Risk Zones</div>
              <span className="card-subtitle">{zones?.features?.length || 0} zones detected</span>
            </div>
            <div style={{padding:'0 18px'}}>
              {(zones?.features || []).map((f,i) => {
                const p = f.properties
                const color = zoneColor(p.risk_label)
                return (
                  <div key={i} className="zone-item" onClick={()=>setSelected(p)}>
                    <span style={{
                      width:9,height:9,borderRadius:'50%',flexShrink:0,
                      background:color,boxShadow:`0 0 5px ${color}`
                    }}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{p.name}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:1}}>
                        SBVI {p.sbvi_mean} · {p.pixel_count} px · {p.area_ha} ha
                      </div>
                    </div>
                    <span style={{
                      padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700,
                      background:`${color}22`,color,border:`1px solid ${color}44`
                    }}>{p.risk_label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active alerts */}
          <div className="card" style={{borderColor:'var(--high-border)'}}>
            <div className="card-header" style={{borderBottomColor:'var(--high-border)'}}>
              <div className="card-title" style={{color:'var(--high)'}}>
                <Bell size={15} style={{color:'var(--high)'}}/>Active Alerts
              </div>
              <span style={{padding:'2px 8px',background:'var(--high-dim)',border:'1px solid var(--high-border)',borderRadius:20,fontSize:10,fontWeight:700,color:'var(--high)'}}>
                2 CRITICAL
              </span>
            </div>
            <div style={{padding:'8px 18px'}}>
              {[
                {zone:'Very High Zone', msg:'SBVI 0.886 — above critical threshold 0.78', time:'Current'},
                {zone:'High Zone',      msg:'SBVI 0.728 — FRI intervention recommended',  time:'Current'},
                {zone:'Moderate Zone',  msg:'SBVI 0.627 — monitoring priority, watch NDMI',time:'Current'},
              ].map((a,i) => (
                <div key={i} style={{padding:'9px 0',borderBottom:i<2?'1px solid var(--border)':'none',display:'flex',gap:10}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:i<2?'var(--high)':'var(--mod)',marginTop:5,flexShrink:0,boxShadow:`0 0 5px ${i<2?'var(--high)':'var(--mod)'}`}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:2}}>{a.zone}</div>
                    <div style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.5}}>{a.msg}</div>
                    <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Zone detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
              <div>
                <div style={{fontSize:18,fontWeight:700}}>{selected.name}</div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>
                  {selected.data_source || 'SAL-SHIELD SBVI Model'}
                </div>
              </div>
              <span style={{
                padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,
                background:`${zoneColor(selected.risk_label)}22`,
                color:zoneColor(selected.risk_label),
                border:`1px solid ${zoneColor(selected.risk_label)}44`
              }}>{selected.risk_label}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18}}>
              {[
                {l:'SBVI Mean',      v:selected.sbvi_mean, hi:selected.sbvi_mean>0.68},
                {l:'SBVI (0-100)',   v:selected.sbvi_scaled},
                {l:'Risk Class',     v:selected.risk_label},
                {l:'Pixel Count',    v:selected.pixel_count},
                {l:'Area (ha)',      v:selected.area_ha},
                {l:'Formula',        v:'Sentinel-2 derived'},
              ].map(item => (
                <div key={item.l} style={{background:'var(--bg-card)',borderRadius:10,padding:12}}>
                  <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.7px',marginBottom:4}}>{item.l}</div>
                  <div style={{fontSize:16,fontWeight:700,color:item.hi?'var(--high)':'var(--text-primary)'}}>{item.v}</div>
                </div>
              ))}
            </div>
            {selected.formula && (
              <div style={{
                padding:'8px 12px',background:'var(--bg-card)',borderRadius:'var(--r)',
                fontSize:11,fontFamily:'var(--font-mono)',color:'var(--accent)',marginBottom:14
              }}>{selected.formula}</div>
            )}
            <button className="btn btn-ghost btn-full" onClick={()=>setSelected(null)}>Close</button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
