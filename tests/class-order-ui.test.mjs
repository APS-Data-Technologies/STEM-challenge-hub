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
const classOrderClient = {
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
    globalThis.__classOrderClient = classOrderClient
    return builder
  },
}

const { render, fireEvent, waitFor, cleanup, act } = await import('@testing-library/react')
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

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  globalThis.__classOrderClient = classOrderClient
})
after(async () => {
  await vite.close()
  dom.window.close()
  delete globalThis.__classOrderClient
})

function refreshClient(role = 'teacher') {
  let hold = false
  const pending = {}
  const rows = {
    classes: [{ id: 'nine', name: 'Grade 9th Math', grade_band: '9-12', join_code: 'NINE' }],
    challenges: [],
    enrollments: role === 'student' ? [{ class_id: 'nine', student_id: 'student' }] : [],
    submissions: [],
    daily_programs: [],
    daily_program_questions: [],
    daily_program_answers: [],
    daily_program_keys: [],
  }
  const client = {
    auth: {
      async getSession() { return { data: { session: { user: { id: role } } }, error: null } },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } },
    },
    async rpc() {
      return { data: { total_questions: 1, answered_questions: 0, completed_days: 0, current_streak: 0, longest_streak: 0 }, error: null }
    },
    from(table) {
      const builder = {
        select() { return builder },
        eq() { return builder },
        in() { return builder },
        order() { return builder },
        single() { return builder },
        then(resolve, reject) {
          const response = () => ({
            data: table === 'profiles' ? { id: role, role, display_name: role === 'teacher' ? 'Teacher' : 'Student' } : rows[table],
            error: null,
          })
          if (hold && ['classes', 'challenges', 'daily_programs', 'daily_program_questions'].includes(table)) {
            return new Promise((done) => {
              pending[table] = (error) => done(error ? { data: null, error: { message: error } } : response())
            }).then(resolve, reject)
          }
          return Promise.resolve(response()).then(resolve, reject)
        },
      }
      return builder
    },
  }
  return { client, rows, pending, hold() { hold = true }, unhold() { hold = false } }
}

async function openRefreshClass(mock) {
  globalThis.__classOrderClient = mock.client
  const ui = render(React.createElement(App))
  const group = await ui.findByRole('button', { name: /9-12\s*Innovators/ })
  await waitFor(() => assert.match(group.textContent, /1\s*class/))
  fireEvent.click(group)
  fireEvent.click(ui.getByRole('button', { name: /OPEN CLASS.*Grade 9th Math/ }))
  await ui.findByRole('heading', { name: 'Your next great question starts here' })
  return ui
}

test('refresh shows progress until class and challenge data are reloaded', async () => {
  const mock = refreshClient()
  const ui = await openRefreshClass(mock)
  mock.rows.challenges.push({
    id: 'new', class_id: 'nine', title: 'Updated challenge', prompt: 'Question?',
    subject: 'Math', grade_band: '9-12', answer_type: 'short_answer', is_published: true,
  })
  mock.hold()
  fireEvent.click(ui.getByRole('button', { name: 'Refresh class' }))
  assert.match(ui.getByRole('status').textContent, /Refreshing class/)
  assert.equal(ui.getByRole('button', { name: 'Refresh class' }).disabled, true)
  await waitFor(() => assert.ok(mock.pending.classes && mock.pending.challenges))
  await act(async () => mock.pending.classes())
  assert.match(ui.getByRole('status').textContent, /Refreshing class/)
  await act(async () => mock.pending.challenges())
  await ui.findByRole('heading', { name: 'Updated challenge' })
  assert.match(ui.getByRole('status').textContent, /Class refreshed/)
  assert.equal(ui.getByRole('button', { name: 'Refresh class' }).disabled, false)
})

for (const failedTable of ['classes', 'challenges']) {
  test(`refresh reports ${failedTable} errors without claiming success`, async () => {
    const mock = refreshClient()
    const ui = await openRefreshClass(mock)
    mock.hold()
    fireEvent.click(ui.getByRole('button', { name: 'Refresh class' }))
    await waitFor(() => assert.ok(mock.pending.classes && mock.pending.challenges))
    await act(async () => mock.pending[failedTable]('Refresh failed'))
    assert.match((await ui.findByRole('alert')).textContent, /Refresh failed/)
    await act(async () => mock.pending[failedTable === 'classes' ? 'challenges' : 'classes']())
    assert.equal(ui.queryByText('Class refreshed.'), null)
    assert.equal(ui.getByRole('button', { name: 'Refresh class' }).disabled, false)
  })
}

test('a later reload must finish both requests before refresh completes', async () => {
  const mock = refreshClient()
  const ui = await openRefreshClass(mock)
  mock.hold()
  fireEvent.click(ui.getByRole('button', { name: 'Refresh class' }))
  await waitFor(() => assert.ok(mock.pending.classes && mock.pending.challenges))
  const firstClasses = mock.pending.classes
  const firstChallenges = mock.pending.challenges
  await act(async () => firstClasses())
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  fireEvent(document, new window.Event('visibilitychange'))
  await waitFor(() => assert.notEqual(mock.pending.challenges, firstChallenges))
  await act(async () => firstChallenges())
  await act(async () => mock.pending.challenges())
  assert.match(ui.getByRole('status').textContent, /Refreshing class/)
  await act(async () => mock.pending.classes())
  assert.match(ui.getByRole('status').textContent, /Class refreshed/)
  delete document.visibilityState
})

