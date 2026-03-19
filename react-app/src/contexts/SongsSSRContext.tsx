import React from 'react'

export interface SongSSR {
  song_id?: string
  title?: string
  artist?: string
  album?: string
  spotify_url?: string
}

const SongsSSRContext = React.createContext<SongSSR[] | null>(null)

const SCRIPT_ID = 'songs-ssr-data'

export function SongsSSRProvider({
  songs,
  children,
}: {
  songs: SongSSR[] | null
  children: React.ReactNode
}) {
  return (
    <SongsSSRContext.Provider value={songs}>
      {songs != null && songs.length > 0 && (
        <script
          type="application/json"
          id={SCRIPT_ID}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(songs) }}
        />
      )}
      {children}
    </SongsSSRContext.Provider>
  )
}

export function useSongsSSR(): SongSSR[] | null {
  return React.useContext(SongsSSRContext)
}

export function getSongsSSRFromDom(): SongSSR[] | null {
  if (typeof document === 'undefined') return null
  const el = document.getElementById(SCRIPT_ID)
  if (!el?.textContent) return null
  try {
    const parsed = JSON.parse(el.textContent) as SongSSR[]
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}
