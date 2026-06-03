import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMovies, getShowtime, buyTicket } from '../services/api'
import { useCountdown } from '../hooks/useCountdown'
import { Toast } from '../components/Toast'

function SeatGrid({ showtime, selectedSeat, onSelect }) {
  const seats = showtime?.tickets || []
  const rows = [...new Set(seats.map(s => s.seatRow))].sort()

  return (
    <div>
      {/* Screen */}
      <div style={{
        textAlign: 'center', marginBottom: 24,
        padding: '8px 0', background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)',
        borderRadius: 4, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.2em'
      }}>
        ▬▬▬▬▬▬▬▬▬ SCREEN ▬▬▬▬▬▬▬▬▬
      </div>

      {rows.map(row => (
        <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ width: 20, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {row}
          </span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {seats.filter(s => s.seatRow === row).sort((a, b) => a.seatNumber - b.seatNumber).map(seat => {
              const isSelected = selectedSeat?.id === seat.id
              const isAvail = seat.status === 'AVAILABLE'
              const isSold = seat.status === 'SOLD'
              const isLocked = seat.status === 'LOCKED'
              return (
                <button key={seat.id}
                  disabled={!isAvail}
                  onClick={() => isAvail && onSelect(isSelected ? null : seat)}
                  title={`${seat.seatRow}${seat.seatNumber} — ${seat.status}`}
                  style={{
                    width: 28, height: 28, borderRadius: 4, border: 'none', cursor: isAvail ? 'pointer' : 'default',
                    fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
                    transition: 'all 0.15s',
                    background: isSelected ? 'var(--accent-gold)'
                      : isSold ? 'rgba(229,50,59,0.3)'
                      : isLocked ? 'rgba(255,214,10,0.2)'
                      : 'var(--bg-hover)',
                    color: isSelected ? '#000'
                      : isSold ? 'var(--accent-red)'
                      : isLocked ? 'var(--accent-yellow)'
                      : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border)',
                    transform: isSelected ? 'scale(1.15)' : ''
                  }}>
                  {seat.seatNumber}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--bg-hover)', border: 'var(--border)', label: 'Available' },
          { color: 'var(--accent-gold)', border: 'var(--accent-gold)', label: 'Selected' },
          { color: 'rgba(229,50,59,0.3)', border: 'var(--accent-red)', label: 'Sold' },
          { color: 'rgba(255,214,10,0.2)', border: 'var(--accent-yellow)', label: 'Locked' },
        ].map(({ color, border, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: color, border: `1px solid ${border}` }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

function ShowtimeCard({ st, onBuy }) {
  const { timeLeft, isOpen } = useCountdown(st.saleOpensAt)
  const [expanded, setExpanded] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [buying, setBuying] = useState(false)
  const [fullShowtime, setFullShowtime] = useState(null)
  const [loadingSeats, setLoadingSeats] = useState(false)

  const loadSeats = async () => {
    if (fullShowtime) { setExpanded(e => !e); return }
    setLoadingSeats(true)
    try {
      const data = await getShowtime(st.id)
      setFullShowtime(data)
      setExpanded(true)
    } catch (e) { console.error(e) }
    finally { setLoadingSeats(false) }
  }

  const handleBuy = async () => {
    setBuying(true)
    try {
      await onBuy(st.id, selectedSeat?.seatRow, selectedSeat?.seatNumber)
      setSelectedSeat(null)
      // Refresh seat data
      const data = await getShowtime(st.id)
      setFullShowtime(data)
    } finally {
      setBuying(false)
    }
  }

  const startTime = new Date(st.startTime)

  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Time */}
        <div style={{ minWidth: 80 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--accent-cyan)', lineHeight: 1 }}>
            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {startTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{st.hallName}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            {st.availableSeats} available · {st.soldSeats} sold · {st.lockedSeats} locked
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: 100 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
            ${st.ticketPrice}
          </div>
          {isOpen ? (
            <span className="badge badge-green" style={{ marginTop: 4 }}>ON SALE</span>
          ) : (
            <div style={{ marginTop: 4 }}>
              {timeLeft && (
                <span className="badge badge-yellow" style={{ fontSize: '0.65rem' }}>
                  {String(timeLeft.hours).padStart(2,'0')}:{String(timeLeft.minutes).padStart(2,'0')}:{String(timeLeft.seconds).padStart(2,'0')}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            onClick={loadSeats} disabled={loadingSeats}>
            {loadingSeats ? <span className="spinner" style={{ width: 14, height: 14 }} /> : (expanded ? '▲ Hide Seats' : '▼ Pick Seat')}
          </button>
          {isOpen && (
            <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}
              onClick={handleBuy} disabled={buying || st.availableSeats === 0}>
              {buying ? <span className="spinner" style={{ width: 14, height: 14 }} />
                : st.availableSeats === 0 ? 'Sold Out'
                : selectedSeat ? `Buy ${selectedSeat.seatRow}${selectedSeat.seatNumber}` : 'Buy Any'}
            </button>
          )}
        </div>
      </div>

      {expanded && fullShowtime && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 20, background: 'var(--bg-deep)' }}>
          <SeatGrid showtime={fullShowtime} selectedSeat={selectedSeat} onSelect={setSelectedSeat} />
        </div>
      )}
    </div>
  )
}

export default function MovieDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getMovies().then(movies => {
      const found = movies.find(m => String(m.id) === id)
      setMovie(found || null)
    }).catch(console.error).finally(() => setLoading(false))
  }, [id])

  const handleBuy = async (showtimeId, row, num) => {
    try {
      const result = await buyTicket(showtimeId, row, num)
      if (result.success) {
        setToast({ type: 'success', msg: `🎟 Seat ${result.seatLabel} booked! Order #${result.orderId}` })
      } else {
        setToast({ type: 'error', msg: result.message })
      }
    } catch (err) {
      const status = err.response?.status
      const msg = status === 429 ? 'System busy — too many requests. Try again!'
        : err.response?.data?.message || 'Purchase failed'
      setToast({ type: 'error', msg })
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )
  if (!movie) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Movie not found.</div>

  return (
    <div className="page">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="container">
        <button className="btn btn-outline" style={{ marginBottom: 24 }} onClick={() => navigate('/movies')}>
          ← Back to movies
        </button>

        {/* Hero */}
        <div style={{
          borderRadius: 16, overflow: 'hidden', marginBottom: 32,
          background: 'linear-gradient(135deg, var(--bg-card), var(--bg-deep))',
          border: '1px solid var(--border)', padding: '32px 40px',
          display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap'
        }}>
          <div style={{
            width: 140, height: 200, flexShrink: 0,
            background: 'var(--bg-surface)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', border: '1px solid var(--border)'
          }}>🎬</div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <span className="badge badge-gold" style={{ marginBottom: 12 }}>{movie.genre}</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', marginBottom: 12 }}>
              {movie.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 20, maxWidth: 600 }}>
              {movie.description}
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Director', val: movie.director },
                { label: 'Duration', val: `${movie.durationMinutes} min` },
                { label: 'Rating', val: movie.rating },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Showtimes */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: 20 }}>
          Available Showtimes
        </h2>

        {movie.showtimes?.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No showtimes available.</p>
        ) : (
          movie.showtimes?.map(st => (
            <ShowtimeCard key={st.id} st={st} onBuy={handleBuy} />
          ))
        )}
      </div>
    </div>
  )
}
