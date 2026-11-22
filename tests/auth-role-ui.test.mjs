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

const { render, fireEvent, cleanup, waitFor, act } = await import('@testing-library/react')
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  plugins: [{
    name: 'mock-auth-role-supabase',
    enforce: 'pre',
    resolveId(source) { if (source === './lib/supabase') return '\0auth-role-supabase' },
    load(id) { if (id === '\0auth-role-supabase') return 'export const getSupabaseClient = () => globalThis.__authRoleClient' },
  }],
})
const { default: App } = await vite.ssrLoadModule('/src/App.tsx')

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
after(async () => { await vite.close(); dom.window.close(); delete globalThis.__authRoleClient })

function fakeClient(role, { signOutFails = false } = {}) {
  let callback = () => {}
  let signedOut = 0
  let signupRole
  const user = { id: 'user' }
  const client = {
    auth: {
      async getSession() { return { data: { session: null }, error: null } },
      onAuthStateChange(handler) {
        callback = handler
        return { data: { subscription: { unsubscribe() {} } } }
      },
      async signInWithPassword() {
        callback('SIGNED_IN', { user })
        return { data: { user }, error: null }
      },
      async signOut() {
        signedOut += 1
        if (signOutFails) return { error: { message: 'Sign-out unavailable' } }
        callback('SIGNED_OUT', null)
        return { error: null }
      },
      async signUp({ options }) {
        signupRole = options.data.role
        return { data: { session: null }, error: null }
      },
    },
    from(table) {
      const builder = {
        select() { return builder },
        eq() { return builder },
        in() { return builder },
        order() { return builder },
        single() { return builder },
        then(resolve, reject) {
          const data = table === 'profiles' ? { id: 'user', role, display_name: 'Test' } : []
          return Promise.resolve({ data, error: null }).then(resolve, reject)
        },
      }
      return builder
    },
  }
  return { client, signedOut: () => signedOut, signupRole: () => signupRole, refresh() { callback('TOKEN_REFRESHED', { user: { ...user } }) } }
}

async function openSignIn(mock, selectedRole) {
  globalThis.__authRoleClient = mock.client
  const ui = render(React.createElement(App))
  const button = await ui.findByRole('button', { name: selectedRole })
  fireEvent.click(button)
  fireEvent.change(ui.getByLabelText('Email'), { target: { value: 'test@example.test' } })
  fireEvent.change(ui.getByLabelText('Password'), { target: { value: 'test-password' } })
  fireEvent.click(ui.getByRole('button', { name: 'Sign in' }))
  return ui
}

for (const mode of ['signin', 'signup']) {
  test(`switching roles clears credentials in ${mode} without clearing them on reselect`, async () => {
    window.localStorage.setItem('stem-challenge-hub-remembered-email', 'saved@example.test')
    globalThis.__authRoleClient = fakeClient('teacher').client
    const ui = render(React.createElement(App))
    await ui.findByRole('button', { name: 'Create an account' })
    if (mode === 'signup') fireEvent.click(ui.getByRole('button', { name: 'Create an account' }))
    const email = ui.getByLabelText('Email')
    assert.equal(email.value, 'saved@example.test')
    fireEvent.change(ui.getByLabelText('Password'), { target: { value: 'test-password' } })
    fireEvent.click(ui.getByRole('button', { name: 'Show password' }))
    fireEvent.click(ui.getByRole('button', { name: 'Teacher' }))
    assert.equal(email.value, 'saved@example.test')
    assert.equal(ui.getByLabelText('Password').value, 'test-password')
    fireEvent.click(ui.getByRole('button', { name: 'Student' }))
    assert.equal(email.value, '')
    assert.equal(ui.getByLabelText('Password').value, '')
    assert.equal(ui.getByLabelText('Password').type, 'password')
    assert.equal(window.localStorage.getItem('stem-challenge-hub-remembered-email'), 'saved@example.test')
    fireEvent.change(email, { target: { value: 'student@example.test' } })
    fireEvent.change(ui.getByLabelText('Password'), { target: { value: 'student-password' } })
    fireEvent.click(ui.getByRole('button', { name: 'Teacher' }))
    assert.equal(email.value, '')
    assert.equal(ui.getByLabelText('Password').value, '')
  })
}

