import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMovies } from '../services/api'
import { useCountdown } from '../hooks/useCountdown'

function CountdownBadge({ saleOpensAt }) {
  const { timeLeft, isOpen } = useCountdown(saleOpensAt)
  if (isOpen) return <span className="badge badge-green">● ON SALE NOW</span>
  if (!timeLeft) return null
  const parts = []
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`)
  parts.push(`${String(timeLeft.hours).padStart(2,'0')}h`)
  parts.push(`${String(timeLeft.minutes).padStart(2,'0')}m`)
  parts.push(`${String(timeLeft.seconds).padStart(2,'0')}s`)
  return (
    <span className="badge badge-yellow animate-blink">
      ⏱ {parts.join(' ')}
    </span>
  )
}

function MovieCard({ movie, onSelect }) {
  const upcomingShowtimes = movie.showtimes || []
  const earliestSale = upcomingShowtimes.reduce((min, s) =>
    s.saleOpensAt && (!min || new Date(s.saleOpensAt) < new Date(min)) ? s.saleOpensAt : min, null)

  const genreColors = {
    'Sci-Fi / Thriller': 'var(--accent-cyan)',
    'Fantasy / Adventure': 'var(--accent-gold)',
    'Action / Drama': 'var(--accent-red)',
  }
  const color = genreColors[movie.genre] || 'var(--accent-cyan)'

  return (
    <div className="card" onClick={() => onSelect(movie.id)} style={{
      cursor: 'pointer', overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex', flexDirection: 'column'
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${color}33` }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>

      {/* Poster area */}
      <div style={{
        height: 200, background: `linear-gradient(135deg, ${color}22, var(--bg-deep))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: '4rem', opacity: 0.3 }}>🎬</div>
        <div style={{
          position: 'absolute', top: 12, left: 12,
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
          color, opacity: 0.8, fontWeight: 600, letterSpacing: '0.1em'
        }}>
          {movie.rating}
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <CountdownBadge saleOpensAt={earliestSale} />
        </div>
      </div>

      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 4, color }}>{movie.title}</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{movie.genre}</p>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
          {movie.description?.substring(0, 120)}...
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {movie.durationMinutes} min · {movie.director}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {upcomingShowtimes.length} showtime{upcomingShowtimes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button className="btn btn-outline" style={{ width: '100%', marginTop: 6 }}>
          View Showtimes →
        </button>
      </div>
    </div>
  )
}

export default function MoviesPage() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getMovies().then(setMovies).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 40, paddingTop: 16 }}>
          <div className="badge badge-gold" style={{ marginBottom: 12 }}>NOW SHOWING & COMING SOON</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: 12 }}>
            Premiere<br /><span style={{ color: 'var(--accent-gold)' }}>Schedule</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500 }}>
            Secure your seat before the rush. Live countdown timers activate when tickets go on sale.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24
          }}>
            {Array.isArray(movies) && movies.map(movie => (
              <MovieCard key={movie.id} movie={movie}
                onSelect={(id) => navigate(`/movies/${id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
