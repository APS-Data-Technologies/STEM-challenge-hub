import { after, afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import React from 'react'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.MutationObserver = dom.window.MutationObserver
globalThis.FormData = dom.window.FormData
globalThis.IS_REACT_ACT_ENVIRONMENT = true
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
process.env.VITE_SUPABASE_URL = 'https://example.test'
process.env.VITE_SUPABASE_ANON_KEY = 'test-key'
process.env.VITE_PROFILE_PHOTOS_ENABLED = 'true'
URL.createObjectURL = () => 'blob:profile-photo'
URL.revokeObjectURL = () => {}

const { render, fireEvent, cleanup, waitFor, within } = await import('@testing-library/react')
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  plugins: [{
    name: 'mock-photo-supabase',
    enforce: 'pre',
    resolveId(source) { if (source === './lib/supabase') return '\0photo-supabase' },
    load(id) { if (id === '\0photo-supabase') return 'export const getSupabaseClient = () => globalThis.__photoClient' },
  }],
})
const { default: App } = await vite.ssrLoadModule('/src/App.tsx')

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
after(async () => { await vite.close(); dom.window.close(); delete globalThis.__photoClient })

function fakeClient(role) {
  const profile = { id: 'user', role, display_name: 'Test User', avatar_path: null }
  const photos = new Map()
  let updateError = false
  let uploadError = false
  return {
    profile, photos,
    failUpdate() { updateError = true },
    failUpload() { uploadError = true },
    client: {
      auth: {
        async getSession() { return { data: { session: { user: { id: 'user', email: 'demo@example.test' } } }, error: null } },
        onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } },
      },
      from(table) {
        let update
        const builder = {
          select() { return builder },
          eq() { return builder },
          in() { return builder },
          order() { return builder },
          single() { return builder },
          update(values) { update = values; return builder },
          then(resolve, reject) {
            if (update && updateError) {
              updateError = false
              return Promise.resolve({ data: null, error: { message: 'Profile save failed' } }).then(resolve, reject)
            }
            if (update) Object.assign(profile, update)
            return Promise.resolve({ data: table === 'profiles' ? { ...profile } : [], error: null }).then(resolve, reject)
          },
        }
        return builder
      },
      storage: {
        from() {
          return {
            async upload(path, file) {
              if (uploadError) { uploadError = false; return { error: { message: 'Upload failed' } } }
              photos.set(path, file)
              return { error: null }
            },
            async download(path) {
              return photos.has(path) ? { data: photos.get(path), error: null } : { data: null, error: { message: 'Missing photo' } }
            },
            async remove(paths) { paths.forEach((path) => photos.delete(path)); return { error: null } },
          }
        },
      },
    },
  }
}

async function openSettings(ui) {
  fireEvent.click(await ui.findByLabelText('Open account menu for Test User'))
  fireEvent.click(ui.getByRole('button', { name: /Settings & preferences/ }))
  return ui.getByRole('dialog', { name: 'Settings & preferences' })
}

for (const role of ['teacher', 'student']) {
  test(`${role} can upload, replace and remove a profile photo`, async () => {
    const mock = fakeClient(role)
    globalThis.__photoClient = mock.client
    const ui = render(React.createElement(App))
    let dialog = await openSettings(ui)
    const file = new dom.window.File(['picture'], 'first.png', { type: 'image/png' })
    fireEvent.change(within(dialog).getByLabelText(/Profile photo/), { target: { files: [file] } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }))
    await waitFor(() => assert.equal(ui.queryByRole('dialog'), null))
    const firstPath = mock.profile.avatar_path
    assert.ok(mock.photos.has(firstPath))
    await waitFor(() => assert.ok(ui.container.querySelector('.account-menu-trigger img')))
    dialog = await openSettings(ui)
    fireEvent.change(within(dialog).getByLabelText(/Profile photo/), { target: { files: [new dom.window.File(['other'], 'second.webp', { type: 'image/webp' })] } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }))
    await waitFor(() => assert.equal(ui.queryByRole('dialog'), null))
    assert.notEqual(mock.profile.avatar_path, firstPath)
    assert.equal(mock.photos.has(firstPath), false)
    assert.equal(mock.photos.size, 1)
    dialog = await openSettings(ui)
    fireEvent.click(within(dialog).getByLabelText('Remove current photo'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }))
    await waitFor(() => assert.equal(ui.queryByRole('dialog'), null))
    assert.equal(mock.profile.avatar_path, null)
    assert.equal(mock.photos.size, 0)
    assert.equal(ui.container.querySelector('.account-menu-trigger img'), null)
  })
}

test('invalid images and failed saves show errors and do not leave uploaded photos', async () => {
  const mock = fakeClient('student')
  globalThis.__photoClient = mock.client
  const ui = render(React.createElement(App))
  const dialog = await openSettings(ui)
  const input = within(dialog).getByLabelText(/Profile photo/)
  fireEvent.change(input, { target: { files: [new dom.window.File(['svg'], 'bad.svg', { type: 'image/svg+xml' })] } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }))
  assert.match(within(dialog).getByRole('alert').textContent, /JPEG, PNG, or WebP/)
  fireEvent.change(input, { target: { files: [new dom.window.File(['photo'], 'ok.png', { type: 'image/png' })] } })
  mock.failUpload()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }))
  assert.match((await within(dialog).findByRole('alert')).textContent, /Upload failed/)
  mock.failUpdate()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }))
  await waitFor(() => assert.match(within(dialog).getByRole('alert').textContent, /Profile save failed/))
  assert.equal(mock.photos.size, 0)
  assert.equal(mock.profile.avatar_path, null)
})
