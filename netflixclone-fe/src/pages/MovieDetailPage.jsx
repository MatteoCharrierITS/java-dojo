import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMovie, deleteMovie, getFileUrl, getWatchlist, addToWatchlist, removeFromWatchlist } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { tmdbFindTrailer, isTmdbConfigured } from '../api/tmdb'
import Navbar from '../components/Navbar'

// ─── Trailer Modal ─────────────────────────────────────────────────────────────
function TrailerModal({ youtubeKey, title, onClose }) {
  const overlayRef = useRef(null)

  // Chiudi con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.97)' }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
        <div className="flex items-center gap-3">
          {/* Logo mini */}
          <span className="font-display font-black text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
            CINE<span style={{ color: 'var(--accent)' }}>VAULT</span>
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>|</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Trailer: {title}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all text-lg"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.12)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          ✕
        </button>
      </div>

      {/* Player container — 16:9 centrato */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full" style={{ maxWidth: '1100px' }}>
          <div className="relative w-full rounded-2xl overflow-hidden"
            style={{
              paddingBottom: '56.25%', // 16:9
              background: '#000',
              boxShadow: '0 0 80px rgba(124,92,252,0.2), 0 0 0 1px rgba(124,92,252,0.1)',
            }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1&color=white&iv_load_policy=3`}
              title={`Trailer: ${title}`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            />
          </div>

          {/* Sotto player: info e azioni */}
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Trailer ufficiale · YouTube
            </p>
            <a
              href={`https://www.youtube.com/watch?v=${youtubeKey}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              ↗ Apri su YouTube
            </a>
          </div>
        </div>
      </div>

      {/* Gradient bar in basso decorativo */}
      <div className="h-1 flex-shrink-0" style={{
        background: 'linear-gradient(to right, transparent, var(--accent), transparent)'
      }} />
    </div>
  )
}

// ─── Loading trailer state ──────────────────────────────────────────────────────
function TrailerLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[99] flex flex-col items-center justify-center gap-4"
      style={{ background: 'rgba(0,0,0,0.95)' }}>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: 'var(--accent)', animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Ricerca trailer su TMDB...
      </p>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function MovieDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, user } = useAuth()
  const isUser = user?.role === 'USER'

  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Trailer
  const [trailerKey, setTrailerKey] = useState(null)
  const [trailerLoading, setTrailerLoading] = useState(false)
  const [trailerError, setTrailerError] = useState(null)
  const [showPlayer, setShowPlayer] = useState(false)

  // Poster download
  const [downloading, setDownloading] = useState(false)

  // Watchlist
  const [inWatchlist, setInWatchlist] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    setLoading(true)
    getMovie(id)
      .then(res => setMovie(res.data))
      .catch(() => setError('Film non trovato'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!isUser) return
    getWatchlist()
      .then(res => setInWatchlist(res.data.some(m => m.id === id)))
      .catch(() => {})
  }, [id, isUser])

  // Quando abbiamo il film, proviamo a precaricare il trailer key in background
  useEffect(() => {
    if (!movie || !isTmdbConfigured()) return
    tmdbFindTrailer(movie.title, movie.releaseYear)
      .then(key => setTrailerKey(key))
      .catch(() => {}) // silenzioso — non blocca la pagina
  }, [movie])

  const handlePlay = async () => {
    setTrailerError(null)

    if (trailerKey) {
      setShowPlayer(true)
      return
    }

    if (!isTmdbConfigured()) {
      setTrailerError('Configura VITE_TMDB_API_KEY in .env per abilitare i trailer.')
      return
    }

    setTrailerLoading(true)
    try {
      const key = await tmdbFindTrailer(movie.title, movie.releaseYear)
      if (key) {
        setTrailerKey(key)
        setShowPlayer(true)
      } else {
        setTrailerError('Nessun trailer trovato su TMDB per questo film.')
      }
    } catch {
      setTrailerError('Errore nel recupero del trailer.')
    } finally {
      setTrailerLoading(false)
    }
  }

  const handleDownloadPoster = async () => {
    if (!movie.coverImagePath) return
    setDownloading(true)
    try {
      const res = await fetch(getFileUrl(movie.coverImagePath))
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${movie.title.replace(/[^a-z0-9]/gi, '_')}_poster.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Errore nel download del poster')
    } finally {
      setDownloading(false)
    }
  }

  const handleWatchlist = async () => {
    setWatchlistLoading(true)
    try {
      if (inWatchlist) {
        await removeFromWatchlist(id)
        setInWatchlist(false)
      } else {
        await addToWatchlist(id)
        setInWatchlist(true)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Errore watchlist')
    } finally {
      setWatchlistLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMovie(id)
      navigate('/')
    } catch (err) {
      alert(err.response?.data?.message || 'Errore nella cancellazione')
    }
  }

  const coverUrl = movie?.coverImagePath ? getFileUrl(movie.coverImagePath) : null

  // ─── Loading / Error screens ──────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center">
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 rounded-xl text-sm"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          Torna al catalogo
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Player modal */}
      {trailerLoading && <TrailerLoadingOverlay />}
      {showPlayer && trailerKey && (
        <TrailerModal
          youtubeKey={trailerKey}
          title={movie.title}
          onClose={() => setShowPlayer(false)}
        />
      )}

      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <Navbar />

        {/* ── Backdrop hero ── */}
        <div className="relative w-full" style={{ height: '55vh', minHeight: '380px' }}>
          {/* Usa il poster come backdrop sfocato se disponibile */}
          {coverUrl ? (
            <div className="w-full h-full overflow-hidden">
              <img
                src={coverUrl}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: 'blur(18px) brightness(0.35) saturate(1.4)', transform: 'scale(1.1)' }}
              />
            </div>
          ) : (
            <div className="w-full h-full" style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a1f 50%, #1a0a2e 100%)'
            }} />
          )}

          {/* Vignette */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(10,10,15,0.95) 25%, rgba(10,10,15,0.4) 70%, rgba(10,10,15,0.15) 100%)'
          }} />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 45%)'
          }} />
        </div>

        {/* ── Content ── */}
        <div className="max-w-7xl mx-auto px-6 -mt-52 relative z-10 pb-16">
          <div className="flex gap-8 items-end">

            {/* Poster */}
            <div className="hidden md:block flex-shrink-0 w-48 rounded-xl overflow-hidden group"
              style={{
                aspectRatio: '2/3',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
              }}>
              {coverUrl ? (
                <div className="relative w-full h-full">
                  <img src={coverUrl} alt={movie.title} className="w-full h-full object-cover" />
                  {/* Download overlay on hover */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ background: 'rgba(0,0,0,0.65)' }}
                    onClick={handleDownloadPoster}
                  >
                    <span className="text-2xl">⬇</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {downloading ? 'Download...' : 'Scarica poster'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">🎬</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <button onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 mb-4 text-sm"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                ← Torna indietro
              </button>

              {movie.isFeatured && (
                <span className="inline-block mb-3 text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'var(--gold)', color: '#0a0a0f' }}>
                  ★ In evidenza
                </span>
              )}

              <h1 className="font-display text-4xl md:text-5xl font-black leading-tight"
                style={{ color: 'var(--text-primary)' }}>
                {movie.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {movie.rating && (
                  <span className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
                    ★ {movie.rating}
                  </span>
                )}
                {movie.releaseYear && (
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{movie.releaseYear}</span>
                )}
                {movie.durationMinutes && (
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{movie.durationMinutes} min</span>
                )}
                {movie.categoryName && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full"
                    style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid rgba(124,92,252,0.3)' }}>
                    {movie.categoryName}
                  </span>
                )}
              </div>

              {movie.description && (
                <p className="mt-4 text-sm leading-relaxed max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                  {movie.description}
                </p>
              )}

              {/* ── Actions ── */}
              <div className="flex flex-wrap gap-3 mt-6">

                {/* RIPRODUCI — trailer */}
                <button
                  onClick={handlePlay}
                  disabled={trailerLoading}
                  className="flex items-center gap-2.5 px-7 py-3 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: trailerLoading ? 'var(--accent-dim)' : 'var(--accent)',
                    color: 'white',
                    cursor: trailerLoading ? 'wait' : 'pointer',
                    boxShadow: trailerLoading ? 'none' : '0 0 32px rgba(124,92,252,0.45)',
                  }}
                  onMouseEnter={e => { if (!trailerLoading) e.currentTarget.style.boxShadow = '0 0 48px rgba(124,92,252,0.65)' }}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = trailerLoading ? 'none' : '0 0 32px rgba(124,92,252,0.45)'}
                >
                  {/* Icona play SVG */}
                  {trailerLoading ? (
                    <span className="flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce inline-block"
                          style={{ background: 'white', animationDelay: `${i*0.12}s` }} />
                      ))}
                    </span>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 -ml-1">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                  {trailerLoading ? 'Ricerca trailer...' : 'Riproduci'}
                </button>

                {/* SCARICA POSTER */}
                {movie.coverImagePath && (
                  <button
                    onClick={handleDownloadPoster}
                    disabled={downloading}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      cursor: downloading ? 'wait' : 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                    </svg>
                    {downloading ? 'Download...' : 'Scarica poster'}
                  </button>
                )}

                {/* WATCHLIST — solo USER */}
                {isUser && (
                  <button
                    onClick={handleWatchlist}
                    disabled={watchlistLoading}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all"
                    style={{
                      background: inWatchlist ? 'rgba(78,203,141,0.15)' : 'var(--bg-elevated)',
                      color: inWatchlist ? 'var(--success)' : 'var(--text-secondary)',
                      border: inWatchlist ? '1px solid rgba(78,203,141,0.4)' : '1px solid var(--border)',
                      cursor: watchlistLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {watchlistLoading ? '⏳' : inWatchlist ? '✓ In lista' : '+ La mia lista'}
                  </button>
                )}

                {/* ADMIN actions */}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => navigate(`/movies/${id}/edit`)}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      ✏️ Modifica
                    </button>

                    {!deleteConfirm ? (
                      <button
                        onClick={() => setDeleteConfirm(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--danger)', border: '1px solid rgba(224,92,92,0.2)' }}
                      >
                        🗑 Elimina
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sicuro?</span>
                        <button onClick={handleDelete}
                          className="px-4 py-3 rounded-xl text-sm font-semibold"
                          style={{ background: 'var(--danger)', color: 'white' }}>
                          Sì, elimina
                        </button>
                        <button onClick={() => setDeleteConfirm(false)}
                          className="px-4 py-3 rounded-xl text-sm"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          Annulla
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Messaggi di errore trailer */}
              {trailerError && (
                <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  ⚠ {trailerError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
