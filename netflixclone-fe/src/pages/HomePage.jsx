import { useState, useEffect, useCallback } from 'react'
import { searchMovies, getCategories } from '../api/services'
import Navbar from '../components/Navbar'
import MovieCard from '../components/MovieCard'

export default function HomePage() {
  const [movies, setMovies] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMovies = useCallback(async (searchVal, catId) => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (searchVal) params.title = searchVal
      if (catId) params.categoryId = catId
      const res = await searchMovies(params)
      setMovies(res.data)
    } catch {
      setError('Errore nel caricamento dei film')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(() => {})
    fetchMovies('', null)
  }, [fetchMovies])

  const handleSearch = (val) => {
    setSearch(val)
    setSelectedCategory(null)
    fetchMovies(val, null)
  }

  const handleCategory = (catId) => {
    const next = catId === selectedCategory ? null : catId
    setSelectedCategory(next)
    setSearch('')
    fetchMovies('', next)
  }

  const featured = movies.filter(m => m.isFeatured)
  const regular = movies.filter(m => !m.isFeatured)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar onSearch={handleSearch} />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">

        {/* Header */}
        <div className="mb-8">
          <h2 className="font-display text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {search ? `Risultati per "${search}"` : 'Catalogo'}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {movies.length} {movies.length === 1 ? 'titolo' : 'titoli'} disponibili
          </p>
        </div>

        {/* Category filters */}
        {!search && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => handleCategory(null)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: !selectedCategory ? 'var(--accent)' : 'var(--bg-elevated)',
                color: !selectedCategory ? 'white' : 'var(--text-secondary)',
                border: !selectedCategory ? 'none' : '1px solid var(--border)',
                boxShadow: !selectedCategory ? '0 0 20px var(--accent-glow)' : 'none',
              }}
            >
              Tutti
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.id)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: selectedCategory === cat.id ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: selectedCategory === cat.id ? 'white' : 'var(--text-secondary)',
                  border: selectedCategory === cat.id ? 'none' : '1px solid var(--border)',
                  boxShadow: selectedCategory === cat.id ? '0 0 20px var(--accent-glow)' : 'none',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{
                  background: 'var(--accent)',
                  animationDelay: `${i * 0.15}s`
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16">
            <p style={{ color: 'var(--danger)' }}>{error}</p>
            <button onClick={() => fetchMovies(search, selectedCategory)}
              className="mt-4 px-4 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              Riprova
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && movies.length === 0 && (
          <div className="text-center py-24">
            <span className="text-5xl">🎬</span>
            <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>Nessun film trovato</p>
          </div>
        )}

        {/* Featured section */}
        {!loading && !error && featured.length > 0 && !search && !selectedCategory && (
          <section className="mb-10">
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
              In evidenza
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featured.map(m => <MovieCard key={m.id} movie={m} />)}
            </div>
          </section>
        )}

        {/* All movies */}
        {!loading && !error && (search || selectedCategory ? movies : regular).length > 0 && (
          <section>
            {!search && !selectedCategory && (
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                Tutti i titoli
              </h3>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(search || selectedCategory ? movies : regular).map(m => <MovieCard key={m.id} movie={m} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
