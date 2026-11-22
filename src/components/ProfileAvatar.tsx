import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '../lib/types'

export const profilePhotosEnabled = import.meta.env.VITE_PROFILE_PHOTOS_ENABLED === 'true'
export const profilePhotoBucket = 'profile-photos'

export function ProfileAvatar({ profile, supabase, className }: {
  profile: Profile
  supabase: SupabaseClient
  className: string
}) {
  const [photo, setPhoto] = useState<{ path: string; url: string } | null>(null)
  const [failedPath, setFailedPath] = useState('')
  const path = profilePhotosEnabled ? profile.avatar_path : null

  useEffect(() => {
    if (!path) return
    let active = true
    let url = ''
    void (async () => {
      try {
        const { data, error } = await supabase.storage.from(profilePhotoBucket).download(path)
        if (!active) return
        if (error || !data) throw error ?? new Error('Photo data is unavailable')
        url = URL.createObjectURL(data)
        setFailedPath('')
        setPhoto({ path, url })
      } catch {
        if (active) setFailedPath(path)
      }
    })()
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [path, supabase])

  const src = photo && photo.path === path ? photo.url : ''
  const failed = Boolean(path && failedPath === path)
  return (
    <span className={`${className}${failed ? ' profile-avatar-error' : ''}`} title={failed ? 'Profile photo could not be loaded' : undefined}>
      {src && !failed ? <img alt="" src={src} onError={() => setFailedPath(path ?? '')} /> : profile.display_name.slice(0, 1).toUpperCase()}
      {failed ? <span className="profile-avatar-warning" aria-label="Profile photo could not be loaded">!</span> : null}
    </span>
  )
}
