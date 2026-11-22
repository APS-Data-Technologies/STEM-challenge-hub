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

const { render, fireEvent, waitFor, cleanup, within } = await import('@testing-library/react')
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const { DailyPrograms } = await vite.ssrLoadModule('/src/components/DailyPrograms.tsx')

afterEach(() => cleanup())
after(async () => {
  await vite.close()
  dom.window.close()
})

function fakeSupabase(initial = {}) {
  const rows = {
    daily_programs: [],
    daily_program_questions: [],
    daily_program_keys: [],
    daily_program_answers: [],
    ...initial,
  }
  const calls = []
  let nextId = 0
  let failNextKey = false
  const supabase = {
    from(table) {
      calls.push(table)
      let action = 'read'
      let values
      let filters = []
      let single = false
      const builder = {
        select() { return builder },
        eq(field, value) { filters.push((row) => row[field] === value); return builder },
        in(field, valuesToMatch) { filters.push((row) => valuesToMatch.includes(row[field])); return builder },
        order() { return builder },
        insert(value) { action = 'insert'; values = value; return builder },
        update(value) { action = 'update'; values = value; return builder },
        upsert(value) { action = 'upsert'; values = value; return builder },
        delete() { action = 'delete'; return builder },
        single() { single = true; return builder },
        then(resolve, reject) {
          let selected = rows[table].filter((row) => filters.every((filter) => filter(row)))
          if (action === 'insert') {
            const row = { id: `id-${++nextId}`, is_published: false, ...values }
            rows[table].push(row)
            selected = [row]
          } else if (action === 'update') {
            selected.forEach((row) => Object.assign(row, values))
          } else if (action === 'upsert') {
            if (table === 'daily_program_keys' && failNextKey) {
              failNextKey = false
              return Promise.resolve({ data: null, error: { message: 'Key save failed' } }).then(resolve, reject)
            }
            const existing = rows[table].find((row) => row.question_id === values.question_id)
            if (existing) Object.assign(existing, values)
            else rows[table].push({ ...values })
            selected = [values]
          } else if (action === 'delete') {
            rows[table] = rows[table].filter((row) => !selected.includes(row))
          }
          return Promise.resolve({ data: single ? selected[0] : selected, error: null }).then(resolve, reject)
        },
      }
      return builder
    },
    async rpc(name, args) {
      if (name === 'get_daily_program_progress') {
        const program = rows.daily_programs.find((row) => row.id === args.p_program_id)
        const ids = rows.daily_program_questions.filter((row) => row.program_id === program.id).map((row) => row.id)
        const count = rows.daily_program_answers.filter((row) => row.student_id === args.p_student_id && ids.includes(row.question_id)).length
        return { data: { total_questions: program.easy_count + program.medium_count + program.hard_count, answered_questions: count, completed_days: 0, current_streak: 0, longest_streak: 0 }, error: null }
      }
      if (name === 'submit_daily_program_answer') {
        const question = rows.daily_program_questions.find((row) => row.id === args.p_question_id)
        const correct = question.answer_type === 'multiple_choice'
          ? rows.daily_program_keys.find((row) => row.question_id === question.id).correct_choice === args.p_answer
          : null
        rows.daily_program_answers.push({ id: `answer-${++nextId}`, question_id: question.id, student_id: 'student', answer: args.p_answer, is_correct: correct })
        return { data: correct, error: null }
      }
      if (name === 'review_daily_program_answer') {
        rows.daily_program_answers.find((row) => row.id === args.p_answer_id).is_correct = args.p_is_correct
        return { data: null, error: null }
      }
      throw new Error(`Unexpected RPC: ${name}`)
    },
  }
  return { supabase, rows, calls, failKey() { failNextKey = true } }
}

const members = [{ id: 'student', role: 'student', display_name: 'Student One' }]

function mount(mock, isTeacher = true) {
  return render(React.createElement(DailyPrograms, {
    supabase: mock.supabase, classId: 'class', userId: isTeacher ? 'teacher' : 'student',
    isTeacher, members, refreshKey: 0,
  }))
}

function sampleProgram(published = false) {
  return {
    id: 'program', class_id: 'class', title: 'Math week', subject: 'Math', grade_band: 'K-2',
    days: 1, start_date: '2026-11-20', start_time: '09:00:00', time_zone: 'UTC',
    easy_count: 1, medium_count: 0, hard_count: 0, is_published: published,
  }
}

test('teacher plans a program, adds a question, and publishes', async () => {
  const mock = fakeSupabase()
  const ui = mount(mock)
  fireEvent.click(await ui.findByRole('button', { name: 'Create daily program' }))
  fireEvent.change(ui.getByLabelText('Title', { exact: true }), { target: { value: 'Math week' } })
  fireEvent.change(ui.getByLabelText('Start date'), { target: { value: '2026-11-20' } })
  assert.match(ui.getByText(/Total questions:/).textContent, /1/)
  fireEvent.click(ui.getByRole('button', { name: 'Save plan' }))
  await ui.findByRole('heading', { name: 'Math week' })
  fireEvent.click(await ui.findByRole('button', { name: 'Add question' }))
  fireEvent.change(ui.getByLabelText('Question title'), { target: { value: 'First question' } })
  fireEvent.change(ui.getByLabelText('Question', { exact: true }), { target: { value: 'Choose one' } })
  fireEvent.change(ui.getByLabelText(/Answer choices/), { target: { value: 'A\nB' } })
  fireEvent.change(ui.getByLabelText(/^Correct answer/), { target: { value: 'A' } })
  fireEvent.click(ui.getByRole('button', { name: 'Save question' }))
  await ui.findByRole('heading', { name: 'First question' })
  assert.equal(mock.rows.daily_program_keys[0].correct_choice, 'A')
  fireEvent.click(ui.getByRole('button', { name: 'Publish program' }))
  await ui.findByRole('button', { name: 'Unpublish' })
  assert.equal(mock.rows.daily_programs[0].is_published, true)
})

