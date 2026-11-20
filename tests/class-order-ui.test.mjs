import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import React from 'react'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.MutationObserver = dom.window.MutationObserver
globalThis.IS_REACT_ACT_ENVIRONMENT = true
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
process.env.VITE_SUPABASE_URL = 'https://example.test'
process.env.VITE_SUPABASE_ANON_KEY = 'test-key'

const records = [
  { id: 'five', name: '5th Math', grade_band: 'K-5', join_code: 'FIVE' },
  { id: 'eight', name: '8th Math', grade_band: '6-8', join_code: 'EIGHT' },
  { id: 'k', name: 'Kindergarten Math', grade_band: 'K-5', join_code: 'KIND' },
  { id: 'six', name: '6th Math', grade_band: '6-8', join_code: 'SIX' },
  { id: 'two', name: '2nd Math', grade_band: 'K-5', join_code: 'TWO' },
]
globalThis.__classOrderClient = {
  auth: {
    async getSession() { return { data: { session: { user: { id: 'teacher' } } }, error: null } },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } },
  },
  from(table) {
    const builder = {
      select() { return builder },
      eq() { return builder },
      order() { return builder },
      single() { return builder },
      then(resolve, reject) {
        const data = table === 'profiles'
          ? { id: 'teacher', role: 'teacher', display_name: 'Teacher' }
          : table === 'classes' ? records : []
        return Promise.resolve({ data, error: null }).then(resolve, reject)
      },
    }
    return builder
  },
}

const { render, fireEvent, waitFor, cleanup } = await import('@testing-library/react')
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  plugins: [{
    name: 'mock-class-order-supabase',
    enforce: 'pre',
    resolveId(source) { if (source === './lib/supabase') return '\0class-order-supabase' },
    load(id) { if (id === '\0class-order-supabase') return 'export const getSupabaseClient = () => globalThis.__classOrderClient' },
  }],
})
const { default: App } = await vite.ssrLoadModule('/src/App.tsx')

after(async () => {
  cleanup()
  await vite.close()
  dom.window.close()
  delete globalThis.__classOrderClient
})

test('opening a grade group and All classes restores grade order', async () => {
  const key = 'stem-challenge-hub-class-order:teacher'
  window.localStorage.setItem(key, JSON.stringify(records.map((record) => record.id)))
  const ui = render(React.createElement(App))
  const group = await ui.findByRole('button', { name: /K-5\s*Discovery/ })
  await waitFor(() => assert.match(group.textContent, /3\s*classes/))
  fireEvent.click(group)
  const names = () => Array.from(ui.container.querySelectorAll('.teacher-class-select strong'), (element) => element.textContent)
  await waitFor(() => assert.deepEqual(names(), ['Kindergarten Math', '2nd Math', '5th Math']))
  assert.deepEqual(JSON.parse(window.localStorage.getItem(key)), ['k', 'eight', 'two', 'six', 'five'])
  fireEvent.click(ui.getByRole('button', { name: 'Move Kindergarten Math down' }))
  assert.deepEqual(names(), ['2nd Math', 'Kindergarten Math', '5th Math'])
  fireEvent.click(ui.getByRole('button', { name: /OPEN CLASS.*2nd Math/ }))
  fireEvent.click(ui.getByRole('button', { name: 'All classes' }))
  assert.deepEqual(names(), ['Kindergarten Math', '2nd Math', '5th Math'])
  fireEvent.click(ui.getByRole('button', { name: 'Move Kindergarten Math down' }))
  fireEvent.click(ui.getByRole('button', { name: 'Change grade group' }))
  fireEvent.click(ui.getByRole('button', { name: /K-5\s*Discovery/ }))
  await waitFor(() => assert.deepEqual(names(), ['Kindergarten Math', '2nd Math', '5th Math']))
})
