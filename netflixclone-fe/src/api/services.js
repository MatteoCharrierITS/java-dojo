import api from './axios'

// Auth
export const login = (credentials) => api.post('/auth/login', credentials)

// Movies
export const getMovies = () => api.get('/movies')
export const searchMovies = (params) => api.get('/movies/search', { params })
export const getMovie = (id) => api.get(`/movies/${id}`)
export const createMovie = (data) => api.post('/movies', data)
export const updateMovie = (id, data) => api.put(`/movies/${id}`, data)
export const deleteMovie = (id) => api.delete(`/movies/${id}`)

// Categories
export const getCategories = () => api.get('/categories')
export const createCategory = (data) => api.post('/categories', data)
export const deleteCategory = (id) => api.delete(`/categories/${id}`)

// Files
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const getFileUrl = (filename) => `/api/files/${filename}`

// Watchlist
export const getWatchlist = () => api.get('/watchlist')
export const addToWatchlist = (movieId) => api.post(`/watchlist/${movieId}`)
export const removeFromWatchlist = (movieId) => api.delete(`/watchlist/${movieId}`)
