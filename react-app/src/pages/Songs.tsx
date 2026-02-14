import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'

interface Song {
  song_id?: string
  title?: string
  artist?: string
  album?: string
  spotify_url?: string
}

// Extract track ID from Spotify URL
function getSpotifyTrackId(url: string | undefined): string | null {
  if (!url) return null
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

export default function Songs() {
  const pageTitle = 'Songs — Mark Hendrickson'
  const pageDesc = 'A curated list of favorite songs on Spotify.'
  const canonicalUrl = 'https://markmhendrickson.com/songs'
  const defaultOgImage = 'https://markmhendrickson.com/images/og-default-1200x630.jpg'
  const ogImageWidth = 1200
  const ogImageHeight = 630

  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'album'>('title')

  useEffect(() => {
    const loadSongs = async () => {
      try {
        // Try to load from public JSON file
        const response = await fetch('/data/songs.json')
        if (response.ok) {
          const data = await response.json() as Song[]
          setSongs(data)
        } else {
          console.warn('Songs JSON not found, using empty array')
          setSongs([])
        }
      } catch (error) {
        console.error('Error loading songs:', error)
        setSongs([])
      } finally {
        setLoading(false)
      }
    }

    loadSongs()
  }, [])

  // Sort songs
  const processedSongs = [...songs].sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '')
      } else if (sortBy === 'artist') {
        return (a.artist || '').localeCompare(b.artist || '')
      } else if (sortBy === 'album') {
        return (a.album || '').localeCompare(b.album || '')
      }
      return 0
    })

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={defaultOgImage} />
        <meta property="og:image:width" content={String(ogImageWidth)} />
        <meta property="og:image:height" content={String(ogImageHeight)} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={defaultOgImage} />
        <meta name="twitter:image:width" content={String(ogImageWidth)} />
        <meta name="twitter:image:height" content={String(ogImageHeight)} />
      </Helmet>
      <div className="flex justify-center items-center min-h-content pt-8 pb-4 px-4 md:py-20 md:px-8">
        <div className="max-w-[800px] w-full">
          <h1 className="text-[28px] font-medium mb-2 tracking-tight">Songs</h1>
          <p className="text-[17px] text-[#666] mb-8 font-light tracking-wide">
            My favorite songs on Spotify
          </p>

          {/* Controls */}
          <div className="mb-8 flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-[14px] text-[#666]">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'title' | 'artist' | 'album')}
                className="px-3 py-1.5 text-[14px] border border-[#e0e0e0] rounded bg-white focus:outline-none focus:border-[#999]"
              >
                <option value="title">Title</option>
                <option value="artist">Artist</option>
                <option value="album">Album</option>
              </select>
            </div>
            <div className="text-[14px] text-[#999]">
              {processedSongs.length} {processedSongs.length === 1 ? 'song' : 'songs'}
            </div>
          </div>

          {loading ? (
            <p className="text-[15px] text-[#666]">Loading songs...</p>
          ) : processedSongs.length === 0 ? (
            <p className="text-[15px] text-[#666]">No songs found.</p>
          ) : (
            <div className="space-y-6">
              {processedSongs.map((song, index) => {
                const trackId = getSpotifyTrackId(song.spotify_url)
                return (
                  <div
                    key={song.song_id || index}
                    className="border-b border-[#e0e0e0] pb-6 last:border-0 last:pb-0"
                  >
                    <div className="mb-3">
                      <h3 className="text-[18px] font-medium tracking-tight mb-1">
                        {song.title || 'Unknown Title'}
                      </h3>
                      <p className="text-[15px] text-[#666] mb-1">
                        {song.artist || 'Unknown Artist'}
                      </p>
                      {song.album && (
                        <p className="text-[14px] text-[#999] italic">
                          {song.album}
                        </p>
                      )}
                    </div>

                    {trackId && (
                      <div className="mt-3">
                        <iframe
                          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
                          width="100%"
                          height="152"
                          frameBorder="0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          style={{ borderRadius: '12px' }}
                          className="max-w-full"
                          title={`${song.title || 'Song'} by ${song.artist || 'Unknown Artist'}`}
                        />
                      </div>
                    )}

                    {song.spotify_url && !trackId && (
                      <a
                        href={song.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-[13px] text-[#666] hover:text-black underline"
                      >
                        Open in Spotify
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
