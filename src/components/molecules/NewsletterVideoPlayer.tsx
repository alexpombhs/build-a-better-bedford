import { useEffect, useRef, useState } from 'react'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { UiButton } from '../atoms/MuiPrimitives'

type Props = {
  src: string
  label: string
  onRetry: () => void
}

// A screenshot of the *uploaded video*, not a separate stock photo or placeholder.
// Fetching the small clip as a blob avoids cross-origin canvas restrictions on
// private Supabase signed URLs. The original video remains unchanged.
const posterRequests = new Map<string, Promise<string>>()

function captureVideoFrame(src: string): Promise<string> {
  const cacheKey = new URL(src).pathname
  const cached = posterRequests.get(cacheKey)
  if (cached) return cached

  const capture = async (): Promise<string> => {
    const response = await fetch(src)
    if (!response.ok) return ''
    const objectUrl = URL.createObjectURL(await response.blob())
    try {
      return await new Promise<string>(resolve => {
        const video = document.createElement('video')
        video.muted = true
        video.playsInline = true
        video.preload = 'auto'
        let finished = false
        let timer = 0
        const complete = (image: string) => {
          if (finished) return
          finished = true
          window.clearTimeout(timer)
          video.pause()
          video.removeAttribute('src')
          video.load()
          resolve(image)
        }
        const snapshot = () => {
          try {
            const w = video.videoWidth
            const h = video.videoHeight
            if (!w || !h) { complete(''); return }
            const canvas = document.createElement('canvas')
            const scale = Math.min(1, 960 / Math.max(w,h))
            canvas.width = Math.max(1, Math.round(w * scale))
            canvas.height = Math.max(1, Math.round(h * scale))
            const ctx = canvas.getContext('2d')
            if (!ctx) { complete(''); return }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            complete(canvas.toDataURL('image/jpeg', .85))
          } catch { complete('') }
        }
        video.addEventListener('loadeddata', () => {
          // Avoid a possible blank frame at timestamp zero of a screen recording.
          const frameAt = Number.isFinite(video.duration) ? Math.min(.6, video.duration / 4) : 0
          if (frameAt > .05) {
            try { video.currentTime = frameAt; return } catch { /* use first frame */ }
          }
          snapshot()
        }, { once: true })
        video.addEventListener('seeked', snapshot, { once: true })
        video.addEventListener('error', () => complete(''), { once: true })
        timer = window.setTimeout(snapshot, 7000)
        video.src = objectUrl
        video.load()
      })
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }
  const request = capture().catch(() => '').then(image => {
    if (!image) posterRequests.delete(cacheKey)
    return image
  })
  posterRequests.set(cacheKey, request)
  return request
}

/** Public newsletter player: an actual frame from the video with a single
 * unobtrusive play overlay. Recovery links appear only when playback fails. */
export default function NewsletterVideoPlayer({ src, label, onRetry }: Props) {
  const playerRef = useRef<HTMLVideoElement>(null)
  const [poster, setPoster] = useState('')
  const [started, setStarted] = useState(false)
  const [playbackError, setPlaybackError] = useState(false)

  useEffect(() => {
    let mounted = true
    setPoster('')
    void captureVideoFrame(src).then(image => { if (mounted) setPoster(image) })
    return () => { mounted = false }
  }, [src])

  const startPlayback = () => {
    const player = playerRef.current
    if (!player) return
    // Preserve the user's tap: Safari requires a direct play() call.
    void player.play().catch(() => setPlaybackError(true))
  }

  return (
    <div className="newsletter-video-player">
      <div className="newsletter-video-stage">
        <video
          ref={playerRef}
          src={src}
          poster={poster || undefined}
          controls={started}
          playsInline
          preload="metadata"
          aria-label={label}
          onPlay={() => { setStarted(true); setPlaybackError(false) }}
          onError={() => setPlaybackError(true)}
        />
        {!started && !playbackError && (
          <UiButton
            type="button"
            className="newsletter-video-play-overlay"
            aria-label={`Play ${label}`}
            onClick={startPlayback}
          >
            <PlayArrowRoundedIcon aria-hidden="true" />
          </UiButton>
        )}
      </div>
      {playbackError && (
        <div className="newsletter-video-support" role="alert">
          <span className="newsletter-video-error">Video couldn't play.</span>
          <UiButton type="button" size="small" variant="outlined" onClick={onRetry}>
            Retry
          </UiButton>
          <a className="newsletter-video-open" href={src} target="_blank" rel="noopener noreferrer">
            Open directly
          </a>
        </div>
      )}
    </div>
  )
}
