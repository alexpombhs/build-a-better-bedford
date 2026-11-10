import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import { supabase } from '../supabase'
import './newsletterLike.css'

/** Shared counts are public; each signed-in reader may like an issue once. */
export default function NewsletterLike({ issueId }: { issueId: string }) {
  const [count, setCount] = useState<number | null>(null)
  const [liked, setLiked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    setCount(null)
    setLiked(false)
    setMessage('')
    const load = async () => {
      const [countResult, userResult] = await Promise.all([
        supabase.rpc('newsletter_like_count', { p_issue_id: issueId }),
        supabase.auth.getUser(),
      ])
      if (!active) return
      if (countResult.error) setMessage('Likes are temporarily unavailable.')
      else setCount(Number(countResult.data ?? 0))
      const id = userResult.data.user?.id ?? null
      setUserId(id)
      if (id) {
        const { data } = await supabase.from('newsletter_likes')
          .select('issue_id').eq('issue_id', issueId).eq('user_id', id).maybeSingle()
        if (active) setLiked(Boolean(data))
      }
    }
    void load()
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void load() })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [issueId])

  const toggle = async () => {
    if (busy) return
    if (!userId) {
      setMessage('Sign in to like this newsletter.')
      return
    }
    setBusy(true)
    setMessage('')
    const result = liked
      ? await supabase.from('newsletter_likes').delete().eq('issue_id', issueId).eq('user_id', userId)
      : await supabase.from('newsletter_likes').insert({ issue_id: issueId, user_id: userId })
    if (result.error) {
      setMessage('Could not save your reaction. Please try again.')
    } else {
      setLiked(!liked)
      const refreshed = await supabase.rpc('newsletter_like_count', { p_issue_id: issueId })
      if (!refreshed.error) setCount(Number(refreshed.data ?? 0))
    }
    setBusy(false)
  }
  return <div className="newsletter-like-bar">
    <Button variant={liked ? 'contained' : 'outlined'} size="small"
      startIcon={liked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
      disabled={busy || count === null}
      aria-pressed={liked} onClick={() => void toggle()}>
      {liked ? 'Liked' : 'Like'} · {count ?? '…'}
    </Button>
    {message && <span className="newsletter-like-message" role="status">{message}</span>}
  </div>
}
