import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AuthIllustration } from './AuthIllustration'
import type { UserRole } from '../lib/types'
import { DisplayModeControl } from './DisplayModeControl'
import type { DisplayMode } from './DisplayModeControl'

const rememberedEmailStorageKey = 'stem-challenge-hub-remembered-email'

export function AuthScreen({
  supabase,
  error,
  onError,
  onSignInRoleChange,
  displayMode,
  onDisplayModeChange,
  readAloudEnabled,
  onReadAloudChange,
  recovery = false,
  onRecoveryComplete,
}: {
  supabase: SupabaseClient
  error: string
  onError: (message: string) => void
  onSignInRoleChange?: (role: UserRole | null) => void
  displayMode: DisplayMode
  onDisplayModeChange: (mode: DisplayMode) => void
  readAloudEnabled: boolean
  onReadAloudChange: (enabled: boolean) => void
  recovery?: boolean
  onRecoveryComplete?: () => void
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [role, setRole] = useState<UserRole>('teacher')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [rememberedEmail] = useState(
    () => window.localStorage.getItem(rememberedEmailStorageKey) ?? '',
  )
  const [rememberEmail, setRememberEmail] = useState(
    () => rememberedEmail !== '',
  )
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onError('')
    setNotice('')
    setPending(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const displayName = String(formData.get('displayName') ?? '').trim()

    try {
      if (recovery) {
        const confirmPassword = String(formData.get('confirmPassword') ?? '')
        if (password !== confirmPassword) {
          throw new Error('Your passwords do not match.')
        }
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        })
        if (updateError) throw updateError
        onRecoveryComplete?.()
        return
      }

      if (mode === 'signin') {
        onSignInRoleChange?.(role)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) {
          onSignInRoleChange?.(null)
          throw signInError
        }
        if (rememberEmail) {
          window.localStorage.setItem(rememberedEmailStorageKey, email)
        } else {
          window.localStorage.removeItem(rememberedEmailStorageKey)
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              display_name: displayName,
            },
          },
        })
        if (signUpError) throw signUpError
        if (!data.session) {
          setNotice(
            'Check your email to confirm your account, then come back to sign in.',
          )
        }
      }
    } catch (submitError) {
      if (mode === 'signin' && !recovery) onSignInRoleChange?.(null)
      onError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to authenticate. Please try again.',
      )
    } finally {
      setPending(false)
    }
  }

  async function handlePasswordReset() {
    const email = String(new FormData(formRef.current ?? undefined).get('email') ?? '').trim()
    if (!email) {
      onError('Enter your email address first, then choose Forgot password?')
      return
    }

    onError('')
    setNotice('')
    setPending(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: window.location.origin },
      )
      if (resetError) throw resetError
      setNotice('Check your email for a secure password reset link.')
    } catch (resetError) {
      onError(
        resetError instanceof Error
          ? resetError.message
          : 'Unable to send a password reset email. Please try again.',
      )
    } finally {
      setPending(false)
    }
  }

  const title = recovery
    ? 'Choose a new password'
    : mode === 'signin'
      ? 'Sign in'
      : 'Create an account'

  return (
    <main className="auth-screen">
      <header className="auth-global-header">
        <a className="auth-brand" href="/" aria-label="STEM Challenge Hub home">
          <svg
            aria-hidden="true"
            className="auth-brand-mark"
            viewBox="0 0 40 40"
          >
            <ellipse
              cx="20"
              cy="20"
              rx="17"
              ry="6.5"
              fill="none"
              stroke="#2451d4"
              strokeWidth="2.5"
              transform="rotate(-35 20 20)"
            />
            <ellipse
              cx="20"
              cy="20"
              rx="17"
              ry="6.5"
              fill="none"
              stroke="#f97316"
              strokeWidth="2.5"
              transform="rotate(35 20 20)"
            />
            <circle cx="20" cy="20" r="3" fill="#7c3aed" />
          </svg>
          <span>STEM Challenge Hub</span>
        </a>
        <div className="auth-header-tools">
          <span className="auth-header-status">A curious place to learn</span>
          <details className="auth-preferences-menu">
            <summary aria-label="Open accessibility preferences">
              <span className="auth-menu-lines" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </summary>
            <div className="auth-preferences-panel">
              <p className="eyebrow">ACCESSIBILITY</p>
              <h2>Learning preferences</h2>
              <p className="auth-preferences-intro">
                Adjust how the hub looks and sounds.
              </p>
              <DisplayModeControl
                value={displayMode}
                onChange={onDisplayModeChange}
                readAloudEnabled={readAloudEnabled}
                onReadAloudChange={onReadAloudChange}
              />
            </div>
          </details>
        </div>
      </header>

      <div className="auth-content">
        <section className="auth-intro" aria-labelledby="auth-hero-title">
          <AuthIllustration />
          <div className="auth-welcome">
            <h1 id="auth-hero-title">
              Discover. <span>Create.</span> <em>Solve.</em>
            </h1>
            <p>
              Hands-on STEM challenges for curious minds, from kindergarten to
              12th grade.
            </p>
            <div className="auth-feature-list" aria-label="Hub features">
              <span>K–12 challenges</span>
              <span>Instant feedback</span>
              <span>Class progress</span>
            </div>
          </div>
        </section>

        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-card">
            <h2 id="auth-title">{title}</h2>
            <p className="auth-hint">
              {recovery
                ? 'Use a new password to secure your account.'
                : 'Fictional demo accounts only. No real student data.'}
            </p>

            {error ? (
              <div className="notice notice-error" role="alert">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="notice notice-success" role="status">
                {notice}
              </div>
            ) : null}

            <form className="auth-form" onSubmit={handleSubmit} ref={formRef}>
              {recovery ? (
                <>
                  <PasswordField
                    autoComplete="new-password"
                    label="New password"
                    minLength={8}
                    name="password"
                    placeholder="At least 8 characters"
                    required
                  />
                  <PasswordField
                    autoComplete="new-password"
                    label="Confirm new password"
                    minLength={8}
                    name="confirmPassword"
                    placeholder="Enter your new password again"
                    required
                  />
                </>
              ) : (
                <>
                  <fieldset className="auth-role-field">
                    <legend>I am a...</legend>
                    <div className="role-picker">
                      {(['teacher', 'student'] as const).map((nextRole) => (
                        <button
                          aria-pressed={role === nextRole}
                          className={role === nextRole ? 'is-selected' : ''}
                          disabled={pending}
                          key={nextRole}
                          onClick={() => setRole(nextRole)}
                          type="button"
                        >
                          {nextRole === 'teacher' ? 'Teacher' : 'Student'}
                        </button>
                      ))}
                    </div>
                    {mode === 'signin' ? (
                      <span className="auth-role-hint">
                        Select the role associated with your account.
                      </span>
                    ) : null}
                  </fieldset>

                  {mode === 'signup' ? (
                    <label className="field-label">
                      Display name
                      <input
                        autoComplete="name"
                        maxLength={60}
                        name="displayName"
                        placeholder="What should we call you?"
                        required
                      />
                    </label>
                  ) : null}
                  <label className="field-label">
                    Email
                    <input
                      autoComplete="email"
                      defaultValue={rememberedEmail}
                      name="email"
                      placeholder="you@example.com"
                      required
                      type="email"
                    />
                  </label>
                  <PasswordField
                    autoComplete={
                      mode === 'signin' ? 'current-password' : 'new-password'
                    }
                    label="Password"
                    minLength={8}
                    name="password"
                    placeholder="At least 8 characters"
                    required
                  />
                  {mode === 'signin' ? (
                    <>
                      <div className="auth-remember">
                        <label>
                          <input
                            checked={rememberEmail}
                            onChange={(event) => {
                              const shouldRemember = event.target.checked
                              setRememberEmail(shouldRemember)
                              if (!shouldRemember) {
                                window.localStorage.removeItem(
                                  rememberedEmailStorageKey,
                                )
                              }
                            }}
                            type="checkbox"
                          />
                          Remember my email on this device
                        </label>
                        <span>Your password is never saved.</span>
                      </div>
                      <button
                        className="auth-forgot"
                        disabled={pending}
                        onClick={() => void handlePasswordReset()}
                        type="button"
                      >
                        Forgot password?
                      </button>
                    </>
                  ) : null}
                </>
              )}
              <button
                className="button button-primary auth-submit"
                disabled={pending}
                type="submit"
              >
                {pending
                  ? 'Please wait...'
                  : recovery
                    ? 'Update password'
                    : mode === 'signin'
                      ? 'Sign in'
                      : 'Create account'}
              </button>
            </form>

            {!recovery ? (
              <p className="auth-account-switch">
                {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
                <button
                  disabled={pending}
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin')
                    onError('')
                    setNotice('')
                  }}
                  type="button"
                >
                  {mode === 'signin' ? 'Create an account' : 'Sign in'}
                </button>
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}

function PasswordField({
  autoComplete,
  label,
  minLength,
  name,
  placeholder,
  required,
}: {
  autoComplete: string
  label: string
  minLength: number
  name: string
  placeholder: string
  required: boolean
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="field-label auth-password-field">
      <label htmlFor={name}>{label}</label>
      <div className="auth-password-control">
        <input
          autoComplete={autoComplete}
          id={name}
          minLength={minLength}
          name={name}
          placeholder={placeholder}
          required={required}
          type={visible ? 'text' : 'password'}
        />
        <button
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="auth-password-toggle"
          onClick={() => setVisible((current) => !current)}
          title={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          type="button"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}
