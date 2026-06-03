import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import { getAdminMetrics, getAdminInventory } from '../services/api'

// ─── Thread State Colors ───────────────────────────────────────────────────
const STATE_COLORS = {
  WAITING_FOR_LOCK:       { bg: 'rgba(255,214,10,0.15)',  border: '#ffd60a', dot: '#ffd60a',  label: 'Waiting for Lock' },
  ACQUIRED_LOCK:          { bg: 'rgba(0,212,255,0.15)',   border: '#00d4ff', dot: '#00d4ff',  label: 'Acquired Lock'    },
  PROCESSING_DB_TRANSACTION: { bg: 'rgba(124,58,237,0.15)', border: '#7c3aed', dot: '#a78bfa', label: 'DB Transaction'  },
  DONE:                   { bg: 'rgba(0,255,135,0.15)',   border: '#00ff87', dot: '#00ff87',  label: 'Done'             },
  TIMEOUT:                { bg: 'rgba(229,50,59,0.15)',   border: '#e5323b', dot: '#e5323b',  label: 'Timeout'          },
}

// ─── Thread Card ───────────────────────────────────────────────────────────
function ThreadCard({ thread }) {
  const cfg = STATE_COLORS[thread.state] || STATE_COLORS.WAITING_FOR_LOCK
  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 8, padding: '10px 14px',
      display: 'flex', flexDirection: 'column', gap: 4,
      transition: 'all 0.25s',
      minWidth: 180, flex: '1 1 180px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: cfg.dot }}>
          ● {thread.state}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {thread.duration}ms
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {thread.username || 'anon'} · show#{thread.showtimeId}
      </div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {thread.threadId}
      </div>
    </div>
  )
}

