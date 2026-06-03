import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login } from '../services/api'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.username, form.password)
      setAuth(data)
      navigate(data.role === 'ROLE_ADMIN' ? '/admin' : '/movies')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(245,166,35,0.06) 0%, var(--bg-void) 60%)',
      padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--accent-gold)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, color: '#000', fontSize: '1.6rem',
            margin: '0 auto 16px'
          }}>M</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sign in to your Mega Seller account
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Username
              </label>
              <input className="input" type="text" placeholder="Enter username"
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input className="input" type="password" placeholder="Enter password"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(229,50,59,0.1)', border: '1px solid rgba(229,50,59,0.3)', borderRadius: 8, color: 'var(--accent-red)', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: 4 }}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg-surface)', borderRadius: 8, fontSize: '0.8rem' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Demo accounts:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              <span>admin / admin123 <span className="badge badge-gold" style={{ marginLeft: 4 }}>Admin</span></span>
              <span>alice / password123</span>
              <span>bob / password123</span>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
