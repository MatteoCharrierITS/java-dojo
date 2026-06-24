import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import MovieDetailPage from './pages/MovieDetailPage'
import MovieEditPage from './pages/MovieEditPage'
import MovieCreatePage from './pages/MovieCreatePage'
import CategoryManagePage from './pages/CategoryManagePage'
import WatchlistPage from './pages/WatchlistPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={
            <ProtectedRoute><HomePage /></ProtectedRoute>
          } />

          <Route path="/movies/new" element={
            <ProtectedRoute adminOnly><MovieCreatePage /></ProtectedRoute>
          } />

          <Route path="/movies/:id" element={
            <ProtectedRoute><MovieDetailPage /></ProtectedRoute>
          } />

          <Route path="/movies/:id/edit" element={
            <ProtectedRoute adminOnly><MovieEditPage /></ProtectedRoute>
          } />

          <Route path="/categories" element={
            <ProtectedRoute adminOnly><CategoryManagePage /></ProtectedRoute>
          } />

          <Route path="/watchlist" element={
            <ProtectedRoute><WatchlistPage /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
