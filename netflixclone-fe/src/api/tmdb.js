const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'

export const POSTER_URL = (path) =>
  path ? `https://image.tmdb.org/t/p/w500${path}` : null

const get = (path, extraParams = {}) => {
  const params = new URLSearchParams({ api_key: API_KEY, language: 'it-IT', ...extraParams })
  return fetch(`${BASE}${path}?${params}`).then(r => r.json())
}

export const tmdbSearch = (query) =>
  get('/search/movie', { query })

export const tmdbGetMovie = (id) =>
  get(`/movie/${id}`)

// Cerca il trailer YouTube di un film dato il titolo (e opzionalmente l'anno)
export const tmdbFindTrailer = async (title, releaseYear) => {
  const search = await get('/search/movie', { query: title })
  const results = search.results || []
  // Trova il match migliore: stesso anno se possibile, altrimenti il primo
  const match = results.find(r => r.release_date?.startsWith(String(releaseYear)))
    || results[0]
  if (!match) return null

  // Recupera i video (en-US per avere più trailer disponibili)
  const params = new URLSearchParams({ api_key: API_KEY, language: 'en-US' })
  const videos = await fetch(`${BASE}/movie/${match.id}/videos?${params}`).then(r => r.json())
  const trailer = (videos.results || []).find(
    v => v.site === 'YouTube' && v.type === 'Trailer'
  ) || (videos.results || []).find(
    v => v.site === 'YouTube'
  )
  return trailer ? trailer.key : null
}

export const isTmdbConfigured = () =>
  !!API_KEY && API_KEY !== 'qui_metti_la_tua_api_key_tmdb'