test('leaving Challenges clears refresh feedback even if its requests finish later', async () => {
  const mock = refreshClient()
  const ui = await openRefreshClass(mock)
  mock.hold()
  fireEvent.click(ui.getByRole('button', { name: 'Refresh class' }))
  await waitFor(() => assert.ok(mock.pending.classes && mock.pending.challenges))
  fireEvent.click(ui.getByRole('button', { name: 'Class progress' }))
  fireEvent.click(ui.getByRole('button', { name: 'Challenges' }))
  await act(async () => mock.pending.classes())
  await act(async () => mock.pending.challenges())
  assert.equal(ui.queryByText('Class refreshed.'), null)
  assert.equal(ui.queryByText('Refreshing class...'), null)
  assert.equal(ui.getByRole('button', { name: 'Refresh class' }).disabled, false)
})

for (const role of ['teacher', 'student']) {
  test(`${role} daily refresh waits for current program questions`, async () => {
    const mock = refreshClient(role)
    let ui
    if (role === 'teacher') {
      ui = await openRefreshClass(mock)
    } else {
      globalThis.__classOrderClient = mock.client
      ui = render(React.createElement(App))
      await ui.findByRole('button', { name: 'Refresh class' })
    }
    fireEvent.click(ui.getByRole('button', { name: 'Daily programs' }))
    await ui.findByRole('heading', { name: 'No daily programs yet' })
    mock.rows.daily_programs.push({
      id: 'program', title: 'Updated plan', subject: 'Math', grade_band: '9-12',
      days: 1, start_date: '2026-01-01', start_time: '09:00:00', time_zone: 'UTC',
      easy_count: 1, medium_count: 0, hard_count: 0, is_published: true,
    })
    mock.rows.daily_program_questions.push({
      id: 'question', program_id: 'program', day_number: 1, position: 1, level: 'Easy',
      title: 'Updated daily question', prompt: 'Question?', answer_type: 'short_answer', choices: null,
    })
    mock.hold()
    fireEvent.click(ui.getByRole('button', { name: 'Refresh class' }))
    assert.match(ui.getByText('Refreshing class...').textContent, /Refreshing/)
    await waitFor(() => assert.ok(mock.pending.classes && mock.pending.challenges))
    await act(async () => mock.pending.classes())
    await act(async () => mock.pending.challenges())
    await waitFor(() => assert.ok(mock.pending.daily_programs))
    assert.ok(ui.getByText('Refreshing class...'))
    await act(async () => mock.pending.daily_programs())
    await waitFor(() => assert.ok(mock.pending.daily_program_questions))
    assert.ok(ui.getByText('Refreshing class...'))
    await act(async () => mock.pending.daily_program_questions())
    await ui.findByRole('heading', { name: 'Updated daily question' })
    assert.ok(ui.getByText('Class refreshed.'))
    assert.equal(ui.getByRole('button', { name: 'Refresh class' }).disabled, false)
  })

  for (const failedTable of ['daily_programs', 'daily_program_questions']) {
    test(`${role} daily refresh reports ${failedTable} errors and can retry`, async () => {
      const mock = refreshClient(role)
      if (failedTable === 'daily_program_questions') {
        mock.rows.daily_programs.push({
          id: 'program', title: 'Existing plan', subject: 'Math', grade_band: '9-12',
          days: 1, start_date: '2026-01-01', start_time: '09:00:00', time_zone: 'UTC',
          easy_count: 1, medium_count: 0, hard_count: 0, is_published: true,
        })
      }
      let ui
      if (role === 'teacher') {
        ui = await openRefreshClass(mock)
      } else {
        globalThis.__classOrderClient = mock.client
        ui = render(React.createElement(App))
        await ui.findByRole('button', { name: 'Refresh class' })
      }
      fireEvent.click(ui.getByRole('button', { name: 'Daily programs' }))
      await ui.findByRole('heading', { name: failedTable === 'daily_programs' ? 'No daily programs yet' : 'Existing plan' })
      mock.hold()
      fireEvent.click(ui.getByRole('button', { name: 'Refresh class' }))
      await waitFor(() => assert.ok(mock.pending.classes && mock.pending.challenges))
      await act(async () => mock.pending.classes())
      await act(async () => mock.pending.challenges())
      await waitFor(() => assert.ok(mock.pending.daily_programs))
      if (failedTable === 'daily_program_questions') {
        await act(async () => mock.pending.daily_programs())
        await waitFor(() => assert.ok(mock.pending.daily_program_questions))
      }
      await act(async () => mock.pending[failedTable]('Daily data unavailable'))
      assert.match((await ui.findByRole('alert')).textContent, /Daily data unavailable/)
      assert.equal(ui.queryByText('Class refreshed.'), null)
      mock.unhold()
      fireEvent.click(ui.getByRole('button', { name: 'Refresh class' }))
      await ui.findByText('Class refreshed.')
      assert.equal(ui.queryByRole('alert'), null)
    })
  }
}

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
