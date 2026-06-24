import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createMovie, uploadFile, getCategories, createCategory, getFileUrl } from '../api/services'
import { tmdbSearch, tmdbGetMovie, POSTER_URL, isTmdbConfigured } from '../api/tmdb'
import Navbar from '../components/Navbar'

const EMPTY_FORM = {
  title: '', description: '', releaseYear: '', durationMinutes: '',
  categoryId: '', rating: '', isFeatured: false, coverImagePath: '',
}

export default function MovieCreatePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const searchRef = useRef(null)

  // Form
  const [form, setForm] = useState(EMPTY_FORM)
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // TMDB search
  const [tmdbQuery, setTmdbQuery] = useState('')
  const [tmdbResults, setTmdbResults] = useState([])
  const [tmdbSearching, setTmdbSearching] = useState(false)
  const [tmdbLoading, setTmdbLoading] = useState(false) // loading full details
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ─── TMDB ────────────────────────────────────────────────────────────────

  const handleTmdbSearch = async () => {
    if (!tmdbQuery.trim()) return
    setTmdbSearching(true)
    setTmdbResults([])
    setShowDropdown(true)
    try {
      const data = await tmdbSearch(tmdbQuery)
      setTmdbResults((data.results || []).slice(0, 6))
    } catch {
      setError('Errore nella ricerca TMDB')
    } finally {
      setTmdbSearching(false)
    }
  }

  const handleTmdbSelect = async (result) => {
    setShowDropdown(false)
    setTmdbLoading(true)
    setError(null)

    try {
      // 1. Fetch dettagli completi (serve per runtime e generi con nomi)
      const details = await tmdbGetMovie(result.id)

      // 2. Gestisci categorie: prendi il primo genere, crealo se non esiste
      let categoryId = ''
      if (details.genres && details.genres.length > 0) {
        const firstGenre = details.genres[0]
        const existing = categories.find(
          c => c.name.toLowerCase() === firstGenre.name.toLowerCase()
        )
        if (existing) {
          categoryId = existing.id
        } else {
          try {
            const newCat = await createCategory({ name: firstGenre.name })
            categoryId = newCat.data.id
            // Aggiorna lista categorie locale
            setCategories(prev => [...prev, newCat.data])
          } catch {
            // 409 = già esiste (race condition) → ricarica e cerca
            const fresh = await getCategories()
            setCategories(fresh.data)
            const found = fresh.data.find(
              c => c.name.toLowerCase() === firstGenre.name.toLowerCase()
            )
            if (found) categoryId = found.id
          }
        }
      }

      // 3. Precompila il form
      const year = details.release_date
        ? parseInt(details.release_date.split('-')[0])
        : ''
      const rating = details.vote_average
        ? Math.round(details.vote_average * 10) / 10
        : ''

      setForm({
        title: details.title || '',
        description: details.overview || '',
        releaseYear: year,
        durationMinutes: details.runtime || '',
        rating,
        isFeatured: false,
        categoryId,
        coverImagePath: '',
      })
      setPreviewUrl(null)

      // 4. Scarica e carica il poster (senza modifiche BE)
      if (details.poster_path) {
        setUploading(true)
        try {
          const posterUrl = POSTER_URL(details.poster_path)
          const imgResponse = await fetch(posterUrl)
          const blob = await imgResponse.blob()
          const file = new File(
            [blob],
            `tmdb_${details.id}.jpg`,
            { type: blob.type || 'image/jpeg' }
          )
          const uploadRes = await uploadFile(file)
          const path = uploadRes.data.path
          setForm(prev => ({ ...prev, coverImagePath: path }))
          setPreviewUrl(getFileUrl(path))
        } catch {
          // poster non critico, continua senza
        } finally {
          setUploading(false)
        }
      }
    } catch {
      setError('Errore nel caricamento dei dettagli TMDB')
    } finally {
      setTmdbLoading(false)
    }
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  const handleField = (key, value) => {
    setForm(p => ({ ...p, [key]: value }))
    setError(null)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const res = await uploadFile(file)
      const path = res.data.path
      handleField('coverImagePath', path)
      setPreviewUrl(getFileUrl(path))
    } catch (err) {
      setError(err.response?.data?.message || 'Errore upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.title.trim()) { setError('Il titolo è obbligatorio'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        releaseYear: form.releaseYear ? parseInt(form.releaseYear) : null,
        durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : null,
        categoryId: form.categoryId || null,
        rating: form.rating ? parseFloat(form.rating) : null,
        isFeatured: form.isFeatured,
        coverImagePath: form.coverImagePath || null,
      }
      const res = await createMovie(payload)
      navigate(`/movies/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nella creazione')
    } finally {
      setSaving(false)
    }
  }

  const tmdbOk = isTmdbConfigured()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16">

        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 mb-6 text-sm"
          style={{ color: 'var(--text-muted)' }}>
          ← Indietro
        </button>

        <h1 className="font-display text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
          Aggiungi film
        </h1>

        {/* ─── TMDB Search ─────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Cerca su TMDB
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
              autocomplete
            </span>
          </div>

          {!tmdbOk ? (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', color: 'var(--text-secondary)' }}>
              Aggiungi la tua API key TMDB in{' '}
              <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--bg-elevated)' }}>
                netflixclone-fe/.env
              </code>
              {' '}→{' '}
              <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--bg-elevated)' }}>
                VITE_TMDB_API_KEY=la_tua_key
              </code>
              , poi riavvia il dev server.
              Puoi ottenerla gratuitamente su{' '}
              <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                themoviedb.org
              </a>
            </div>
          ) : (
            <div ref={searchRef} className="relative">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={tmdbQuery}
                  onChange={e => { setTmdbQuery(e.target.value); if (!e.target.value) setShowDropdown(false) }}
                  onKeyDown={e => e.key === 'Enter' && handleTmdbSearch()}
                  placeholder="es. Inception, Il Padrino..."
                  disabled={tmdbLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    opacity: tmdbLoading ? 0.6 : 1,
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  onClick={handleTmdbSearch}
                  disabled={tmdbSearching || tmdbLoading || !tmdbQuery.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  style={{
                    background: tmdbSearching || tmdbLoading ? 'var(--bg-elevated)' : 'var(--accent)',
                    color: tmdbSearching || tmdbLoading ? 'var(--text-muted)' : 'white',
                    cursor: tmdbSearching || tmdbLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {tmdbSearching ? (
                    <span className="flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce inline-block"
                          style={{ background: 'currentColor', animationDelay: `${i*0.15}s` }} />
                      ))}
                    </span>
                  ) : '🔍 Cerca'}
                </button>
              </div>

              {/* Dropdown risultati */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}>
                  {tmdbSearching && (
                    <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      Ricerca in corso...
                    </div>
                  )}
                  {!tmdbSearching && tmdbResults.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      Nessun risultato
                    </div>
                  )}
                  {!tmdbSearching && tmdbResults.map((r, i) => (
                    <button
                      key={r.id}
                      onClick={() => handleTmdbSelect(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                      style={{
                        borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                        background: 'transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,252,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Mini poster */}
                      <div className="flex-shrink-0 w-8 h-12 rounded overflow-hidden"
                        style={{ background: 'var(--bg-card)' }}>
                        {r.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {r.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {r.release_date ? r.release_date.split('-')[0] : '—'}
                          {r.vote_average ? ` · ★ ${Math.round(r.vote_average * 10) / 10}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Loading overlay dettagli */}
              {tmdbLoading && (
                <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--accent)' }}>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: 'var(--accent)', animationDelay: `${i*0.15}s` }} />
                    ))}
                  </div>
                  Caricamento dati e poster...
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Form ──────────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Cover */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--accent)' }}>
              Copertina
            </label>
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-28 rounded-xl overflow-hidden"
                style={{ aspectRatio: '2/3', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl">🎬</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {previewUrl
                    ? 'Poster caricato automaticamente da TMDB. Puoi sostituirlo caricando un\'altra immagine.'
                    : 'Verrà caricata automaticamente da TMDB, oppure puoi caricarla manualmente.'}
                </p>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: uploading ? 'var(--bg-elevated)' : 'var(--accent-glow)',
                    color: uploading ? 'var(--text-muted)' : 'var(--accent)',
                    border: '1px solid rgba(124,92,252,0.3)',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {uploading ? '⏳ Caricamento...' : '📁 Scegli file'}
                </button>
              </div>
            </div>
          </div>

          {/* Campi */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>
              Informazioni
            </label>

            <Field label="Titolo *">
              <input type="text" value={form.title}
                onChange={e => handleField('title', e.target.value)}
                placeholder="es. Inception" className="input-field" />
            </Field>

            <Field label="Descrizione">
              <textarea value={form.description}
                onChange={e => handleField('description', e.target.value)}
                rows={3} placeholder="Trama del film..." className="input-field resize-none" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Anno di uscita">
                <input type="number" value={form.releaseYear}
                  onChange={e => handleField('releaseYear', e.target.value)}
                  placeholder="es. 2023" className="input-field" />
              </Field>
              <Field label="Durata (min)">
                <input type="number" value={form.durationMinutes}
                  onChange={e => handleField('durationMinutes', e.target.value)}
                  placeholder="es. 120" className="input-field" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Rating (0-10)">
                <input type="number" step="0.1" min="0" max="10" value={form.rating}
                  onChange={e => handleField('rating', e.target.value)}
                  placeholder="es. 8.5" className="input-field" />
              </Field>
              <Field label="Categoria">
                <select value={form.categoryId}
                  onChange={e => handleField('categoryId', e.target.value)}
                  className="input-field">
                  <option value="">— Nessuna —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>In evidenza</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Appare nella sezione hero del catalogo</p>
              </div>
              <button
                onClick={() => handleField('isFeatured', !form.isFeatured)}
                className="relative w-11 h-6 rounded-full transition-all"
                style={{ background: form.isFeatured ? 'var(--accent)' : 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all"
                  style={{
                    background: form.isFeatured ? 'white' : 'var(--text-muted)',
                    transform: form.isFeatured ? 'translateX(20px)' : 'translateX(0)',
                  }} />
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.3)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={saving || uploading || tmdbLoading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: (saving || uploading || tmdbLoading) ? 'var(--accent-dim)' : 'var(--accent)',
              color: 'white',
              cursor: (saving || uploading || tmdbLoading) ? 'not-allowed' : 'pointer',
              boxShadow: (saving || uploading || tmdbLoading) ? 'none' : '0 0 30px rgba(124,92,252,0.35)',
            }}
          >
            {saving ? 'Creazione...' : '+ Crea film'}
          </button>
        </div>
      </main>

      <style>{`
        .input-field {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: var(--accent); }
        .input-field option { background: var(--bg-elevated); color: var(--text-primary); }
      `}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
