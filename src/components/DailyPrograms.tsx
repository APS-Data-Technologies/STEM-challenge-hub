import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnswerType, DailyLevel, GradeBand, Profile, Subject } from '../lib/types'
import './DailyPrograms.css'

interface DailyProgram {
  id: string
  title: string
  subject: Subject
  grade_band: GradeBand
  days: number
  start_date: string
  start_time: string
  time_zone: string
  easy_count: number
  medium_count: number
  hard_count: number
  is_published: boolean
}

interface DailyQuestion {
  id: string
  program_id: string
  day_number: number
  position: number
  level: DailyLevel
  title: string
  prompt: string
  answer_type: AnswerType
  choices: string[] | null
}

interface DailyKey {
  question_id: string
  correct_choice: string
}

interface DailyAnswer {
  id: string
  question_id: string
  student_id: string
  answer: string
  is_correct: boolean | null
}

interface DailyProgress {
  total_questions: number
  answered_questions: number
  completed_days: number
  current_streak: number
  longest_streak: number
}

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error &&
        typeof error.message === 'string'
      ? error.message
      : 'Something went wrong. Please try again.'
}

export function DailyPrograms({
  supabase,
  classId,
  classRecord,
  userId,
  isTeacher,
  members,
  refreshKey,
  refreshReady = true,
  onRefreshResult,
}: {
  supabase: SupabaseClient
  classId: string
  classRecord?: { grade_band: string | null; name: string }
  userId: string
  isTeacher: boolean
  members: Profile[]
  refreshKey: number
  refreshReady?: boolean
  onRefreshResult?: (key: number, status: 'loading' | 'success' | 'error') => void
}) {
  const [programs, setPrograms] = useState<DailyProgram[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [questions, setQuestions] = useState<DailyQuestion[]>([])
  const [keys, setKeys] = useState<DailyKey[]>([])
  const [answers, setAnswers] = useState<DailyAnswer[]>([])
  const [progress, setProgress] = useState<Record<string, DailyProgress>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [showProgramForm, setShowProgramForm] = useState(false)
  const [editingProgram, setEditingProgram] = useState<DailyProgram | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<DailyQuestion | null>(null)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [detailsForId, setDetailsForId] = useState('')
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState(0)
  const [loadedPrograms, setLoadedPrograms] = useState<{ key: number; revision: number } | null>(null)
  const selected = programs.find((program) => program.id === selectedId)

  function reload() {
    setRevision((value) => value + 1)
  }

  useEffect(() => {
    if (!refreshReady) return
    let active = true
    onRefreshResult?.(refreshKey, 'loading')
    void (async () => {
      try {
        const { data, error: loadError } = await supabase
          .from('daily_programs')
          .select('id, title, subject, grade_band, days, start_date, start_time, time_zone, easy_count, medium_count, hard_count, is_published')
          .eq('class_id', classId)
          .order('created_at', { ascending: false })
        if (loadError) throw loadError
        if (!active) return
        const next = (data ?? []) as DailyProgram[]
        setPrograms(next)
        setSelectedId((id) => next.some((program) => program.id === id) ? id : (next[0]?.id ?? ''))
        setLoadedPrograms({ key: refreshKey, revision })
        if (!next.length) {
          setLoadError('')
          onRefreshResult?.(refreshKey, 'success')
        }
      } catch (loadError) {
        if (active) {
          setLoadError(message(loadError))
          onRefreshResult?.(refreshKey, 'error')
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [supabase, classId, refreshKey, revision, refreshReady, onRefreshResult])

  useEffect(() => {
    if (!refreshReady || loadedPrograms?.key !== refreshKey || loadedPrograms.revision !== revision ||
        !selectedId || !programs.some((program) => program.id === selectedId)) return
    let active = true
    onRefreshResult?.(refreshKey, 'loading')
    void (async () => {
      try {
        const { data: questionData, error: questionError } = await supabase
          .from('daily_program_questions')
          .select('id, program_id, day_number, position, level, title, prompt, answer_type, choices')
          .eq('program_id', selectedId)
          .order('day_number')
          .order('position')
        if (questionError) {
          if (questionError.code === '23505') throw new Error('That question number is already used on this day. Choose another number.')
          throw questionError
        }
        const nextQuestions = (questionData ?? []) as DailyQuestion[]
        const ids = nextQuestions.map((question) => question.id)
        let nextAnswers: DailyAnswer[] = []
        let nextKeys: DailyKey[] = []
        if (ids.length) {
          const { data, error: answerError } = await supabase
            .from('daily_program_answers')
            .select('id, question_id, student_id, answer, is_correct')
            .in('question_id', ids)
          if (answerError) throw answerError
          nextAnswers = (data ?? []) as DailyAnswer[]
          if (isTeacher) {
            const { data: keyData, error: keyError } = await supabase
              .from('daily_program_keys')
              .select('question_id, correct_choice')
              .in('question_id', ids)
            if (keyError) throw keyError
            nextKeys = (keyData ?? []) as DailyKey[]
          }
        }
        const nextProgress: Record<string, DailyProgress> = {}
        const program = programs.find((item) => item.id === selectedId)
        if (program?.is_published) {
          const students = isTeacher ? members.map((member) => member.id) : [userId]
          const results = await Promise.all(students.map(async (studentId) => {
            const { data, error: progressError } = await supabase.rpc('get_daily_program_progress', {
              p_program_id: selectedId,
              p_student_id: studentId,
            })
            if (progressError) throw progressError
            return { studentId, value: data as DailyProgress }
          }))
          results.forEach(({ studentId, value }) => { nextProgress[studentId] = value })
        }
        if (!active) return
        setQuestions(nextQuestions)
        setAnswers(nextAnswers)
        setKeys(nextKeys)
        setProgress(nextProgress)
        setDetailsForId(selectedId)
        setLoadError('')
        onRefreshResult?.(refreshKey, 'success')
      } catch (loadError) {
        if (active) {
          setLoadError(message(loadError))
          onRefreshResult?.(refreshKey, 'error')
          setQuestions([])
          setAnswers([])
          setKeys([])
          setProgress({})
          setDetailsForId(selectedId)
        }
      }
    })()
    return () => { active = false }
  }, [supabase, selectedId, isTeacher, members, userId, programs, refreshKey, revision, refreshReady, loadedPrograms, onRefreshResult])

  async function saveProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const days = Number(form.get('days'))
    const easyCount = Number(form.get('easy'))
    const mediumCount = Number(form.get('medium'))
    const hardCount = Number(form.get('hard'))
    const total = easyCount + mediumCount + hardCount
    if (![days, easyCount, mediumCount, hardCount].every(Number.isInteger) ||
        days < 1 || days > 100 || Math.min(easyCount, mediumCount, hardCount) < 0 ||
        total < days || total > days * 10) {
      setError('Choose 1–100 days and a total of 1–10 questions per day.')
      return
    }
    const values = {
      class_id: classId,
      title: String(form.get('title') ?? '').trim(),
      subject: String(form.get('subject') ?? ''),
      grade_band: String(form.get('gradeBand') ?? ''),
      days,
      start_date: String(form.get('startDate') ?? ''),
      start_time: String(form.get('startTime') ?? ''),
      time_zone: String(form.get('timeZone') ?? '').trim(),
      easy_count: easyCount,
      medium_count: mediumCount,
      hard_count: hardCount,
    }
    setBusy(true)
    setError('')
    try {
      const request = editingProgram
        ? supabase.from('daily_programs').update(values).eq('id', editingProgram.id)
        : supabase.from('daily_programs').insert(values)
      const { data, error: saveError } = await request.select('id').single()
      if (saveError) throw saveError
      setSelectedId(data.id)
      setEditingProgram(null)
      setShowProgramForm(false)
      reload()
    } catch (saveError) {
      setError(message(saveError))
    } finally {
      setBusy(false)
    }
  }

  async function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const answerType = form.get('answerType')
    if (answerType !== 'multiple_choice' && answerType !== 'short_answer') {
      setError('Choose a valid answer type.')
      return
    }
    const choices = answerType === 'multiple_choice'
      ? String(form.get('choices') ?? '').split('\n').map((choice) => choice.trim()).filter(Boolean)
      : null
    const correctChoice = String(form.get('correctChoice') ?? '').trim()
    if (choices && (choices.length < 2 || choices.length > 6 ||
        new Set(choices.map((choice) => choice.toLocaleLowerCase())).size !== choices.length ||
        !choices.includes(correctChoice))) {
      setError('Enter 2–6 unique choices and a correct answer that matches one choice.')
      return
    }
    const values = {
      program_id: selected.id,
      day_number: Number(form.get('day')),
      position: Number(form.get('position')),
      level: String(form.get('level') ?? ''),
      title: String(form.get('title') ?? '').trim(),
      prompt: String(form.get('prompt') ?? '').trim(),
      answer_type: answerType,
      choices,
    }
    setBusy(true)
    setError('')
    try {
      const request = editingQuestion
        ? supabase.from('daily_program_questions').update(values).eq('id', editingQuestion.id)
        : supabase.from('daily_program_questions').insert(values)
      const { data, error: questionError } = await request.select('id, program_id, day_number, position, level, title, prompt, answer_type, choices').single()
      if (questionError) throw questionError
      const saved = data as DailyQuestion
      setEditingQuestion(saved)
      if (answerType === 'multiple_choice') {
        const { error: keyError } = await supabase.from('daily_program_keys')
          .upsert({ question_id: saved.id, correct_choice: correctChoice }, { onConflict: 'question_id' })
        if (keyError) throw new Error(`Question saved, but its answer key was not saved: ${keyError.message}. Retry saving this question.`)
      } else {
        const { error: keyError } = await supabase.from('daily_program_keys').delete().eq('question_id', saved.id)
        if (keyError) throw new Error(`Question saved, but its old answer key could not be removed: ${keyError.message}. Retry saving this question.`)
      }
      setShowQuestionForm(false)
      setEditingQuestion(null)
      formElement.reset()
      reload()
    } catch (saveError) {
      setError(message(saveError))
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function setPublished(published: boolean) {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      const { error: updateError } = await supabase.from('daily_programs')
        .update({ is_published: published }).eq('id', selected.id).select('id').single()
      if (updateError) throw updateError
      reload()
    } catch (updateError) {
      setError(message(updateError))
    } finally {
      setBusy(false)
    }
  }

  async function removeQuestion(question: DailyQuestion) {
    if (!window.confirm(`Remove “${question.title}” from this program?`)) return
    setBusy(true)
    setError('')
    try {
      const { error: deleteError } = await supabase.from('daily_program_questions')
        .delete().eq('id', question.id).select('id').single()
      if (deleteError) throw deleteError
      reload()
    } catch (deleteError) {
      setError(message(deleteError))
    } finally {
      setBusy(false)
    }
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>, question: DailyQuestion) {
    event.preventDefault()
    const value = (drafts[question.id] ?? answers.find((answer) => answer.question_id === question.id)?.answer ?? '').trim()
    if (!value) {
      setFeedback((current) => ({ ...current, [question.id]: 'Enter or choose an answer.' }))
      return
    }
    setBusy(true)
    setError('')
    try {
      const { data, error: submitError } = await supabase.rpc('submit_daily_program_answer', {
        p_question_id: question.id,
        p_answer: value,
      })
      if (submitError) throw submitError
      if (question.answer_type === 'multiple_choice' && typeof data !== 'boolean') {
        throw new Error('Your answer was saved, but could not be graded. Please contact your teacher.')
      }
      setFeedback((current) => ({
        ...current,
        [question.id]: question.answer_type === 'short_answer'
          ? 'Answer submitted for teacher review.'
          : data === true ? 'Correct!' : 'Try again.',
      }))
      reload()
    } catch (submitError) {
      setFeedback((current) => ({ ...current, [question.id]: message(submitError) }))
    } finally {
      setBusy(false)
    }
  }

  async function reviewAnswer(answer: DailyAnswer, correct: boolean) {
    setBusy(true)
    setError('')
    try {
      const { error: reviewError } = await supabase.rpc('review_daily_program_answer', {
        p_answer_id: answer.id,
        p_is_correct: correct,
      })
      if (reviewError) throw reviewError
      reload()
    } catch (reviewError) {
      setError(message(reviewError))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p role="status">Loading daily programs...</p>

  return (
    <section className="daily-programs" aria-label="Daily programs">
      {error ? <div className="notice notice-error" role="alert"><span>{error}</span><button aria-label="Dismiss error" type="button" onClick={() => setError('')}>×</button></div> : null}
      {loadError ? <div className="notice notice-error" role="alert"><span>{loadError}</span><button aria-label="Dismiss loading error" type="button" onClick={() => setLoadError('')}>×</button></div> : null}
      <div className="daily-program-toolbar">
        <div>
          <h2>{isTeacher ? 'Manage programs' : 'Daily programs'}</h2>
          <p>{isTeacher ? 'Plan questions, set a schedule, and follow student progress.' : 'Open a program to answer your daily questions.'}</p>
        </div>
        {isTeacher && !showProgramForm ? (
          <button className="button button-primary" disabled={busy} type="button" onClick={() => {
            setEditingProgram(null)
            setShowProgramForm(true)
            setError('')
          }}>Create daily program</button>
        ) : null}
      </div>
      {showProgramForm && isTeacher ? (
        <ProgramForm key={editingProgram?.id ?? 'new'} program={editingProgram} busy={busy} classRecord={classRecord} onSave={saveProgram} onCancel={() => {
          setShowProgramForm(false)
          setEditingProgram(null)
          setError('')
        }} />
      ) : null}
      {!programs.length ? (
        <div className="empty-state compact-empty">
          <h3>No daily programs yet</h3>
          <p>{isTeacher ? 'Create a program to plan questions across 1–100 days.' : 'Your teacher has not published a daily program yet.'}</p>
        </div>
      ) : (
        <>
          <label className="field-label daily-program-select">
            Select a program
            <select value={selectedId} onChange={(event) => {
              setSelectedId(event.target.value)
              setShowQuestionForm(false)
              setEditingQuestion(null)
              setShowProgramForm(false)
              setFeedback({})
              setDrafts({})
              setError('')
            }}>
              {programs.map((program) => <option key={program.id} value={program.id}>{program.title}{isTeacher && !program.is_published ? ' (draft)' : ''}</option>)}
            </select>
          </label>
          {selected ? (
            <div className="daily-program-panel">
              <header className="daily-program-heading">
                <div>
                  <h3>{selected.title}</h3>
                  <p>{selected.subject} · {selected.grade_band} · {selected.days} {selected.days === 1 ? 'day' : 'days'}</p>
                  <p>Starts {selected.start_date} at {selected.start_time.slice(0, 5)} ({selected.time_zone}); each day opens at the same local time.</p>
                  <p>{selected.easy_count} easy · {selected.medium_count} medium · {selected.hard_count} hard</p>
                </div>
                {isTeacher ? (
                  <div className="daily-program-actions">
                    <span className={`status-pill ${selected.is_published ? 'status-live' : 'status-draft'}`}>{selected.is_published ? 'Published' : 'Draft'}</span>
                    <button className="button button-secondary" disabled={busy} type="button" onClick={() => void setPublished(!selected.is_published)}>{selected.is_published ? 'Unpublish' : 'Publish program'}</button>
                    {!selected.is_published ? <button className="button button-secondary" disabled={busy} type="button" onClick={() => {
                      setEditingProgram(selected)
                      setShowProgramForm(true)
                      setError('')
                    }}>Edit plan</button> : null}
                  </div>
                ) : null}
              </header>
              {isTeacher ? <p className="daily-program-hint">Add 1–10 questions for each day. The difficulty totals must match your plan before publishing. Unpublish to edit; after a student answers, the program is locked.</p> : <p className="daily-program-hint">Complete all questions for a day before the next day opens to keep your streak.</p>}
              {detailsForId !== selected.id ? <p role="status">Loading questions and progress...</p> : (
                <>
                  {isTeacher && !selected.is_published && !showQuestionForm ? (
                    <button className="button button-primary" type="button" onClick={() => {
                      setEditingQuestion(null)
                      setShowQuestionForm(true)
                      setError('')
                    }}>Add question</button>
                  ) : null}
                  {isTeacher && showQuestionForm && !selected.is_published ? (
                    <QuestionForm
                      key={editingQuestion?.id ?? 'new'}
                      question={editingQuestion}
                      correctChoice={keys.find((key) => key.question_id === editingQuestion?.id)?.correct_choice ?? ''}
                      days={selected.days}
                      busy={busy}
                      onSave={saveQuestion}
                      onCancel={() => { setShowQuestionForm(false); setEditingQuestion(null); setError('') }}
                    />
                  ) : null}
                  {isTeacher ? (
                    <details className="daily-plan-summary">
                      <summary>Question plan ({questions.length} of {selected.easy_count + selected.medium_count + selected.hard_count} added)</summary>
                      <p>
                        Easy: {questions.filter((question) => question.level === 'Easy').length}/{selected.easy_count}
                        {' · '}Medium: {questions.filter((question) => question.level === 'Medium').length}/{selected.medium_count}
                        {' · '}Hard: {questions.filter((question) => question.level === 'Hard').length}/{selected.hard_count}
                      </p>
                      <ul>
                        {Array.from({ length: selected.days }, (_, index) => {
                          const day = index + 1
                          return <li key={day}>Day {day}: {questions.filter((question) => question.day_number === day).length} / 10 questions</li>
                        })}
                      </ul>
                    </details>
                  ) : null}
                  {questions.length ? (
                    <div className="daily-question-list">
                      {questions.map((question) => {
                        const answer = answers.find((item) => item.question_id === question.id && item.student_id === userId)
                        const number = questions.filter((item) => item.day_number === question.day_number)
                          .findIndex((item) => item.id === question.id) + 1
                        return (
                          <article className="daily-question" key={question.id}>
                            <p className="daily-question-meta">Day {question.day_number} · Question {number} · {question.level}{isTeacher && number !== question.position ? ` · Order slot ${question.position}` : ''}</p>
                            <h4>{question.title}</h4>
                            <p>{question.prompt}</p>
                            {isTeacher ? (
                              <>
                                <p>{question.answer_type === 'multiple_choice' ? `Multiple choice · Correct answer: ${keys.find((key) => key.question_id === question.id)?.correct_choice ?? 'Not set'}` : 'Short answer · Teacher review'}</p>
                                {!selected.is_published ? <div className="daily-program-actions">
                                  <button className="text-button" disabled={busy} type="button" onClick={() => { setEditingQuestion(question); setShowQuestionForm(true); setError('') }}>Edit</button>
                                  <button className="text-button text-danger" disabled={busy} type="button" onClick={() => void removeQuestion(question)}>Remove</button>
                                </div> : null}
                                {answers.filter((item) => item.question_id === question.id).map((item) => (
                                  <div className="daily-review" key={item.id}>
                                    <strong>{members.find((member) => member.id === item.student_id)?.display_name ?? 'Student'}</strong>
                                    <p>{item.answer}</p>
                                    <span>{item.is_correct === null ? 'Awaiting review' : item.is_correct ? 'Correct' : 'Needs revision'}</span>
                                    {question.answer_type === 'short_answer' ? <div className="daily-program-actions">
                                      <button className="text-button" disabled={busy} type="button" onClick={() => void reviewAnswer(item, true)}>Mark correct</button>
                                      <button className="text-button" disabled={busy} type="button" onClick={() => void reviewAnswer(item, false)}>Needs revision</button>
                                    </div> : null}
                                  </div>
                                ))}
                              </>
                            ) : (
                              <form className="answer-form" onSubmit={(event) => void submitAnswer(event, question)}>
                                {question.answer_type === 'multiple_choice' ? (
                                  <div className="choice-list">
                                    {(question.choices ?? []).map((choice) => <label className="choice-option" key={choice}>
                                      <input type="radio" name={`daily-${question.id}`} checked={(drafts[question.id] ?? answer?.answer ?? '') === choice} onChange={() => setDrafts((current) => ({ ...current, [question.id]: choice }))} />
                                      <span>{choice}</span>
                                    </label>)}
                                  </div>
                                ) : <label className="field-label">Your answer<textarea rows={3} value={drafts[question.id] ?? answer?.answer ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [question.id]: event.target.value }))} /></label>}
                                <div className="answer-actions">
                                  <button className="button button-primary" disabled={busy} type="submit">{answer ? 'Update answer' : 'Submit answer'}</button>
                                  {feedback[question.id] ? <span role="status">{feedback[question.id]}</span> : null}
                                </div>
                                {answer ? <p className="daily-program-hint">Saved answer: {answer.answer} · {answer.is_correct === null ? 'Awaiting teacher review' : answer.is_correct ? 'Correct' : 'Needs revision'}</p> : null}
                              </form>
                            )}
                          </article>
                        )
                      })}
                    </div>
                  ) : <p>{isTeacher ? 'No questions added yet.' : 'No questions have opened yet. Check the program schedule.'}</p>}
                  {selected.is_published ? <ProgressSummary isTeacher={isTeacher} members={members} progress={progress} userId={userId} /> : null}
                </>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

function ProgramForm({ program, busy, onSave, onCancel, classRecord }: {
  program: DailyProgram | null
  busy: boolean
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  classRecord?: { grade_band: string | null; name: string }
}) {
  const timezones = [
    { value: 'America/Chicago', label: 'CST (Central)' },
    { value: 'America/New_York', label: 'EST (Eastern)' },
    { value: 'America/Denver', label: 'MST (Mountain)' },
    { value: 'America/Los_Angeles', label: 'PST (Pacific)' },
  ]
  
  // Get default timezone: use existing program timezone or detect browser timezone
  const getDefaultTimezone = () => {
    if (program?.time_zone) return program.time_zone
    
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    
    // Check if browser timezone matches one of our options
    if (timezones.some(tz => tz.value === browserTz)) {
      return browserTz
    }
    
    // Map common timezone variations to our supported timezones
    const tzMappings: Record<string, string> = {
      'UTC': 'America/Chicago',
      'America/Mexico_City': 'America/Chicago',
      'America/Argentina/Buenos_Aires': 'America/New_York',
      'Europe/London': 'America/New_York',
      'America/Vancouver': 'America/Los_Angeles',
      'America/Phoenix': 'America/Denver',
      'America/Anchorage': 'America/Los_Angeles',
      'Pacific/Honolulu': 'America/Los_Angeles',
    }
    
    return tzMappings[browserTz] || 'America/Chicago'
  }
  
  const [easyCount, setEasyCount] = useState(String(program?.easy_count ?? 1))
  const [mediumCount, setMediumCount] = useState(String(program?.medium_count ?? 0))
  const [hardCount, setHardCount] = useState(String(program?.hard_count ?? 0))
  const total = Number(easyCount) + Number(mediumCount) + Number(hardCount)
  
  // Extract grade level from class name (e.g., "Kindergarten Science" → "Kindergarten")
  const getGradeFromClassName = (): string => {
    if (!classRecord?.name) return 'Grade'
    // Extract the grade part before the subject
    const parts = classRecord.name.split(' ')
    if (parts.length > 1) {
      return parts.slice(0, -1).join(' ') // Everything except the last word (subject)
    }
    return classRecord.name
  }
  
  // Auto-populate subject and grade band from class
  // const defaultSubject = program?.subject ?? 'Science'
  // const defaultGradeBand = program?.grade_band ?? classRecord?.grade_band ?? 'K-2'
  
  // Map class grade band to daily program grade band
  const getDefaultGradeBand = () => {
    if (program?.grade_band) return program.grade_band
    const classGrade = classRecord?.grade_band
    if (classGrade === 'K-5') return 'K-2'
    if (classGrade === '6-8') return '6-8'
    if (classGrade === '9-12') return '9-12'
    return 'K-2'
  }
  
  return (
    <form className="daily-editor" onSubmit={(event) => void onSave(event)}>
      <h3>{program ? 'Edit daily plan' : 'Create a daily plan'}</h3>
      <label className="field-label">Title<input name="title" defaultValue={program?.title} maxLength={100} required /></label>
      <div className="form-grid">
        <label className="field-label">Subject<input type="text" value="Science" disabled /><input type="hidden" name="subject" value="Science" /></label>
        <label className="field-label">Grade<input type="text" value={getGradeFromClassName()} disabled /><input type="hidden" name="gradeBand" value={getDefaultGradeBand()} /></label>
        <label className="field-label">Number of days<input name="days" type="number" min={1} max={100} defaultValue={program?.days ?? 1} required /></label>
        <label className="field-label">Start date<input name="startDate" type="date" defaultValue={program?.start_date} required /></label>
        <label className="field-label">Daily opening time<input name="startTime" type="time" defaultValue={program?.start_time.slice(0, 5) ?? '09:00'} required /></label>
        <label className="field-label">Time zone<select name="timeZone" defaultValue={getDefaultTimezone()}>{timezones.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}</select><span className="field-hint">CST, EST, MST, or PST</span></label>
        <label className="field-label">Easy questions<input name="easy" type="number" min={0} value={easyCount} onChange={(event) => setEasyCount(event.target.value)} required /></label>
        <label className="field-label">Medium questions<input name="medium" type="number" min={0} value={mediumCount} onChange={(event) => setMediumCount(event.target.value)} required /></label>
        <label className="field-label">Hard questions<input name="hard" type="number" min={0} value={hardCount} onChange={(event) => setHardCount(event.target.value)} required /></label>
      </div>
      <p className="daily-program-hint">Total questions: {total}. This is for the whole program; plan between 1 and 10 questions per day.</p>
      <div className="daily-program-actions"><button className="button button-primary" disabled={busy} type="submit">{busy ? 'Saving...' : 'Save plan'}</button><button className="button button-secondary" disabled={busy} type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  )
}

function QuestionForm({ question, correctChoice, days, busy, onSave, onCancel }: {
  question: DailyQuestion | null
  correctChoice: string
  days: number
  busy: boolean
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}) {
  const [answerType, setAnswerType] = useState<AnswerType>(question?.answer_type ?? 'multiple_choice')
  return (
    <form className="daily-editor" onSubmit={(event) => void onSave(event)}>
      <h3>{question ? 'Edit question' : 'Add a question'}</h3>
      <div className="form-grid">
        <label className="field-label">Day<input name="day" type="number" min={1} max={days} defaultValue={question?.day_number ?? 1} required /></label>
        <label className="field-label">Order slot for this day<input name="position" type="number" min={1} max={10} defaultValue={question?.position ?? 1} required /><span className="field-hint">Slots determine the order; displayed question numbers are consecutive.</span></label>
        <label className="field-label">Difficulty<select name="level" defaultValue={question?.level ?? 'Easy'}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
        <label className="field-label">Answer type<select name="answerType" value={answerType} onChange={(event) => setAnswerType(event.target.value as AnswerType)}><option value="multiple_choice">Multiple choice</option><option value="short_answer">Short answer</option></select></label>
      </div>
      <label className="field-label">Question title<input name="title" defaultValue={question?.title} maxLength={100} required /></label>
      <label className="field-label">Question<textarea name="prompt" defaultValue={question?.prompt} maxLength={2000} rows={3} required /></label>
      {answerType === 'multiple_choice' ? <>
        <label className="field-label">Answer choices (2–6, one per line)<textarea name="choices" defaultValue={question?.choices?.join('\n') ?? ''} rows={4} required /></label>
        <label className="field-label">Correct answer<input name="correctChoice" defaultValue={correctChoice} required /><span className="field-hint">Enter exactly one of the choices above.</span></label>
      </> : null}
      <div className="daily-program-actions"><button className="button button-primary" disabled={busy} type="submit">{busy ? 'Saving...' : 'Save question'}</button><button className="button button-secondary" disabled={busy} type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  )
}

function ProgressSummary({ isTeacher, members, progress, userId }: {
  isTeacher: boolean
  members: Profile[]
  progress: Record<string, DailyProgress>
  userId: string
}) {
  const students = isTeacher ? members : [{ id: userId, display_name: 'Your progress' }]
  return (
    <section className="daily-progress-section" aria-label="Daily program progress">
      <h3>{isTeacher ? 'Student progress' : 'Your progress'}</h3>
      {!students.length ? <p>Share the class join code so students can join.</p> : (
        <div className="table-scroll"><table className="progress-table">
          <thead><tr><th>Student</th><th>Questions answered</th><th>Days completed on time</th><th>Current streak</th><th>Longest streak</th></tr></thead>
          <tbody>{students.map((student) => {
            const item = progress[student.id]
            return <tr key={student.id}><th scope="row">{student.display_name}</th><td>{item ? `${item.answered_questions} / ${item.total_questions}` : '—'}</td><td>{item?.completed_days ?? '—'}</td><td>{item ? `${item.current_streak} days` : '—'}</td><td>{item ? `${item.longest_streak} days` : '—'}</td></tr>
          })}</tbody>
        </table></div>
      )}
    </section>
  )
}