test('a teacher can edit a daily plan using the Title field', async () => {
  const mock = fakeSupabase({ daily_programs: [sampleProgram()] })
  const ui = mount(mock)
  await ui.findByRole('heading', { name: 'Math week' })
  fireEvent.click(ui.getByRole('button', { name: 'Edit plan' }))
  const title = ui.getByLabelText('Title', { exact: true })
  assert.equal(title.value, 'Math week')
  fireEvent.change(title, { target: { value: 'Math discoveries' } })
  fireEvent.click(ui.getByRole('button', { name: 'Save plan' }))
  await ui.findByRole('heading', { name: 'Math discoveries' })
  assert.equal(mock.rows.daily_programs[0].title, 'Math discoveries')
})

for (const isTeacher of [true, false]) {
  test(`${isTeacher ? 'teachers' : 'students'} see consecutive question numbers when order slots have gaps`, async () => {
    const mock = fakeSupabase({
      daily_programs: [{ ...sampleProgram(!isTeacher), days: 2, easy_count: 3 }],
      daily_program_questions: [
        { id: 'one', program_id: 'program', day_number: 1, position: 2, level: 'Easy', title: 'First', prompt: 'One?', answer_type: 'short_answer', choices: null },
        { id: 'two', program_id: 'program', day_number: 1, position: 5, level: 'Easy', title: 'Second', prompt: 'Two?', answer_type: 'short_answer', choices: null },
        { id: 'three', program_id: 'program', day_number: 2, position: 3, level: 'Easy', title: 'Another day', prompt: 'Three?', answer_type: 'short_answer', choices: null },
      ],
    })
    const ui = mount(mock, isTeacher)
    const first = (await ui.findByRole('heading', { name: 'First' })).closest('article')
    const second = ui.getByRole('heading', { name: 'Second' }).closest('article')
    const third = ui.getByRole('heading', { name: 'Another day' }).closest('article')
    assert.match(first.textContent, /Day 1 · Question 1 · Easy/)
    assert.match(second.textContent, /Day 1 · Question 2 · Easy/)
    assert.match(third.textContent, /Day 2 · Question 1 · Easy/)
    if (isTeacher) {
      assert.match(ui.getByText(/Question plan/).textContent, /3 of 3 added/)
      assert.match(first.textContent, /Order slot 2/)
      fireEvent.click(within(first).getByRole('button', { name: 'Edit' }))
      assert.equal(ui.getByLabelText(/Order slot for this day/).value, '2')
    } else {
      assert.doesNotMatch(first.textContent, /Order slot/)
    }
  })
}

test('students answer questions without fetching answer keys', async () => {
  const mock = fakeSupabase({
    daily_programs: [sampleProgram(true)],
    daily_program_questions: [{ id: 'question', program_id: 'program', day_number: 1, position: 1, level: 'Easy', title: 'Choose one', prompt: 'Which?', answer_type: 'multiple_choice', choices: ['A', 'B'] }],
    daily_program_keys: [{ question_id: 'question', correct_choice: 'A' }],
  })
  const ui = mount(mock, false)
  const card = (await ui.findByRole('heading', { name: 'Choose one' })).closest('article')
  fireEvent.click(within(card).getByLabelText('A'))
  fireEvent.click(within(card).getByRole('button', { name: 'Submit answer' }))
  await within(card).findByText('Correct!')
  await waitFor(() => assert.match(ui.getByText('1 / 1').textContent, /1 \/ 1/))
  assert.equal(mock.calls.includes('daily_program_keys'), false)
})

test('a failed answer-key save can be retried without creating a duplicate question', async () => {
  const mock = fakeSupabase({ daily_programs: [sampleProgram()] })
  const ui = mount(mock)
  await ui.findByRole('heading', { name: 'Math week' })
  fireEvent.click(await ui.findByRole('button', { name: 'Add question' }))
  fireEvent.change(ui.getByLabelText('Question title'), { target: { value: 'Retry question' } })
  fireEvent.change(ui.getByLabelText('Question', { exact: true }), { target: { value: 'Choose one' } })
  fireEvent.change(ui.getByLabelText(/Answer choices/), { target: { value: 'A\nB' } })
  fireEvent.change(ui.getByLabelText(/^Correct answer/), { target: { value: 'A' } })
  mock.failKey()
  fireEvent.click(ui.getByRole('button', { name: 'Save question' }))
  await ui.findByRole('alert')
  assert.match(ui.getByRole('alert').textContent, /answer key was not saved/)
  fireEvent.change(ui.getByLabelText(/^Correct answer/), { target: { value: 'A' } })
  fireEvent.click(ui.getByRole('button', { name: 'Save question' }))
  await ui.findByRole('heading', { name: 'Retry question' })
  assert.equal(mock.rows.daily_program_questions.length, 1)
  assert.equal(mock.rows.daily_program_keys.length, 1)
})
