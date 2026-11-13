import { useRef, useState } from 'react'
import { UiButton } from '../atoms/MuiPrimitives'

type Props = {
  src: string
  label: string
  onRetry: () => void
}

/** Uploaded newsletter video with an explicit user-gesture play action for iOS,
 * plus recovery controls if the browser cannot decode or fetch the file. */
export default function NewsletterVideoPlayer({ src, label, onRetry }: Props) {
  const playerRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const [playbackError, setPlaybackError] = useState(false)

  const startPlayback = () => {
    const player = playerRef.current
    if (!player) return
    // Safari can defer all network activity until a user taps Play.
    // Calling play() directly from this click preserves the user gesture.
    void player.play().catch(() => setPlaybackError(true))
  }

  return (
    <div className="newsletter-video-player">
      <video
        ref={playerRef}
        src={src}
        controls
        playsInline
        preload="metadata"
        aria-label={label}
        onPlay={() => { setStarted(true); setPlaybackError(false) }}
        onError={() => setPlaybackError(true)}
      />
      <div className="newsletter-video-support">
        {playbackError && <span role="alert" className="newsletter-video-error">
          This video could not play here. Try again, or open the file directly.
        </span>}
        {!started && !playbackError && (
          <UiButton type="button" variant="outlined" size="small" onClick={startPlayback}>
            Play video
          </UiButton>
        )}
        {playbackError && (
          <UiButton type="button" variant="outlined" size="small" onClick={onRetry}>
            Retry video
          </UiButton>
        )}
        <a className="newsletter-video-open" href={src} target="_blank" rel="noopener noreferrer">
          Open video directly
        </a>
      </div>
    </div>
  )
}
