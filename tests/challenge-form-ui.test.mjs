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

const { render, fireEvent, cleanup, waitFor } = await import('@testing-library/react')
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const { ChallengeForm } = await vite.ssrLoadModule('/src/components/ChallengeForm.tsx')
afterEach(cleanup)
after(async () => { await vite.close(); dom.window.close() })

function fakeSupabase(initial = []) {
  const rows = { challenges: [...initial], challenge_keys: [] }
  let failKey = false
  const supabase = {
    from(table) {
      let action = 'read'
      let values
      let id
      const builder = {
        select() { return builder },
        single() { return builder },
        eq(field, value) { id = value; return builder },
        insert(value) { action = 'insert'; values = value; return builder },
        update(value) { action = 'update'; values = value; return builder },
        upsert(value) { action = 'upsert'; values = value; return builder },
        delete() { action = 'delete'; return builder },
        then(resolve, reject) {
          if (action === 'upsert' && failKey) {
            failKey = false
            return Promise.resolve({ data: null, error: { message: 'Key save failed' } }).then(resolve, reject)
          }
          let data = null
          if (action === 'insert') {
            data = { id: `c${rows.challenges.length + 1}`, ...values }
            rows.challenges.push(data)
          } else if (action === 'update') {
            Object.assign(rows.challenges.find((row) => row.id === id), values)
          } else if (action === 'upsert') {
            const existing = rows.challenge_keys.find((row) => row.challenge_id === values.challenge_id)
            if (existing) Object.assign(existing, values)
            else rows.challenge_keys.push(values)
          } else if (action === 'delete') {
            rows.challenge_keys = rows.challenge_keys.filter((row) => row.challenge_id !== id)
          } else if (table === 'challenge_keys') {
            data = rows.challenge_keys.find((row) => row.challenge_id === id)
          }
          return Promise.resolve({ data, error: null }).then(resolve, reject)
        },
      }
      return builder
    },
  }
  return { supabase, rows, failNextKey() { failKey = true } }
}

function mount(mock, challenge = null) {
  let saved = 0
  const ui = render(React.createElement(ChallengeForm, {
    challenge, classId: 'class', supabase: mock.supabase,
    onCancel() {}, onSaved() { saved += 1 },
  }))
  return { ui, saved: () => saved }
}

function fillQuestion(ui, title) {
  fireEvent.change(ui.getByLabelText('Challenge title'), { target: { value: title } })
  fireEvent.change(ui.getByLabelText('Prompt'), { target: { value: 'A question?' } })
}

test('allows up to 30 challenges and rejects counts outside that range', () => {
  const { ui } = mount(fakeSupabase())
  const count = ui.getByLabelText('Number of challenges')
  fireEvent.change(count, { target: { value: '31' } })
  fireEvent.submit(count.closest('form'))
  assert.match(ui.getByRole('alert').textContent, /1 to 30/)
  fireEvent.change(count, { target: { value: '30' } })
  fireEvent.submit(count.closest('form'))
  assert.ok(ui.getByRole('heading', { name: 'Challenge 1 of 30' }))
})

test('creates separate challenges sequentially with different answer types', async () => {
  const mock = fakeSupabase()
  const { ui, saved } = mount(mock)
  fireEvent.change(ui.getByLabelText('Number of challenges'), { target: { value: '2' } })
  fireEvent.click(ui.getByRole('button', { name: 'Continue' }))
  assert.ok(ui.getByRole('heading', { name: 'Challenge 1 of 2' }))
  assert.equal(ui.queryByText('Daily challenge'), null)
  assert.ok(ui.getByLabelText('Answer choices'))
  fillQuestion(ui, 'First')
  fireEvent.change(ui.getByLabelText('Answer choices'), { target: { value: 'A\nB' } })
  fireEvent.change(ui.getByLabelText(/^Correct answer/), { target: { value: 'A' } })
  fireEvent.click(ui.getByLabelText(/Publish now/))
  fireEvent.click(ui.getByRole('button', { name: 'Save and next' }))
  await ui.findByRole('heading', { name: 'Challenge 2 of 2' })
  assert.equal(ui.getByLabelText('Challenge title').value, '')
  assert.equal(mock.rows.challenges[0].is_published, true)
  assert.equal(mock.rows.challenge_keys[0].correct_choice, 'A')
  fireEvent.click(ui.getByLabelText('Short answer'))
  fillQuestion(ui, 'Second')
  fireEvent.click(ui.getByRole('button', { name: 'Create challenge' }))
  await waitFor(() => assert.equal(saved(), 1))
  assert.deepEqual(mock.rows.challenges.map((row) => row.answer_type), ['multiple_choice', 'short_answer'])
  assert.equal(mock.rows.challenges[1].is_published, false)
  assert.equal(mock.rows.challenges[1].program_day, null)
})

test('retries a failed answer key without duplicating or publishing the draft', async () => {
  const mock = fakeSupabase()
  const { ui, saved } = mount(mock)
  fireEvent.click(ui.getByRole('button', { name: 'Continue' }))
  fillQuestion(ui, 'Retry')
  fireEvent.change(ui.getByLabelText('Answer choices'), { target: { value: 'A\nB' } })
  fireEvent.change(ui.getByLabelText(/^Correct answer/), { target: { value: 'A' } })
  fireEvent.click(ui.getByLabelText(/Publish now/))
  mock.failNextKey()
  fireEvent.click(ui.getByRole('button', { name: 'Create challenge' }))
  assert.match((await ui.findByRole('alert')).textContent, /saved as a draft/)
  assert.equal(mock.rows.challenges[0].is_published, false)
  fireEvent.click(ui.getByRole('button', { name: 'Create challenge' }))
  await waitFor(() => assert.equal(saved(), 1))
  assert.equal(mock.rows.challenges.length, 1)
  assert.equal(mock.rows.challenges[0].is_published, true)
})

test('editing an existing legacy daily challenge preserves its day and level', async () => {
  const challenge = { id: 'legacy', title: 'Old', prompt: 'Old question', subject: 'Math', grade_band: '3-5', answer_type: 'short_answer', choices: null, is_published: false, program_day: 4, level: 'Easy' }
  const mock = fakeSupabase([challenge])
  const { ui, saved } = mount(mock, challenge)
  fireEvent.change(ui.getByLabelText('Challenge title'), { target: { value: 'Updated' } })
  fireEvent.click(ui.getByRole('button', { name: 'Save changes' }))
  await waitFor(() => assert.equal(saved(), 1))
  assert.equal(mock.rows.challenges[0].program_day, 4)
  assert.equal(mock.rows.challenges[0].level, 'Easy')
})
