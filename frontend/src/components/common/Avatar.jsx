import { useState } from 'react'

const AVATAR_COLORS = ['#00338D', '#0891B2', '#6D28D9', '#0369A1', '#7F3F98', '#0E7490']
function avatarColor(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

// Circular avatar with a robust photo fallback — a broken/missing photo_url
// always resolves to initials, never a blank tile.
export default function Avatar({ name, photoUrl, size = 56 }) {
  const [errored, setErrored] = useState(false)
  const showPhoto = photoUrl && !errored
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm"
      style={{ width: size, height: size, background: showPhoto ? '#F1F5F9' : avatarColor(name) }}
    >
      {showPhoto ? (
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" onError={() => setErrored(true)} />
      ) : (
        <span className="text-white font-black" style={{ fontSize: size * 0.36 }}>{name?.[0]?.toUpperCase() || '?'}</span>
      )}
    </div>
  )
}
