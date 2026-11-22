export type DisplayMode = 'default' | 'color-blind' | 'dyslexia-friendly'

export function DisplayModeControl({
  value,
  onChange,
  readAloudEnabled,
  onReadAloudChange,
}: {
  value: DisplayMode
  onChange: (mode: DisplayMode) => void
  readAloudEnabled: boolean
  onReadAloudChange: (enabled: boolean) => void
}) {
  function handleChange(nextValue: string) {
    if (
      nextValue === 'default' ||
      nextValue === 'color-blind' ||
      nextValue === 'dyslexia-friendly'
    ) {
      onChange(nextValue)
    }
  }

  const speechAvailable =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window

  return (
    <div className="display-mode-control">
      <label className="display-mode-label" htmlFor="display-mode-select">
        <svg
          aria-hidden="true"
          className="display-mode-icon"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 3.5v17M12 3.5a8.5 8.5 0 0 0 0 17" />
        </svg>
        <span>Display mode</span>
      </label>
      <select
        id="display-mode-select"
        onChange={(event) => handleChange(event.target.value)}
        value={value}
      >
        <option value="default">Default</option>
        <option value="color-blind">Color-Blind Friendly</option>
        <option value="dyslexia-friendly">Dyslexia-Friendly</option>
      </select>
      <button
        aria-label={`Read aloud ${readAloudEnabled ? 'on' : 'off'}`}
        aria-describedby="display-mode-voice-note"
        aria-pressed={readAloudEnabled}
        className={`display-mode-voice${readAloudEnabled ? ' is-on' : ''}`}
        disabled={!speechAvailable}
        onClick={() => onReadAloudChange(!readAloudEnabled)}
        title={
          speechAvailable
            ? `Turn spoken feedback ${readAloudEnabled ? 'off' : 'on'}. When on, focused controls and hovered text are read aloud.`
            : 'Spoken feedback is not supported by this browser.'
        }
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          {readAloudEnabled ? (
            <>
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18 5.5a9 9 0 0 1 0 13" />
            </>
          ) : (
            <path d="m16 9 5 6m0-6-5 6" />
          )}
        </svg>
        <span>Read aloud: {readAloudEnabled ? 'On' : 'Off'}</span>
      </button>
      <p className="display-mode-voice-note" id="display-mode-voice-note">
        {speechAvailable
          ? 'When on, spoken feedback reads the name and state of focused controls, and reads headings and text when you hover over them.'
          : 'Spoken feedback is not supported by this browser.'}
      </p>
    </div>
  )
}
