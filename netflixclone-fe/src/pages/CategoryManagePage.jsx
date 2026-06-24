import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategories, createCategory, deleteCategory } from '../api/services'
import Navbar from '../components/Navbar'

export default function CategoryManagePage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const load = () => {
    setLoading(true)
    getCategories()
      .then(res => setCategories(res.data))
      .catch(() => setError('Errore nel caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      await createCategory({ name: newName.trim() })
      setNewName('')
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nella creazione')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nella cancellazione')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16">

        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 mb-6 text-sm"
          style={{ color: 'var(--text-muted)' }}>
          ← Indietro
        </button>

        <h1 className="font-display text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
          Gestisci categorie
        </h1>

        {/* Create form */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--accent)' }}>
            Nuova categoria
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => { setNewName(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="es. Fantascienza"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: creating || !newName.trim() ? 'var(--bg-elevated)' : 'var(--accent)',
                color: creating || !newName.trim() ? 'var(--text-muted)' : 'white',
                cursor: creating || !newName.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {creating ? '...' : '+ Aggiungi'}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
          )}
        </div>

        {/* List */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {categories.length} {categories.length === 1 ? 'categoria' : 'categorie'}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: 'var(--text-muted)' }}>Nessuna categoria ancora</p>
            </div>
          ) : (
            <ul>
              {categories.map((cat, i) => (
                <li key={cat.id}
                  className="flex items-center justify-between px-6 py-4"
                  style={{
                    borderBottom: i < categories.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(cat.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={deletingId === cat.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: 'rgba(224,92,92,0.1)',
                      color: 'var(--danger)',
                      border: '1px solid rgba(224,92,92,0.2)',
                      cursor: deletingId === cat.id ? 'not-allowed' : 'pointer',
                      opacity: deletingId === cat.id ? 0.5 : 1,
                    }}
                  >
                    {deletingId === cat.id ? '...' : 'Elimina'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
