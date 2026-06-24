import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWatchlist, removeFromWatchlist, getFileUrl } from '../api/services'
import Navbar from '../components/Navbar'
import MovieCard from '../components/MovieCard'

export default function WatchlistPage() {
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    getWatchlist()
      .then(res => setMovies(res.data))
      .catch(() => setError('Errore nel caricamento della watchlist'))
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (movieId) => {
    setRemovingId(movieId)
    try {
      await removeFromWatchlist(movieId)
      setMovies(prev => prev.filter(m => m.id !== movieId))
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nella rimozione')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">

        <div className="mb-8">
          <h2 className="font-display text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            La mia lista
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {movies.length} {movies.length === 1 ? 'film salvato' : 'film salvati'}
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-24">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <p style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        )}

        {!loading && !error && movies.length === 0 && (
          <div className="text-center py-24">
            <span className="text-5xl">📋</span>
            <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
              La tua lista è vuota
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Aggiungi film alla lista dalla pagina di dettaglio
            </p>
            <button onClick={() => navigate('/')}
              className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--accent)', color: 'white' }}>
              Sfoglia il catalogo
            </button>
          </div>
        )}

        {!loading && !error && movies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.map(movie => (
              <div key={movie.id} className="relative group">
                <MovieCard movie={movie} />
                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(movie.id) }}
                  disabled={removingId === movie.id}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: 'rgba(224,92,92,0.9)',
                    color: 'white',
                    cursor: removingId === movie.id ? 'not-allowed' : 'pointer',
                  }}
                  title="Rimuovi dalla lista"
                >
                  {removingId === movie.id ? '…' : '×'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
