import React, { useEffect, useState } from 'react'
import { getMyOrders } from '../services/api'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyOrders().then(setOrders).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 32, paddingTop: 8 }}>
          <div className="badge badge-cyan" style={{ marginBottom: 10 }}>PURCHASE HISTORY</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>My Tickets</h1>
        </div>

        {orders.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎟</div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>No tickets yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Purchase your first ticket from the Movies page.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map(order => (
              <div key={`${order.orderId}-${order.seatLabel}`} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                {/* Ticket stub graphic */}
                <div style={{
                  width: 64, height: 64, borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--accent-gold)22, var(--bg-deep))',
                  border: '1px solid var(--accent-gold)33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 700
                }}>
                  {order.seatLabel}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', marginBottom: 4 }}>
                    {order.movieTitle}
                  </h3>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span>📍 {order.hall}</span>
                    <span>📅 {order.showtime ? new Date(order.showtime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    <span>🎫 Order #{order.orderId}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                    ${order.price}
                  </div>
                  <span className={`badge badge-${order.status === 'CONFIRMED' ? 'green' : 'yellow'}`} style={{ marginTop: 4 }}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
