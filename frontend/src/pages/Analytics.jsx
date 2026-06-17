import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { TrendingDown, Activity, BarChart2 } from 'lucide-react'
import { NDVI_TIMESERIES } from '../data/forestData'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

const RISK_DIST = [
  { zone: 'Thano', sbvi: 82, risk: 'High' },
  { zone: 'Jhajhra', sbvi: 74, risk: 'High' },
  { zone: 'Asarori', sbvi: 67, risk: 'High' },
  { zone: 'Kalsi N', sbvi: 58, risk: 'Moderate' },
  { zone: 'Rajaji', sbvi: 41, risk: 'Moderate' },
  { zone: 'DDun N', sbvi: 22, risk: 'Low' },
  { zone: 'Chakrata', sbvi: 18, risk: 'Low' },
]

const BAR_COLOR = (sbvi) => sbvi >= 66 ? '#E05252' : sbvi >= 33 ? '#E8B84B' : '#4CAF50'

const SEASONAL = [
  { season: 'Pre-Monsoon 23', ndvi: 0.68, infected: 120 },
  { season: 'Monsoon 23', ndvi: 0.71, infected: 180 },
  { season: 'Post-Monsoon 23', ndvi: 0.65, infected: 340 },
  { season: 'Winter 23', ndvi: 0.57, infected: 520 },
  { season: 'Pre-Monsoon 24', ndvi: 0.60, infected: 780 },
  { season: 'Monsoon 24', ndvi: 0.52, infected: 2400 },
  { season: 'Post-Monsoon 24', ndvi: 0.38, infected: 8200 },
  { season: 'Winter 24', ndvi: 0.32, infected: 14600 },
  { season: 'Current 25', ndvi: 0.24, infected: 19170 },
]

export default function Analytics() {
  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Temporal Analysis</div>
        <h1 className="page-title">Forest Health Analytics</h1>
        <p className="page-subtitle">Satellite-derived indices and infestation trends · 2023–2025</p>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* NDVI + NDMI time series */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><TrendingDown size={15} /> NDVI & NDMI Time Series</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sentinel-2 · Thano Core Zone</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={NDVI_TIMESERIES} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#97BC62" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#97BC62" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ndmiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6BA8D0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6BA8D0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} domain={[-0.3, 0.9]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0.3} stroke="#E05252" strokeDasharray="4 4" label={{ value: 'Stress threshold', position: 'insideTopRight', fontSize: 10, fill: '#E05252' }} />
                <Area type="monotone" dataKey="ndvi" stroke="#97BC62" fill="url(#ndviGrad)" strokeWidth={2} dot={false} name="NDVI" />
                <Area type="monotone" dataKey="ndmi" stroke="#6BA8D0" fill="url(#ndmiGrad)" strokeWidth={2} dot={false} name="NDMI" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{
              marginTop: 8, padding: '8px 12px', background: 'var(--risk-high-bg)',
              borderRadius: 8, fontSize: 11, color: 'var(--risk-high)',
              borderLeft: '3px solid var(--risk-high)'
            }}>
              Critical decline detected from Aug 2024 — NDVI dropped from 0.69 to 0.24, well below the 0.30 healthy threshold.
              This pattern confirms active infestation expanding since peak monsoon 2024.
            </div>
          </div>
        </div>

        {/* SBVI by zone */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Activity size={15} /> SBVI Score by Zone</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>66+ = High Risk · 33–65 = Moderate · 0–32 = Low</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={RISK_DIST} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="zone" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={66} stroke="#E05252" strokeDasharray="4 4" />
                <ReferenceLine y={33} stroke="#E8B84B" strokeDasharray="4 4" />
                <Bar dataKey="sbvi" name="SBVI Score" radius={[4, 4, 0, 0]}>
                  {RISK_DIST.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={BAR_COLOR(entry.sbvi)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Infestation vs NDVI correlation */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><BarChart2 size={15} /> Infestation Spread vs NDVI Decline</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cumulative affected trees as NDVI dropped</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={SEASONAL} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="season" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={50} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} domain={[0, 1]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="ndvi" stroke="#97BC62" strokeWidth={2.5} dot={{ r: 3 }} name="NDVI" />
                <Line yAxisId="right" type="monotone" dataKey="infected" stroke="#E05252" strokeWidth={2.5} dot={{ r: 3 }} name="Trees Affected" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'NDVI Change', value: '−65%', sub: 'Oct 2023 → Jun 2025', color: 'var(--risk-high)' },
            { label: 'NDMI Drop', value: '−0.39', sub: 'Baseline to current', color: 'var(--risk-high)' },
            { label: 'NBR Decrease', value: '−0.31', sub: 'Forest burn ratio change', color: 'var(--risk-moderate)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
