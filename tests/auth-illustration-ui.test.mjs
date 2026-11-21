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

const { render, fireEvent, cleanup } = await import('@testing-library/react')
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const { AuthIllustration } = await vite.ssrLoadModule('/src/components/AuthIllustration.tsx')
afterEach(cleanup)
after(async () => { await vite.close(); dom.window.close() })

test('STEM cards switch illustrations and math problems by click and keyboard', () => {
  const ui = render(React.createElement(AuthIllustration))
  for (const [name, caption, selector] of [
    [/^Science:/, /Science: explore/, '.auth-cycle-image'],
    [/^Technology:/, /Technology: explore/, '.auth-cycle-image'],
    [/^Engineering:/, /Engineering: explore/, '.auth-engineering-vehicle'],
  ]) {
    const card = ui.getByRole('button', { name })
    const images = card.querySelectorAll(selector)
    assert.ok(images[0].classList.contains('is-visible'))
    fireEvent.click(card)
    assert.ok(images[1].classList.contains('is-visible'))
    assert.match(ui.container.querySelector('figcaption').textContent, caption)
    fireEvent.keyDown(card, { key: 'Enter' })
    assert.ok(images[0].classList.contains('is-visible'))
    fireEvent.keyDown(card, { key: ' ' })
    assert.ok(images[1].classList.contains('is-visible'))
  }
  const maths = ui.getByRole('button', { name: /^Maths:/ })
  const equation = maths.querySelector('.auth-math-equation')
  const first = equation.textContent
  fireEvent.click(maths)
  assert.notEqual(equation.textContent, first)
  const second = equation.textContent
  fireEvent.keyDown(maths, { key: ' ' })
  assert.notEqual(equation.textContent, second)
  assert.match(ui.container.querySelector('figcaption').textContent, /Maths:/)
})

test('subject messages and existing biology, chemistry, and robot interactions coexist', () => {
  const ui = render(React.createElement(AuthIllustration))
  const caption = ui.container.querySelector('figcaption')
  const biology = ui.getByRole('button', { name: /^Biology cell:/ })
  fireEvent.click(biology)
  assert.equal(biology.getAttribute('aria-pressed'), 'true')
  fireEvent.click(ui.getByRole('button', { name: /^Science:/ }))
  assert.match(caption.textContent, /Science:/)
  const chemistry = ui.getByRole('button', { name: /^Chemistry flask:/ })
  fireEvent.keyDown(chemistry, { key: 'Enter' })
  assert.equal(chemistry.getAttribute('aria-pressed'), 'true')
  assert.match(caption.textContent, /Chemistry/)
  fireEvent.click(ui.getByRole('button', { name: /^Friendly STEM robot:/ }))
  assert.match(caption.textContent, /S — Science/)
})
