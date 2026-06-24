import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ onSearch }) {
  const { user, logout, isAdmin } = useAuth()
  const isUser = user?.role === 'USER'
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [showUser, setShowUser] = useState(false)

  const handleSearch = (e) => {
    const val = e.target.value
    setQuery(val)
    if (onSearch) onSearch(val)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isHome = location.pathname === '/'
  const isWatchlist = location.pathname === '/watchlist'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="font-display font-black text-2xl tracking-tight flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
          CINE<span style={{ color: 'var(--accent)' }}>VAULT</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1 ml-4">
          <NavLink to="/" active={isHome}>Catalogo</NavLink>

          {/* USER: La mia lista */}
          {isUser && (
            <NavLink to="/watchlist" active={isWatchlist}>La mia lista</NavLink>
          )}

          {/* ADMIN: links aggiuntivi */}
          {isAdmin && (
            <>
              <NavLink to="/movies/new" active={location.pathname === '/movies/new'}>
                + Aggiungi film
              </NavLink>
              <NavLink to="/categories" active={location.pathname === '/categories'}>
                Categorie
              </NavLink>
            </>
          )}
        </div>

        {/* Search — solo in homepage */}
        {onSearch && (
          <div className="flex-1 max-w-sm ml-auto">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={handleSearch}
                placeholder="Cerca un film..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        )}

        <div className="ml-auto" />

        {/* User dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowUser(p => !p)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--accent)', color: 'white' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm hidden sm:block" style={{ color: 'var(--text-secondary)' }}>{user?.username}</span>
            {isAdmin && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                admin
              </span>
            )}
          </button>

          {showUser && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              {/* Mobile-only links */}
              {isUser && (
                <Link to="/watchlist" onClick={() => setShowUser(false)}
                  className="block px-4 py-3 text-sm"
                  style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  La mia lista
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link to="/movies/new" onClick={() => setShowUser(false)}
                    className="block px-4 py-3 text-sm"
                    style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                    + Aggiungi film
                  </Link>
                  <Link to="/categories" onClick={() => setShowUser(false)}
                    className="block px-4 py-3 text-sm"
                    style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                    Categorie
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm transition-colors"
                style={{ color: 'var(--danger)' }}
                onMouseEnter={e => e.target.style.background = 'rgba(224,92,92,0.1)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                Esci
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to}
      className="px-3 py-1.5 rounded-lg text-sm transition-colors"
      style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
      onMouseLeave={e => e.currentTarget.style.color = active ? 'var(--text-primary)' : 'var(--text-secondary)'}
    >
      {children}
    </Link>
  )
}