// ─── Stat Tile ─────────────────────────────────────────────────────────────
function StatTile({ label, value, color = 'var(--text-primary)', sub }) {
  return (
    <div className="card" style={{ padding: '20px 24px', flex: '1 1 140px' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Inventory Bar ─────────────────────────────────────────────────────────
function InventoryRow({ snap }) {
  const total = snap.total || 1
  const availPct = (snap.available / total) * 100
  const soldPct  = (snap.sold / total) * 100
  const lockPct  = (snap.locked / total) * 100

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem' }}>{snap.movieTitle}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {snap.available} avail / {snap.sold} sold / {snap.locked} locked
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: 'var(--bg-surface)', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${soldPct}%`,  background: 'var(--accent-red)',    transition: 'width 0.4s' }} />
        <div style={{ width: `${lockPct}%`,  background: 'var(--accent-yellow)', transition: 'width 0.4s' }} />
        <div style={{ width: `${availPct}%`, background: 'var(--accent-green)',  transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

// ─── Main Admin Page ───────────────────────────────────────────────────────
const MAX_HISTORY = 60

export default function AdminPage() {
  const { auth, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [metrics,   setMetrics]   = useState(null)
  const [inventory, setInventory] = useState([])
  const [history,   setHistory]   = useState([])   // rolling chart data
  const [connected, setConnected] = useState(false)
  const [sseError,  setSseError]  = useState(null)

  const metricsEsRef   = useRef(null)
  const inventoryEsRef = useRef(null)

  // ── Redirect non-admins ──────────────────────────────────────────────────
  useEffect(() => {
    if (!auth) { navigate('/login'); return }
    if (!isAdmin) { navigate('/movies'); return }
  }, [auth, isAdmin, navigate])

  // ── SSE connections ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth?.token) return

    // --- Metrics SSE ---
    const metricsUrl = `/api/admin/metrics-stream`
    const mEs = new EventSource(metricsUrl, { withCredentials: false })
    metricsEsRef.current = mEs

    mEs.addEventListener('metrics', e => {
      try {
        const snap = JSON.parse(e.data)
        setMetrics(snap)
        setConnected(true)
        setSseError(null)
        setHistory(h => {
          const point = {
            t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            active:    snap.activeThreads    || 0,
            waiting:   snap.waitingForLock   || 0,
            processing:snap.processingDb     || 0,
            success:   snap.successfulPurchases || 0,
            rejected:  snap.rejectedRequests || 0,
            total:     snap.totalRequests    || 0,
          }
          return [...h.slice(-MAX_HISTORY + 1), point]
        })
      } catch {}
    })
    mEs.onerror = () => { setSseError('SSE disconnected — retrying…'); setConnected(false) }

    // --- Inventory SSE ---
    const iEs = new EventSource(`/api/admin/inventory-stream`)
    inventoryEsRef.current = iEs
    iEs.addEventListener('inventory', e => {
      try { 
        const data = JSON.parse(e.data)
        setInventory(Array.isArray(data) ? data : []) 
      } catch {}
    })

    // ── Fallback polling if SSE token blocked (H2 dev quirk) ────────────
    const poll = setInterval(async () => {
      if (connected) return
      try {
        const [m, inv] = await Promise.all([getAdminMetrics(), getAdminInventory()])
        setMetrics(m)
        setInventory(Array.isArray(inv) ? inv : [])
        setConnected(true)
        setHistory(h => {
          const point = {
            t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            active: m.activeThreads || 0,
            waiting: m.waitingForLock || 0,
            processing: m.processingDb || 0,
            success: m.successfulPurchases || 0,
            rejected: m.rejectedRequests || 0,
            total: m.totalRequests || 0,
          }
          return [...h.slice(-MAX_HISTORY + 1), point]
        })
      } catch {}
    }, 500)

    return () => {
      mEs.close()
      iEs.close()
      clearInterval(poll)
    }
  }, [auth?.token])

  // ─────────────────────────────────────────────────────────────────────────
  const threads = Array.isArray(metrics?.threads) ? metrics.threads : []
  const lastH   = history[history.length - 1]

  const pieData = metrics ? [
    { name: 'Successful', value: metrics.successfulPurchases || 0, color: 'var(--accent-green)' },
    { name: 'Rejected',   value: metrics.rejectedRequests || 0,    color: 'var(--accent-red)'   },
  ] : []

  return (
    <div className="page" style={{ background: 'var(--bg-void)' }}>
      <div className="container">

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingTop: 8, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="badge badge-gold">ADMIN PORTAL</span>
              <span className={`badge ${connected ? 'badge-green' : 'badge-red'}`}>
                {connected ? '● LIVE' : '○ CONNECTING'}
              </span>
              {sseError && <span style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)' }}>{sseError}</span>}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
              System <span style={{ color: 'var(--accent-gold)' }}>Dashboard</span>
            </h1>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
            SSE push every 200ms<br />
            {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* ── Stat Tiles ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatTile label="Total Requests"      value={metrics?.totalRequests ?? 0}       color="var(--accent-cyan)"   />
          <StatTile label="Tickets Sold"        value={metrics?.successfulPurchases ?? 0} color="var(--accent-green)"  />
          <StatTile label="Rejected (429)"      value={metrics?.rejectedRequests ?? 0}    color="var(--accent-red)"    />
          <StatTile label="Active Threads"      value={metrics?.activeThreads ?? 0}       color="var(--accent-gold)"   />
          <StatTile label="Waiting for Lock"    value={metrics?.waitingForLock ?? 0}      color="var(--accent-yellow)" />
          <StatTile label="In DB Transaction"   value={metrics?.processingDb ?? 0}        color="#a78bfa"              />
        </div>

        {/* ── Main Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Thread Activity Chart */}
          <div className="card" style={{ padding: 24, gridColumn: 'span 2' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 16, color: 'var(--text-secondary)' }}>
              LIVE THREAD ACTIVITY  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>( rolling 60s )</span>
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gActive"    x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gWaiting"   x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ffd60a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffd60a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gProcessing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="active"     stroke="#00d4ff" fill="url(#gActive)"     strokeWidth={2} dot={false} name="Active"      />
                <Area type="monotone" dataKey="waiting"    stroke="#ffd60a" fill="url(#gWaiting)"    strokeWidth={2} dot={false} name="Waiting Lock" />
                <Area type="monotone" dataKey="processing" stroke="#a78bfa" fill="url(#gProcessing)" strokeWidth={2} dot={false} name="DB Processing" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Requests Accepted vs Rejected */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 16, color: 'var(--text-secondary)' }}>
              REQUEST OUTCOMES
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={history.slice(-20)} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval={4} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="success"  fill="var(--accent-green)" name="Success"  radius={[3,3,0,0]} />
                <Bar dataKey="rejected" fill="var(--accent-red)"   name="Rejected" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 16, color: 'var(--text-secondary)' }}>
              CUMULATIVE OUTCOMES
            </h2>
            {pieData[0]?.value === 0 && pieData[1]?.value === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No transactions yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={4}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Live Thread Monitor ── */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-secondary)' }}>
              LIVE THREAD MONITOR
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 10 }}>
                ConcurrentHashMap — {threads.length} active
              </span>
            </h2>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(STATE_COLORS).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: v.dot }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.dot }} />
                  {v.label}
                </div>
              ))}
            </div>
          </div>

          {threads.length === 0 ? (
            <div style={{
              height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-deep)', borderRadius: 8, border: '1px dashed var(--border)',
              color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)'
            }}>
              No active threads — waiting for ticket purchase requests…
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Array.isArray(threads) && threads.map(t => <ThreadCard key={t.threadId} thread={t} />)}
            </div>
          )}
        </div>

        {/* ── Inventory Tracker ── */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 20, color: 'var(--text-secondary)' }}>
            LIVE SEAT INVENTORY
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 10 }}>
              SSE stream · all showtimes
            </span>
          </h2>
          {inventory.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading inventory…</div>
          ) : (
            Array.isArray(inventory) && inventory.map(snap => <InventoryRow key={snap.showtimeId} snap={snap} />)
          )}
          {/* Colour key */}
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {[
              { color: 'var(--accent-red)',    label: 'Sold'      },
              { color: 'var(--accent-yellow)', label: 'Locked'    },
              { color: 'var(--accent-green)',  label: 'Available' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 12, height: 8, borderRadius: 2, background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── System Info ── */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 16, color: 'var(--text-secondary)' }}>
            CONCURRENCY ARCHITECTURE
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { title: 'ReentrantLock (fair)',       desc: 'One lock per showtime. Threads queue fairly. Timeout after 2s → HTTP 429.',             color: 'var(--accent-yellow)' },
              { title: 'PESSIMISTIC_WRITE Lock',     desc: 'DB-level row lock on ticket row prevents race conditions at the persistence layer.',     color: 'var(--accent-cyan)'   },
              { title: 'ConcurrentHashMap',          desc: 'Thread state map updated lock-free via computeIfPresent. Removed in finally block.',     color: '#a78bfa'              },
              { title: 'Server-Sent Events (SSE)',   desc: 'Admin dashboard receives state snapshots every 200ms without polling.',                  color: 'var(--accent-green)'  },
              { title: 'ACID Transactions',          desc: '@Transactional ensures atomicity. A failed DB write never partially updates seat state.', color: 'var(--accent-gold)'   },
              { title: 'Stateless JWT Auth',         desc: 'No server-side session state. Horizontally scalable. BCrypt password hashing.',          color: 'var(--accent-red)'    },
            ].map(({ title, desc, color }) => (
              <div key={title} style={{ padding: '14px 16px', background: 'var(--bg-deep)', borderRadius: 8, borderLeft: `3px solid ${color}` }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6, fontSize: '0.88rem', color }}>{title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
