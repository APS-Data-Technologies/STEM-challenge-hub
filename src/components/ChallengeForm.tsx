import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AnswerType,
  Challenge,
  GradeBand,
  Subject,
} from '../lib/types'
const subjects: Subject[] = [
  'Science',
  'Technology',
  'Engineering',
  'Math',
]
const gradeBands: GradeBand[] = ['K-2', '3-5', '6-8', '9-12']

export function ChallengeForm({
  challenge,
  classId,
  classRecord,
  onCancel,
  onSaved,
  supabase,
}: {
  challenge: Challenge | null
  classId: string
  classRecord?: { grade_band: string | null; name: string }
  onCancel: () => void
  onSaved: () => void
  supabase: SupabaseClient
}) {
  // Helper to extract grade level from class name (e.g., "Kindergarten Science" → "Kindergarten")
  const getGradeFromClassName = (): string => {
    if (!classRecord?.name) return 'Grade'
    // Extract the grade part before the subject
    const parts = classRecord.name.split(' ')
    if (parts.length > 1) {
      return parts.slice(0, -1).join(' ') // Everything except the last word (subject)
    }
    return classRecord.name
  }

  // Helper to map class grade band to challenge grade band
  const getDefaultGradeBand = (): GradeBand => {
    if (challenge?.grade_band) return challenge.grade_band
    const classGrade = classRecord?.grade_band
    if (classGrade === 'K-5') return 'K-2'
    if (classGrade === '6-8') return '6-8'
    if (classGrade === '9-12') return '9-12'
    return gradeBands[2]
  }

  const [answerType, setAnswerType] = useState<AnswerType>(
    challenge?.answer_type ?? 'multiple_choice',
  )
  const [choiceText, setChoiceText] = useState(
    challenge?.choices?.join('\n') ?? '',
  )
  const [keyAnswer, setKeyAnswer] = useState('')
  const [count, setCount] = useState(1)
  const [total, setTotal] = useState<number | null>(challenge ? 1 : null)
  const [current, setCurrent] = useState(1)
  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [feedbackEnabled, setFeedbackEnabled] = useState(challenge?.feedback_enabled ?? false)

  useEffect(() => {
    if (!challenge || challenge.answer_type !== 'multiple_choice') return
    let active = true
    void supabase
      .from('challenge_keys')
      .select('correct_choice')
      .eq('challenge_id', challenge.id)
      .single()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setError(error.message)
          return
        }
        setKeyAnswer(data.correct_choice)
      })
    return () => {
      active = false
    }
  }, [challenge, supabase])

  async function saveChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    const form = event.currentTarget
    const formData = new FormData(form)
    const title = String(formData.get('title') ?? '').trim()
    const prompt = String(formData.get('prompt') ?? '').trim()
    const subject = String(formData.get('subject') ?? '') as Subject
    const gradeBand = String(formData.get('gradeBand') ?? '') as GradeBand
    const isPublished = formData.get('isPublished') === 'on'
    const choices =
      answerType === 'multiple_choice'
        ? choiceText
            .split('\n')
            .map((choice) => choice.trim())
            .filter(Boolean)
        : null
    const correctChoice = keyAnswer.trim()
    const hintLevel1 = String(formData.get('hintLevel1') ?? '').trim() || null
    const hintLevel2 = String(formData.get('hintLevel2') ?? '').trim() || null
    const hintLevel3 = String(formData.get('hintLevel3') ?? '').trim() || null
    const hasDuplicateChoices =
      choices !== null &&
      new Set(choices.map((choice) => choice.toLocaleLowerCase())).size !==
        choices.length

    if (
      answerType === 'multiple_choice' &&
      (!choices ||
        choices.length < 2 ||
        choices.length > 6 ||
        hasDuplicateChoices ||
        !choices.includes(correctChoice))
    ) {
      setError(
        'Add 2–6 unique choices and select one as the correct answer.',
      )
      setPending(false)
      return
    }

    const challengeData: any = {
      class_id: classId,
      title,
      prompt,
      subject,
      grade_band: gradeBand,
      answer_type: answerType,
      choices,
      is_published: false,
      feedback_enabled: feedbackEnabled,
      program_day: challenge?.program_day ?? null,
      level: challenge?.level ?? null,
    }

    if (answerType === 'multiple_choice' && (hintLevel1 || hintLevel2 || hintLevel3)) {
      challengeData.hint_level_1 = hintLevel1
      challengeData.hint_level_2 = hintLevel2
      challengeData.hint_level_3 = hintLevel3
    }

    let savedDraft = false
    try {
      let challengeId = challenge?.id ?? pendingChallengeId
      if (challengeId) {
        const { error } = await supabase
          .from('challenges')
          .update(challengeData)
          .eq('id', challengeId)
        if (error) throw error
        savedDraft = true
      } else {
        const { data, error } = await supabase
          .from('challenges')
          .insert(challengeData)
          .select('id')
          .single()
        if (error) throw error
        challengeId = data.id
        setPendingChallengeId(challengeId)
        savedDraft = true
      }

      if (answerType === 'multiple_choice') {
        const { error } = await supabase.from('challenge_keys').upsert(
          {
            challenge_id: challengeId,
            correct_choice: correctChoice,
          },
          { onConflict: 'challenge_id' },
        )
        if (error) throw error
      } else if (challenge || pendingChallengeId) {
        const { error } = await supabase
          .from('challenge_keys')
          .delete()
          .eq('challenge_id', challengeId)
        if (error) throw error
      }

      if (isPublished) {
        const { error } = await supabase
          .from('challenges')
          .update({ is_published: true })
          .eq('id', challengeId)
        if (error) throw error
      }

      if (challenge || current === total) {
        onSaved()
      } else {
        form.reset()
        setChoiceText('')
        setKeyAnswer('')
        setAnswerType('multiple_choice')
        setPendingChallengeId(null)
        setCurrent((value) => value + 1)
      }
    } catch (saveError) {
      const message = typeof saveError === 'object' &&
        saveError !== null && 'message' in saveError &&
        typeof saveError.message === 'string'
        ? saveError.message
        : 'Could not save this challenge.'
      setError(savedDraft
        ? `The challenge was saved as a draft but could not be completed. Retry to finish saving it. ${message}`
        : message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (!pending && event.target === event.currentTarget) onCancel()
      }}
    >
      <section
        aria-labelledby="challenge-form-title"
        aria-modal="true"
        className="modal-card"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">
              {challenge ? 'MAKE AN UPDATE' : 'SPARK SOME CURIOSITY'}
            </p>
            <h2 id="challenge-form-title">
              {challenge ? 'Edit challenge' : total === null ? 'Create individual challenges' : `Challenge ${current} of ${total}`}
            </h2>
          </div>
          <button
            aria-label="Close dialog"
            className="icon-button"
            onClick={onCancel}
            disabled={pending}
            type="button"
          >
            ×
          </button>
        </header>

        {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
        {total === null ? (
          <form key="count" className="challenge-form" onSubmit={(event) => {
            event.preventDefault()
            if (!Number.isInteger(count) || count < 1 || count > 30) {
              setError('Choose a number from 1 to 30.')
              return
            }
            setError('')
            setTotal(count)
          }}>
            <label className="field-label">
              Number of challenges
              <input type="number" min={1} max={30} required value={count} onChange={(event) => setCount(Number(event.target.value))} />
            </label>
            <p className="field-hint">Enter and save each challenge separately. Saved challenges remain if you cancel.</p>
            <footer className="modal-actions">
              <button className="button button-secondary" onClick={onCancel} type="button">Cancel</button>
              <button className="button button-primary" type="submit">Continue</button>
            </footer>
          </form>
        ) : (
        <form key="challenge" className="challenge-form" onSubmit={saveChallenge}>
          <label className="field-label">
            Challenge title
            <input
              defaultValue={challenge?.title}
              maxLength={100}
              name="title"
              placeholder="e.g. The paper tower test"
              required
            />
          </label>
          <label className="field-label">
            Prompt
            <textarea
              defaultValue={challenge?.prompt}
              maxLength={2000}
              name="prompt"
              placeholder="What would you like your students to explore?"
              required
              rows={4}
            />
          </label>
          <div className="form-grid">
            <label className="field-label">
              Subject
              <input
                type="text"
                value="Science"
                disabled
                name="subject"
              />
              <input type="hidden" name="subject" value="Science" />
            </label>
            <label className="field-label">
              Grade
              <input
                type="text"
                value={getGradeFromClassName()}
                disabled
                name="grade"
              />
              <input type="hidden" name="gradeBand" value={getDefaultGradeBand()} />
            </label>
          </div>
          <fieldset className="answer-type-fieldset">
            <legend>Answer type</legend>
            <label>
              <input
                checked={answerType === 'multiple_choice'}
                onChange={() => setAnswerType('multiple_choice')}
                type="radio"
              />
              Multiple choice
            </label>
            <label>
              <input
                checked={answerType === 'short_answer'}
                onChange={() => setAnswerType('short_answer')}
                type="radio"
              />
              Short answer
            </label>
          </fieldset>
          {answerType === 'multiple_choice' ? (
            <>
              <label className="field-label">
                Answer choices
                <textarea
                  onChange={(event) => {
                    setChoiceText(event.target.value)
                    if (
                      keyAnswer &&
                      !event.target.value
                        .split('\n')
                        .map((choice) => choice.trim())
                        .includes(keyAnswer)
                    ) {
                      setKeyAnswer('')
                    }
                  }}
                  name="choices"
                  placeholder={'One answer per line\nFirst choice\nSecond choice'}
                  required
                  rows={4}
                  value={choiceText}
                />
              </label>
              <label className="field-label">
                Correct answer
                <select
                  onChange={(event) => setKeyAnswer(event.target.value)}
                  required
                  value={keyAnswer}
                >
                  <option value="" disabled>
                    Choose the correct answer
                  </option>
                  {choiceText
                    .split('\n')
                    .map((choice) => choice.trim())
                    .filter(Boolean)
                    .map((choice, index) => (
                      <option key={`${choice}-${index}`} value={choice}>
                        {choice}
                      </option>
                    ))}
                </select>
                <span className="field-hint">
                  The answer key stays in the database and is never shown to
                  students.
                </span>
              </label>
              <div className="hints-section">
                <p className="hints-title"><strong>Progressive Hints (Optional)</strong></p>
                <p className="hints-info">Students see these hints after each wrong answer. Leave blank for auto-generated hints.</p>
                <label className="field-label">
                  Hint 1 (after 1st wrong answer)
                  <textarea
                    defaultValue={challenge?.hint_level_1 ?? ''}
                    maxLength={200}
                    name="hintLevel1"
                    placeholder="e.g. Think about how many sides this shape has..."
                    rows={2}
                  />
                  <span className="field-hint">General guidance to point them in the right direction.</span>
                </label>
                <label className="field-label">
                  Hint 2 (after 2nd wrong answer)
                  <textarea
                    defaultValue={challenge?.hint_level_2 ?? ''}
                    maxLength={200}
                    name="hintLevel2"
                    placeholder="e.g. This shape has 4 equal sides and 4 right angles..."
                    rows={2}
                  />
                  <span className="field-hint">More specific guidance.</span>
                </label>
                <label className="field-label">
                  Hint 3 (after 3rd wrong answer)
                  <textarea
                    defaultValue={challenge?.hint_level_3 ?? ''}
                    maxLength={200}
                    name="hintLevel3"
                    placeholder="e.g. The answer is a square, which is a type of rectangle..."
                    rows={2}
                  />
                  <span className="field-hint">Nearly gives away the answer.</span>
                </label>
              </div>
            </>
          ) : null}
          <label className="publish-toggle">
            <input
              defaultChecked={challenge?.is_published ?? false}
              name="isPublished"
              type="checkbox"
            />
            <span>
              <strong>Publish now</strong>
              <small>Students can see and answer published challenges.</small>
            </span>
          </label>
          <label className="publish-toggle">
            <input
              checked={feedbackEnabled}
              onChange={(e) => setFeedbackEnabled(e.target.checked)}
              name="feedbackEnabled"
              type="checkbox"
            />
            <span>
              <strong>Allow student feedback</strong>
              <small>Students can rate difficulty, clarity, and share comments.</small>
            </span>
          </label>
          <footer className="modal-actions">
            <button
              className="button button-secondary"
              onClick={onCancel}
              disabled={pending}
              type="button"
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              disabled={pending}
              type="submit"
            >
              {pending ? 'Saving...' : challenge ? 'Save changes' : current < total ? 'Save and next' : 'Create challenge'}
            </button>
          </footer>
        </form>
        )}
      </section>
    </div>
  )
}
