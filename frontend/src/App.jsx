import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Map, Camera, BarChart2, List, Clock, Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react'
import { useOnlineStatus } from './hooks/useGPS'
import { ToastProvider, useToast } from './hooks/useToast'
import { syncPendingReports, getPendingReports } from './utils/api'
import Dashboard from './pages/Dashboard'
import FieldReport from './pages/FieldReport'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Saved from './pages/Saved'
import { useEffect, useState } from 'react'

const NAV = [
  { to: '/', icon: Map, label: 'Map' },
  { to: '/field', icon: Camera, label: 'Report' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/reports', icon: List, label: 'History' },
  { to: '/saved', icon: Clock, label: 'Saved' },
]

function Shell() {
  const online = useOnlineStatus()
  const toast = useToast()
  const [pendingCount, setPendingCount] = useState(0)
  const location = useLocation()

  useEffect(() => {
    getPendingReports().then(r => setPendingCount(r.length)).catch(() => {})
  }, [location.pathname])

  useEffect(() => {
    if (online && pendingCount > 0) {
      syncPendingReports()
        .then(n => {
          if (n > 0) {
            toast(`✓ Synced ${n} offline report${n > 1 ? 's' : ''}`, 'success')
            setPendingCount(0)
          }
        }).catch(() => {})
    }
  }, [online])

return (
    <div className="app">
      {/* Topbar */}
      <header className="topbar">
        <NavLink to="/" className="topbar-logo" style={{ gap: '12px' }}>
          <img 
            src="/Sal-Shield-Logo.png" 
            alt="SAL-SHIELD Logo" 
            style={{ 
              objectFit: 'contain', 
              width: '42px', 
              height: '42px', 
              background: 'none', 
              border: 'none',
              padding: '0'
            }} 
          />
          <span className="topbar-logo-text">SAL-<span>SHIELD</span></span>
        </NavLink>
        <div className="topbar-right">
          {pendingCount > 0 && (
            <div className="topbar-badge" style={{ color: 'var(--mod)', borderColor: 'var(--mod-border)' }}>
              <Clock size={11} /> {pendingCount} pending
            </div>
          )}
          <div className="topbar-badge">
            <span className={`pulse${online ? '' : ' offline'}`} />
            {online ? 'Live' : 'Offline'}
          </div>
          <div className="topbar-badge" style={{ display: 'none' }} id="zone-badge">
            Dehradun FD
          </div>
        </div>
      </header>

      {/* Alert bars */}
      {!online && (
        <div className="alert-bar offline">
          <WifiOff size={13} />
          Offline — photos and reports save locally, sync when connected
        </div>
      )}

      <div className="app-body">
        {/* Desktop sidebar */}
        <nav className="sidebar">
          <div className="sidebar-section">Navigation</div>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} /> {label}
              {label === 'Saved' && pendingCount > 0 && (
                <span className="nav-badge">{pendingCount}</span>
              )}
            </NavLink>
          ))}

          <div className="sidebar-section" style={{ marginTop: 8 }}>Risk Zones</div>
          {[
            { name: 'Thano Core',    risk: 'high',     sbvi: 82 },
            { name: 'Jhajhra',       risk: 'high',     sbvi: 74 },
            { name: 'Asarori',       risk: 'high',     sbvi: 67 },
            { name: 'Kalsi North',   risk: 'moderate', sbvi: 58 },
            { name: 'Rajaji Buffer', risk: 'moderate', sbvi: 41 },
            { name: 'DDun North',    risk: 'low',      sbvi: 22 },
          ].map(z => (
            <div key={z.name} className="zone-row">
              <span className={`zone-dot ${z.risk === 'moderate' ? 'moderate' : z.risk}`} />
              <span className="zone-name">{z.name}</span>
              <span className={`zone-score ${z.risk === 'moderate' ? 'moderate' : z.risk}`}>{z.sbvi}</span>
            </div>
          ))}

          <div className="sidebar-footer">
            <div className="sidebar-status">
              {online
                ? <><RefreshCw size={11} style={{ color: 'var(--low)' }} /> Satellite data live</>
                : <><WifiOff size={11} style={{ color: 'var(--mod)' }} /> Cached mode</>
              }
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/"          element={<Dashboard />}   />
            <Route path="/field"     element={<FieldReport />} />
            <Route path="/analytics" element={<Analytics />}   />
            <Route path="/reports"   element={<Reports />}     />
            <Route path="/saved"     element={<Saved />}       />
          </Routes>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to} end={to === '/'}
            className={({ isActive }) => `bnav-item${isActive ? ' active' : ''}`}
          >
            <div className="bnav-icon" style={{ position: 'relative' }}>
              <Icon size={20} strokeWidth={1.8} />
              {label === 'Saved' && pendingCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 14, height: 14, borderRadius: '50%',
                  background: 'var(--mod)', border: '2px solid var(--bg-base)',
                  fontSize: 8, fontWeight: 700, color: '#0A1F14',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{pendingCount}</span>
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </BrowserRouter>
  )
}
