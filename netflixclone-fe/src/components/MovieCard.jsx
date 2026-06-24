import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFileUrl } from '../api/services'

export default function MovieCard({ movie }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  const coverUrl = movie.coverImagePath && !imgError
    ? getFileUrl(movie.coverImagePath)
    : null

  return (
    <div
      onClick={() => navigate(`/movies/${movie.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        aspectRatio: '2/3',
        background: 'var(--bg-elevated)',
        border: hovered ? '1px solid var(--accent)' : '1px solid var(--border)',
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? '0 12px 40px rgba(124,92,252,0.25)' : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Cover image */}
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={movie.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-card))' }}>
          <span className="text-4xl">🎬</span>
          <span className="text-xs text-center px-2" style={{ color: 'var(--text-muted)' }}>
            {movie.title}
          </span>
        </div>
      )}

      {/* Overlay on hover */}
      <div className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.4) 50%, transparent 100%)',
          opacity: hovered ? 1 : 0.6,
        }}
      />

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
          {movie.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {movie.rating && (
            <span className="text-xs font-medium" style={{ color: 'var(--gold)' }}>
              ★ {movie.rating}
            </span>
          )}
          {movie.releaseYear && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {movie.releaseYear}
            </span>
          )}
        </div>
        {movie.categoryName && (
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
            {movie.categoryName}
          </span>
        )}
      </div>

      {/* Featured badge */}
      {movie.isFeatured && (
        <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'var(--gold)', color: '#0a0a0f' }}>
          In evidenza
        </div>
      )}
    </div>
  )
}
