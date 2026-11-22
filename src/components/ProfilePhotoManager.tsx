import { useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '../lib/types'

export function ProfilePhotoManager({
  profile,
  supabase,
  onPhotoUpdated,
  onPhotoRemoved,
  disabled = false,
}: {
  profile: Profile
  supabase: SupabaseClient
  onPhotoUpdated: (avatarPath: string) => void
  onPhotoRemoved: () => void
  disabled?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    try {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed')
      }

      // Validate file size (2MB)
      const maxSize = 2 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error('File must be smaller than 2MB')
      }

      // Delete old photo if exists
      if (profile.avatar_path) {
        await supabase.storage.from('profile-photos').remove([profile.avatar_path])
      }

      // Generate unique filename
      const timestamp = Date.now()
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${timestamp}.${ext}`
      const filePath = `${profile.id}/${filename}`

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Update profile with new avatar path
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_path: filePath })
        .eq('id', profile.id)

      if (updateError) throw updateError

      onPhotoUpdated(filePath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!profile.avatar_path) return

    setError('')
    setRemoving(true)

    try {
      // Delete photo from storage
      await supabase.storage.from('profile-photos').remove([profile.avatar_path])

      // Clear avatar_path in profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_path: null })
        .eq('id', profile.id)

      if (updateError) throw updateError

      onPhotoRemoved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Removal failed')
    } finally {
      setRemoving(false)
    }
  }

  const isLoading = uploading || removing
  const hasPhoto = Boolean(profile.avatar_path)

  return (
    <div className="profile-photo-manager">
      <div className="profile-photo-actions">
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={disabled || isLoading}
          className="profile-photo-upload-btn"
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
        {hasPhoto && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isLoading}
            className="profile-photo-remove-btn"
          >
            {removing ? 'Removing...' : 'Remove Photo'}
          </button>
        )}
      </div>
      {error && <div className="profile-photo-error">{error}</div>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || isLoading}
        style={{ display: 'none' }}
      />
      <div className="profile-photo-info">
        <p className="profile-photo-info-text">
          Supported formats: JPEG, PNG, WebP • Max size: 2MB
        </p>
      </div>
    </div>
  )
}
