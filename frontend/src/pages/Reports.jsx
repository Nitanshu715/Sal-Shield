import { useState } from 'react'
import { List, Filter, CloudOff, CheckCircle, Clock } from 'lucide-react'
import { MOCK_REPORTS } from '../data/forestData'

export default function Reports() {
  const [filter, setFilter] = useState('all')
  const [reports] = useState(MOCK_REPORTS)

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  const statusStyle = {
    infected: { color: 'var(--risk-high)', bg: 'var(--risk-high-bg)', border: 'rgba(224,82,82,0.3)' },
    stressed: { color: 'var(--risk-moderate)', bg: 'var(--risk-moderate-bg)', border: 'rgba(232,184,75,0.3)' },
    healthy: { color: 'var(--risk-low)', bg: 'var(--risk-low-bg)', border: 'rgba(76,175,80,0.3)' },
  }

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Field Intelligence</div>
        <h1 className="page-title">Field Reports</h1>
        <p className="page-subtitle">Submitted by forest guards — AI-classified tree assessments</p>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Infected', count: reports.filter(r => r.status === 'infected').length, color: 'var(--risk-high)' },
            { label: 'Stressed', count: reports.filter(r => r.status === 'stressed').length, color: 'var(--risk-moderate)' },
            { label: 'Healthy', count: reports.filter(r => r.status === 'healthy').length, color: 'var(--risk-low)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 16, cursor: 'pointer', borderColor: filter === s.label.toLowerCase() ? s.color : undefined }}
              onClick={() => setFilter(f => f === s.label.toLowerCase() ? 'all' : s.label.toLowerCase())}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.count}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><List size={15} /> All Reports</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'infected', 'stressed', 'healthy'].map(f => (
                <button
                  key={f}
                  className={`layer-btn ${filter === f ? (f === 'infected' ? 'active-high' : f === 'stressed' ? 'active-moderate' : f === 'healthy' ? 'active-low' : 'active-reports') : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop table */}
          <div style={{ overflowX: 'auto', display: 'block' }} className="hide-mobile">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Zone</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Guard</th>
                  <th>Time</th>
                  <th>Sync</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const st = statusStyle[r.status]
                  return (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{r.id}</td>
                      <td style={{ color: 'var(--text-primary)' }}>{r.zone}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: st.bg, color: st.color, border: `1px solid ${st.border}`
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                            <div style={{ width: `${r.confidence}%`, height: '100%', background: st.color, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: st.color }}>{r.confidence}%</span>
                        </div>
                      </td>
                      <td>{r.guard}</td>
                      <td><Clock size={11} style={{ display: 'inline', marginRight: 4 }} />{r.time}</td>
                      <td>
                        {r.synced
                          ? <CheckCircle size={14} style={{ color: 'var(--risk-low)' }} />
                          : <CloudOff size={14} style={{ color: 'var(--risk-moderate)' }} />
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div style={{ padding: '8px 16px' }}>
            {filtered.map(r => {
              const st = statusStyle[r.status]
              return (
                <div key={r.id} style={{
                  padding: '12px 0', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'flex-start', gap: 12
                }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', background: st.color,
                    flexShrink: 0, marginTop: 4, boxShadow: `0 0 6px ${st.color}`
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.zone}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8, fontFamily: 'var(--font-mono)' }}>{r.id}</span>
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        background: st.bg, color: st.color, border: `1px solid ${st.border}`
                      }}>{r.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                      {r.guard} · {r.time} · {r.confidence}% confidence
                      {!r.synced && <span style={{ color: 'var(--risk-moderate)', marginLeft: 6 }}>⏳ Pending sync</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