for (const [selected, actual] of [['Teacher', 'student'], ['Student', 'teacher']]) {
  test(`rejects ${actual} account when ${selected} is selected`, async () => {
    const mock = fakeClient(actual)
    const ui = await openSignIn(mock, selected)
    assert.match((await ui.findByRole('alert')).textContent, /does not match|not a .* account/i)
    assert.equal(mock.signedOut(), 1)
    assert.equal(ui.queryByText(/WORKSPACE$/), null)
  })
}

for (const role of ['teacher', 'student']) {
  test(`opens the ${role} workspace when the role matches`, async () => {
    const ui = await openSignIn(fakeClient(role), role === 'teacher' ? 'Teacher' : 'Student')
    if (role === 'teacher') {
      await ui.findByRole('heading', { name: 'Choose a grade group' })
    } else {
      await ui.findByText('STUDENT WORKSPACE')
    }
  })
}

for (const role of ['teacher', 'student']) {
  test(`shows the home logo in the ${role} workspace`, async () => {
    globalThis.__authRoleClient = fakeClient(role).client
    const ui = render(React.createElement(App))
    await ui.findByRole('button', { name: 'Sign in' })
    const homeBrand = ui.getByRole('link', { name: 'STEM Challenge Hub home' })
    const homeText = homeBrand.textContent
    const homeMark = homeBrand.querySelector('svg').innerHTML
    fireEvent.click(ui.getByRole('button', { name: role === 'teacher' ? 'Teacher' : 'Student' }))
    fireEvent.change(ui.getByLabelText('Email'), { target: { value: 'test@example.test' } })
    fireEvent.change(ui.getByLabelText('Password'), { target: { value: 'test-password' } })
    fireEvent.click(ui.getByRole('button', { name: 'Sign in' }))
    await ui.findByText(role === 'teacher' ? 'TEACHER WORKSPACE' : 'STUDENT WORKSPACE')
    const workspaceBrand = ui.container.querySelector('.workspace-sidebar .workspace-brand')
    assert.equal(workspaceBrand.textContent, homeText)
    assert.equal(workspaceBrand.querySelector('svg').innerHTML, homeMark)
  })
}

test('shows an explicit error and does not open a workspace if sign-out fails', async () => {
  const mock = fakeClient('student', { signOutFails: true })
  const ui = await openSignIn(mock, 'Teacher')
  assert.match((await ui.findByRole('alert')).textContent, /sign-out failed.*Sign-out unavailable/i)
  act(() => mock.refresh())
  await waitFor(() => assert.equal(mock.signedOut(), 2))
  assert.match((await ui.findByRole('alert')).textContent, /sign-out failed/i)
  assert.equal(ui.queryByText('STUDENT WORKSPACE'), null)
})

for (const role of ['teacher', 'student']) {
  test(`creates an account with the selected ${role} role`, async () => {
    const mock = fakeClient(role)
    globalThis.__authRoleClient = mock.client
    const ui = render(React.createElement(App))
    await ui.findByRole('button', { name: 'Create an account' })
    fireEvent.click(ui.getByRole('button', { name: 'Create an account' }))
    fireEvent.click(ui.getByRole('button', { name: role === 'teacher' ? 'Teacher' : 'Student' }))
    fireEvent.change(ui.getByLabelText('Display name'), { target: { value: 'Test' } })
    fireEvent.change(ui.getByLabelText('Email'), { target: { value: 'test@example.test' } })
    fireEvent.change(ui.getByLabelText('Password'), { target: { value: 'test-password' } })
    fireEvent.click(ui.getByRole('button', { name: 'Create account' }))
    await waitFor(() => assert.equal(mock.signupRole(), role))
    assert.match((await ui.findByRole('status')).textContent, /confirm your account/i)
  })
}
