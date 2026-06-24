import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMovie, updateMovie, uploadFile, getCategories, getFileUrl } from '../api/services'
import Navbar from '../components/Navbar'

export default function MovieEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    releaseYear: '',
    durationMinutes: '',
    categoryId: '',
    rating: '',
    isFeatured: false,
    coverImagePath: '',
  })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    Promise.all([getMovie(id), getCategories()])
      .then(([movieRes, catRes]) => {
        const m = movieRes.data
        setForm({
          title: m.title || '',
          description: m.description || '',
          releaseYear: m.releaseYear || '',
          durationMinutes: m.durationMinutes || '',
          categoryId: m.categoryId || '',
          rating: m.rating || '',
          isFeatured: m.isFeatured || false,
          coverImagePath: m.coverImagePath || '',
        })
        setCategories(catRes.data)
        if (m.coverImagePath) setPreviewUrl(getFileUrl(m.coverImagePath))
      })
      .catch(() => setError('Errore nel caricamento'))
      .finally(() => setLoading(false))
  }, [id])

  const handleField = (key, value) => {
    setForm(p => ({ ...p, [key]: value }))
    setSuccess(false)
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

  const handleSave = async () => {
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
      await updateMovie(id, payload)
      setSuccess(true)
      setTimeout(() => navigate(`/movies/${id}`), 1200)
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16">

        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 mb-6 text-sm"
          style={{ color: 'var(--text-muted)' }}>
          ← Indietro
        </button>

        <h1 className="font-display text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
          Modifica film
        </h1>

        <div className="space-y-5">

          {/* Cover upload */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--accent)' }}>
              Copertina
            </label>
            <div className="flex items-start gap-5">
              {/* Preview */}
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
                  Carica un'immagine per la copertina del film. Il file verrà salvato sul server e il path aggiornato automaticamente.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: uploading ? 'var(--bg-elevated)' : 'var(--accent-glow)',
                    color: uploading ? 'var(--text-muted)' : 'var(--accent)',
                    border: '1px solid rgba(124,92,252,0.3)',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {uploading ? '⏳ Caricamento...' : '📁 Scegli file'}
                </button>
                {form.coverImagePath && (
                  <p className="mt-2 text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {form.coverImagePath}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>
              Informazioni
            </label>

            <Field label="Titolo *">
              <input type="text" value={form.title}
                onChange={e => handleField('title', e.target.value)}
                className="input-field" />
            </Field>

            <Field label="Descrizione">
              <textarea value={form.description}
                onChange={e => handleField('description', e.target.value)}
                rows={3} className="input-field resize-none" />
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

          {/* Feedback */}
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.3)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(78,203,141,0.1)', border: '1px solid rgba(78,203,141,0.3)', color: 'var(--success)' }}>
              ✓ Salvato! Reindirizzamento in corso...
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: saving ? 'var(--accent-dim)' : 'var(--accent)',
              color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 0 30px rgba(124,92,252,0.35)',
            }}
          >
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
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
        .input-field:focus {
          border-color: var(--accent);
        }
        .input-field option {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
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
