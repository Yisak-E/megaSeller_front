import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { auth, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <nav style={{
      background: 'rgba(13,17,23,0.95)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 100,
      padding: '0 24px'
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--accent-gold)',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, color: '#000', fontSize: '1rem'
          }}>M</div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem',
            color: 'var(--text-primary)', letterSpacing: '-0.02em'
          }}>
            MEGA<span style={{ color: 'var(--accent-gold)' }}>SELLER</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {auth ? (
            <>
              <NavLink to="/movies" active={isActive('/movies')}>Movies</NavLink>
              <NavLink to="/orders" active={isActive('/orders')}>My Tickets</NavLink>
              {isAdmin && <NavLink to="/admin" active={isActive('/admin')} gold>Admin</NavLink>}
              <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginRight: 8 }}>
                {auth.username}
                {isAdmin && <span className="badge badge-gold" style={{ marginLeft: 6 }}>Admin</span>}
              </span>
              <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" active={isActive('/login')}>Sign In</NavLink>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, active, gold, children }) {
  return (
    <Link to={to} style={{
      textDecoration: 'none', padding: '8px 14px', borderRadius: 6,
      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem',
      color: active ? (gold ? 'var(--accent-gold)' : 'var(--text-primary)') : 'var(--text-secondary)',
      background: active ? 'var(--bg-surface)' : 'transparent',
      transition: 'all 0.15s'
    }}>
      {children}
    </Link>
  )
}
