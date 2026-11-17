export type DisplayMode = 'default' | 'color-blind' | 'dyslexia-friendly'

export function DisplayModeControl({
  value,
  onChange,
}: {
  value: DisplayMode
  onChange: (mode: DisplayMode) => void
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

  return (
    <div className="display-mode-control">
      <label htmlFor="display-mode">Display mode</label>
      <select
        id="display-mode"
        onChange={(event) => handleChange(event.target.value)}
        value={value}
      >
        <option value="default">Default</option>
        <option value="color-blind">Color-Blind Friendly</option>
        <option value="dyslexia-friendly">Dyslexia-Friendly</option>
      </select>
    </div>
  )
}
