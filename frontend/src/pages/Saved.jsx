import { useState, useEffect } from 'react'
import { Clock, CloudOff, Upload, Trash2, Download, CheckCircle, AlertTriangle, Leaf } from 'lucide-react'
import { getPendingReports, clearPendingReport, syncPendingReports, apiPost } from '../utils/api'
import { useOnlineStatus } from '../hooks/useGPS'
import { useToast } from '../hooks/useToast'

const STATUS_COLOR = {
  infected: 'var(--high)',
  stressed: 'var(--mod)',
  healthy:  'var(--low)',
}
const STATUS_ICON = { infected:'🚨', stressed:'⚠️', healthy:'🌿' }

export default function Saved() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const online = useOnlineStatus()
  const toast = useToast()

  const load = async () => {
    setLoading(true)
    try { setReports(await getPendingReports()) }
    catch { setReports([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const syncAll = async () => {
    setSyncing(true)
    try {
      const n = await syncPendingReports()
      toast(n > 0 ? `✓ Synced ${n} reports` : 'Nothing to sync', n>0?'success':'info')
      await load()
    } catch { toast('Sync failed — check connection', 'error') }
    finally { setSyncing(false) }
  }

  const deleteOne = async (localId) => {
    await clearPendingReport(localId)
    toast('Report deleted', 'info')
    await load()
  }

  const exportCSV = () => {
    if (!reports.length) return
    const rows = [
      ['ID','Status','Confidence','Lat','Lng','Severity','Notes','Saved At'],
      ...reports.map(r => [
        r.localId, r.status, r.confidence, r.lat||'', r.lng||'',
        r.severity||'', (r.notes||'').replace(/,/g,''), new Date(r.savedAt).toLocaleString()
      ])
    ]
    const csv = rows.map(r=>r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `sal-shield-reports-${Date.now()}.csv`
    a.click()
    toast('CSV downloaded', 'success')
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="page-eyebrow">Offline Storage</div>
        <h1 className="page-title">Saved Reports</h1>
        <p className="page-sub">Reports captured offline — stored in your browser, sync when online</p>
      </div>

      <div style={{padding:'16px 24px'}}>

        {/* Info box explaining where saves go */}
        <div style={{
          background:'var(--bg-card)', border:'1px solid var(--border-md)',
          borderRadius:'var(--r-lg)', padding:'16px 18px', marginBottom:18,
          display:'flex', gap:14, alignItems:'flex-start'
        }}>
          <div style={{
            width:36, height:36, borderRadius:'var(--r)',
            background:'var(--accent-dim)', display:'flex', alignItems:'center',
            justifyContent:'center', flexShrink:0, color:'var(--accent)'
          }}>
            <CloudOff size={18}/>
          </div>
          <div>
            <div style={{fontWeight:600, fontSize:13, color:'var(--text-primary)', marginBottom:4}}>
              Where are saves stored?
            </div>
            <div style={{fontSize:12, color:'var(--text-secondary)', lineHeight:1.7}}>
              Reports saved offline are stored in <strong style={{color:'var(--accent)'}}>your browser's IndexedDB</strong> — 
              a local database on this device. They stay here even if you close the app. 
              When you go online, tap <em>Sync All</em> to send them to the SAL-SHIELD server. 
              Exporting to CSV lets you keep a permanent copy on your phone/PC.
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div style={{display:'flex', gap:8, marginBottom:16, flexWrap:'wrap'}}>
          <button
            className="btn btn-primary"
            onClick={syncAll}
            disabled={!online || syncing || reports.length===0}
          >
            <Upload size={14}/>
            {syncing ? 'Syncing…' : `Sync All (${reports.length})`}
          </button>
          <button className="btn btn-ghost" onClick={exportCSV} disabled={reports.length===0}>
            <Download size={14}/> Export CSV
          </button>
          <div style={{marginLeft:'auto', fontSize:12, color:'var(--text-muted)', alignSelf:'center'}}>
            {reports.length === 0 ? 'No offline reports' : `${reports.length} report${reports.length>1?'s':''} pending`}
          </div>
        </div>

        {loading ? (
          <div style={{padding:40, textAlign:'center', color:'var(--text-muted)'}}>
            Loading…
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} style={{color:'var(--low)', opacity:1, marginBottom:12}}/>
            <div style={{fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:6}}>
              All clear
            </div>
            <div style={{fontSize:13}}>No offline reports saved. Go to the Report tab to capture field data.</div>
          </div>
        ) : (
          <div className="card">
            {reports.map((r, i) => (
              <div key={r.localId} className="offline-report-item">
                <span className={`sync-dot pending`}/>
                <div style={{fontSize:20, flexShrink:0}}>{STATUS_ICON[r.status]||'📋'}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:3}}>
                    <span style={{
                      fontSize:13, fontWeight:700,
                      color:STATUS_COLOR[r.status]||'var(--text-primary)',
                      textTransform:'capitalize'
                    }}>{r.status}</span>
                    {r.confidence && (
                      <span style={{fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>
                        {r.confidence}%
                      </span>
                    )}
                    <span style={{
                      padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700,
                      background:'var(--mod-dim)', color:'var(--mod)', border:'1px solid var(--mod-border)'
                    }}>PENDING SYNC</span>
                  </div>
                  <div style={{fontSize:11, color:'var(--text-secondary)', marginBottom:2}}>
                    {r.lat && r.lng
                      ? `📍 ${parseFloat(r.lat).toFixed(4)}°N, ${parseFloat(r.lng).toFixed(4)}°E`
                      : '📍 Location not captured'
                    }
                    {r.severity && <span style={{marginLeft:8, color:'var(--text-muted)'}}> · {r.severity} severity</span>}
                  </div>
                  {r.notes && (
                    <div style={{fontSize:11, color:'var(--text-muted)', fontStyle:'italic',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:220}}>
                      "{r.notes}"
                    </div>
                  )}
                  <div style={{fontSize:10, color:'var(--text-dim)', marginTop:3}}>
                    Saved {new Date(r.savedAt).toLocaleString()}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => deleteOne(r.localId)}
                  style={{flexShrink:0, color:'var(--high)', borderColor:'var(--high-border)'}}
                >
                  <Trash2 size={12}/>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* How offline works guide */}
        <div className="card" style={{marginTop:18}}>
          <div className="card-header">
            <div className="card-title"><Leaf size={15}/>How Offline Mode Works</div>
          </div>
          <div style={{padding:'8px 18px'}}>
            {[
              { step:1, title:'Capture in forest', desc:'Take a photo of a tree. The AI analyses it using the demo model. GPS is auto-captured if available.' },
              { step:2, title:'Saved to browser', desc:'If offline (or backend down), your report saves to IndexedDB — a database inside your phone browser. Nothing is lost.' },
              { step:3, title:'Auto-syncs', desc:'The moment you get internet signal, SAL-SHIELD automatically syncs all pending reports to the server in the background.' },
              { step:4, title:'Or sync manually', desc:'Come back to this page and tap "Sync All" anytime. Export to CSV to keep a permanent copy regardless of server.' },
            ].map(g => (
              <div key={g.step} className="guide-item">
                <div className="guide-num">{g.step}</div>
                <div>
                  <div style={{fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:3}}>{g.title}</div>
                  <div style={{fontSize:12, color:'var(--text-secondary)', lineHeight:1.6}}>{g.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
