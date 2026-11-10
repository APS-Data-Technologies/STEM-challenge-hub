import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { AuthScreen } from './components/AuthScreen'
import { ChallengeForm } from './components/ChallengeForm'
import { getSupabaseClient } from './lib/supabase'
import type {
  AnswerFeedback,
  Challenge,
  ClassRecord,
  DashboardData,
  Profile,
  Submission,
} from './lib/types'
import './App.css'

const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
)

function App() {
  const supabase = useMemo(
    () => (isSupabaseConfigured ? getSupabaseClient() : null),
    [],
  )
  const [user, setUser] = useState<User | null>(null)
  const [passwordRecovery, setPasswordRecovery] = useState(() =>
    window.location.hash.includes('type=recovery'),
  )
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showClassForm, setShowClassForm] = useState(false)
  const [showClassManagement, setShowClassManagement] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [viewingSubmission, setViewingSubmission] =
    useState<Submission | null>(null)
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [teacherView, setTeacherView] = useState<'challenges' | 'progress'>(
    'challenges',
  )
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(
    null,
  )
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [answerFeedback, setAnswerFeedback] = useState<
    Record<string, AnswerFeedback>
  >({})

  useEffect(() => {
    if (!supabase) {
      return
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setPageError(error.message)
      }
      const currentUser = data.session?.user ?? null
      setUser(currentUser)
      setProfileLoading(Boolean(currentUser))
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      if (event === 'SIGNED_OUT') setPasswordRecovery(false)
      setUser(currentUser)
      setProfileLoading(Boolean(currentUser))
      setProfile(null)
      setClasses([])
      setDashboard(null)
      setSelectedClassId('')
      setPageError('')
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!supabase || !user) {
      return
    }

    let active = true
    void supabase
      .from('profiles')
      .select('id, role, display_name')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setPageError(error.message)
          setProfileLoading(false)
          return
        }
        setProfile(data as Profile)
        setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [supabase, user])

  useEffect(() => {
    if (!supabase || !user || !profile) {
      return
    }

    let active = true
    void (async () => {
      try {
        let nextClasses: ClassRecord[]
        if (profile.role === 'teacher') {
          const { data, error } = await supabase
            .from('classes')
            .select('id, name, join_code, created_at')
            .eq('teacher_id', user.id)
            .order('created_at', { ascending: true })
          if (error) throw error
          nextClasses = (data ?? []) as ClassRecord[]
        } else {
          const { data: enrollments, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('class_id')
            .eq('student_id', user.id)
          if (enrollmentError) throw enrollmentError
          const classIds = (enrollments ?? []).map((row) => row.class_id)
          if (classIds.length === 0) {
            nextClasses = []
          } else {
            const { data, error } = await supabase
              .from('classes')
              .select('id, name, join_code, created_at')
              .in('id', classIds)
              .order('created_at', { ascending: true })
            if (error) throw error
            nextClasses = (data ?? []) as ClassRecord[]
          }
        }

        if (!active) return
        setClasses(nextClasses)
        setSelectedClassId((current) =>
          nextClasses.some((classRecord) => classRecord.id === current)
            ? current
            : (nextClasses[0]?.id ?? ''),
        )
      } catch (error) {
        if (active) setPageError(errorMessage(error))
      }
    })()

    return () => {
      active = false
    }
  }, [supabase, user, profile, refreshKey])

  useEffect(() => {
    if (!supabase || !user || !profile || !selectedClassId) {
      return
    }

    let active = true
    void (async () => {
      try {
        const { data: challengeRows, error: challengeError } = await supabase
          .from('challenges')
          .select(
            'id, class_id, title, prompt, subject, grade_band, answer_type, choices, is_published, created_at',
          )
          .eq('class_id', selectedClassId)
          .order('created_at', { ascending: false })
        if (challengeError) throw challengeError
        const challenges = (challengeRows ?? []) as Challenge[]
        const challengeIds = challenges.map((challenge) => challenge.id)

        let members: Profile[] = []
        let submissions: Submission[] = []

        if (profile.role === 'teacher') {
          const { data: enrollmentRows, error: enrollmentError } =
            await supabase
              .from('enrollments')
              .select('student_id')
              .eq('class_id', selectedClassId)
          if (enrollmentError) throw enrollmentError
          const studentIds = (enrollmentRows ?? []).map(
            (row) => row.student_id,
          )
          if (studentIds.length > 0) {
            const { data, error } = await supabase
              .from('profiles')
              .select('id, role, display_name')
              .in('id', studentIds)
            if (error) throw error
            members = (data ?? []) as Profile[]
          }
          if (challengeIds.length > 0) {
            const { data, error } = await supabase
              .from('submissions')
              .select(
                'id, challenge_id, student_id, answer, is_correct, submitted_at',
              )
              .in('challenge_id', challengeIds)
            if (error) throw error
            submissions = (data ?? []) as Submission[]
          }
        } else if (challengeIds.length > 0) {
          const { data, error } = await supabase
            .from('submissions')
            .select(
              'id, challenge_id, student_id, answer, is_correct, submitted_at',
            )
            .eq('student_id', user.id)
            .in('challenge_id', challengeIds)
          if (error) throw error
          submissions = (data ?? []) as Submission[]
        }

        if (active) {
          setDashboard({
            classId: selectedClassId,
            challenges,
            members: members.sort((a, b) =>
              a.display_name.localeCompare(b.display_name),
            ),
            submissions,
          })
          setPageError('')
        }
      } catch (error) {
        if (active) setPageError(errorMessage(error))
      }
    })()

    return () => {
      active = false
    }
  }, [supabase, user, profile, selectedClassId, refreshKey])

  async function handleSignOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) setPageError(error.message)
  }

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !user) return
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('className') ?? '').trim()
    if (!name) return

    const { error } = await supabase.from('classes').insert({ name })
    if (error) {
      setPageError(error.message)
      return
    }
    setShowClassForm(false)
    setRefreshKey((key) => key + 1)
  }

  async function joinClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const formData = new FormData(event.currentTarget)
    const code = String(formData.get('joinCode') ?? '').trim()
    const { error } = await supabase.rpc('join_class', { code })
    if (error) {
      setPageError(error.message)
      return
    }
    setPageError('')
    setRefreshKey((key) => key + 1)
  }

  async function submitAnswer(
    event: FormEvent<HTMLFormElement>,
    challenge: Challenge,
  ) {
    event.preventDefault()
    if (!supabase) return
    const answer = answerDrafts[challenge.id]?.trim()
    if (!answer) {
      setAnswerFeedback((current) => ({
        ...current,
        [challenge.id]: {
          kind: 'error',
          message: 'Please enter or choose an answer.',
        },
      }))
      return
    }

    const { data: isCorrect, error } = await supabase.rpc('submit_answer', {
      challenge_id: challenge.id,
      answer,
    })
    if (error) {
      setAnswerFeedback((current) => ({
        ...current,
        [challenge.id]: { kind: 'error', message: error.message },
      }))
      return
    }

    if (
      challenge.answer_type === 'multiple_choice' &&
      typeof isCorrect !== 'boolean'
    ) {
      setAnswerFeedback((current) => ({
        ...current,
        [challenge.id]: {
          kind: 'error',
          message: 'Your answer was saved, but could not be graded. Please contact your teacher.',
        },
      }))
      setRefreshKey((key) => key + 1)
      return
    }

    const feedback: AnswerFeedback =
      challenge.answer_type === 'multiple_choice'
        ? {
            kind: isCorrect ? 'success' : 'error',
            message: isCorrect
              ? 'Correct! Great work.'
              : 'Not quite. Try another answer.',
          }
        : {
            kind: 'success',
            message: 'Your answer is saved for your teacher to review.',
          }
    setAnswerFeedback((current) => ({
      ...current,
      [challenge.id]: feedback,
    }))
    setRefreshKey((key) => key + 1)
  }

  async function evaluateSubmission(
    submission: Submission,
    isCorrect: boolean,
  ) {
    if (!supabase) return
    const { error } = await supabase
      .from('submissions')
      .update({ is_correct: isCorrect })
      .eq('id', submission.id)
    if (error) {
      setPageError(error.message)
      return
    }
    setPageError('')
    setRefreshKey((key) => key + 1)
  }

  async function deleteChallenge(challenge: Challenge) {
    if (!supabase || !window.confirm(`Delete “${challenge.title}”?`)) return
    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', challenge.id)
    if (error) {
      setPageError(error.message)
      return
    }
    setRefreshKey((key) => key + 1)
  }

  async function togglePublished(challenge: Challenge) {
    if (!supabase) return
    const { error } = await supabase
      .from('challenges')
      .update({ is_published: !challenge.is_published })
      .eq('id', challenge.id)
    if (error) {
      setPageError(error.message)
      return
    }
    setRefreshKey((key) => key + 1)
  }

  async function copyJoinCode(joinCode: string) {
    try {
      await navigator.clipboard.writeText(joinCode)
      setPageError('')
      window.alert('Class join code copied.')
    } catch (error) {
      setPageError(`Could not copy the join code: ${errorMessage(error)}`)
    }
  }

  async function renameClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !selectedClass) return
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('className') ?? '').trim()
    if (!name) return
    const { error } = await supabase
      .from('classes')
      .update({ name })
      .eq('id', selectedClass.id)
    if (error) {
      setPageError(error.message)
      return
    }
    setShowClassManagement(false)
    setRefreshKey((key) => key + 1)
  }

  async function removeStudent(student: Profile) {
    if (!supabase || !selectedClass) return
    const confirmed = window.confirm(
      `Remove ${student.display_name} from ${selectedClass.name}? They will lose class access. Their existing submissions will remain available to teachers.`,
    )
    if (!confirmed) return
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('class_id', selectedClass.id)
      .eq('student_id', student.id)
    if (error) {
      setPageError(error.message)
      return
    }
    setRefreshKey((key) => key + 1)
  }

  async function deleteClass() {
    if (!supabase || !selectedClass) return
    const confirmed = window.confirm(
      `Delete ${selectedClass.name}? Its challenges and submissions will also be permanently deleted.`,
    )
    if (!confirmed) return
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', selectedClass.id)
    if (error) {
      setPageError(error.message)
      return
    }
    setShowClassManagement(false)
    setSelectedClassId('')
    setRefreshKey((key) => key + 1)
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !user) return
    const formData = new FormData(event.currentTarget)
    const displayName = String(formData.get('displayName') ?? '').trim()
    if (!displayName) return
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id)
    if (error) {
      setPageError(error.message)
      return
    }
    setProfile((current) =>
      current ? { ...current, display_name: displayName } : current,
    )
    setShowProfile(false)
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="config-screen">
        <div className="config-card">
          <Brand />
          <p className="eyebrow">One quick setup step</p>
          <h1>Connect your classroom hub.</h1>
          <p>
            Add your Supabase project URL and anon key to <code>.env</code>{' '}
            using the names in <code>.env.example</code>, then restart the dev
            server.
          </p>
          <p className="privacy-note">
            Keep the service-role key private. The app uses Supabase Auth and
            row-level security directly.
          </p>
        </div>
      </main>
    )
  }

  if (passwordRecovery && user) {
    return (
      <AuthScreen
        supabase={supabase!}
        error={pageError}
        onError={setPageError}
        onRecoveryComplete={() => setPasswordRecovery(false)}
        recovery
      />
    )
  }

  if (loading || (user && profileLoading)) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <AuthScreen
        supabase={supabase!}
        error={pageError}
        onError={setPageError}
      />
    )
  }

  if (!profile) {
    return (
      <main className="loading-screen">
        <Brand />
        <div className="notice notice-error" role="alert">
          <span>
            {pageError ||
              'Your account profile could not be loaded. Check that the Supabase database schema has been applied.'}
          </span>
        </div>
        <button className="button button-secondary" onClick={handleSignOut}>
          Sign out
        </button>
      </main>
    )
  }

  const selectedClass = classes.find(
    (classRecord) => classRecord.id === selectedClassId,
  )
  const isTeacher = profile.role === 'teacher'
  const currentDashboard =
    dashboard?.classId === selectedClass?.id ? dashboard : null

  return (
    <div className="app-shell">
      <header className="app-header workspace-topbar">
        <div className="workspace-breadcrumb">
          <span>Workspace</span>
          <span aria-hidden="true">/</span>
          <strong>{isTeacher ? 'Challenge hub' : 'My challenges'}</strong>
        </div>
        <div className="account-menu">
          <div className="avatar" aria-hidden="true">
            {profile.display_name.slice(0, 1).toUpperCase()}
          </div>
          <div className="account-copy">
            <strong>{profile.display_name}</strong>
            <span>{isTeacher ? 'Teacher' : 'Student'}</span>
          </div>
          <button
            className="button button-quiet"
            onClick={() => setShowProfile(true)}
          >
            Profile
          </button>
          <button className="button button-quiet" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard workspace-layout">
        <aside className="sidebar workspace-sidebar">
          <Brand />
          <p className="workspace-role">
            {isTeacher ? 'TEACHER WORKSPACE' : 'STUDENT WORKSPACE'}
          </p>
          <nav className="workspace-nav" aria-label="Workspace navigation">
            <button
              aria-current={isTeacher && teacherView === 'challenges' ? 'page' : undefined}
              className={`workspace-nav-item${!isTeacher || teacherView === 'challenges' ? ' is-active' : ''}`}
              onClick={() => setTeacherView('challenges')}
            >
              <span aria-hidden="true">{isTeacher ? '⚗' : '✳'}</span>
              {isTeacher ? 'Challenge hub' : 'My challenges'}
            </button>
            {isTeacher ? (
              <>
                <button
                  aria-current={teacherView === 'progress' ? 'page' : undefined}
                  className={`workspace-nav-item${teacherView === 'progress' ? ' is-active' : ''}`}
                  onClick={() => setTeacherView('progress')}
                >
                  <span aria-hidden="true">▤</span>
                  Class progress
                </button>
                <button
                  className="workspace-nav-item"
                  onClick={() => setShowClassManagement(true)}
                  disabled={!selectedClass}
                >
                  <span aria-hidden="true">♧</span>
                  My classes
                </button>
              </>
            ) : null}
          </nav>
          <div className="workspace-class-list">
            <p className="sidebar-label">
              {isTeacher ? 'YOUR CLASS' : 'YOUR CLASSES'}
            </p>
            {classes.map((classRecord) => (
              <button
                className={`class-link${selectedClassId === classRecord.id ? ' is-active' : ''}`}
                key={classRecord.id}
                onClick={() => setSelectedClassId(classRecord.id)}
              >
                <span className="class-dot" aria-hidden="true" />
                <span>{classRecord.name}</span>
              </button>
            ))}
            {isTeacher ? (
              <button
                className="new-class-link"
                onClick={() => setShowClassForm((visible) => !visible)}
              >
                <span aria-hidden="true">+</span> Create a class
              </button>
            ) : null}
          </div>
          {showClassForm ? (
            <form className="sidebar-form" onSubmit={createClass}>
              <label htmlFor="className">Class name</label>
              <input
                autoFocus
                id="className"
                name="className"
                placeholder="e.g. Grade 7 Science"
                required
              />
              <button className="button button-primary" type="submit">
                Create class
              </button>
            </form>
          ) : null}
          {!isTeacher ? (
            <form className="join-form" onSubmit={joinClass}>
              <label htmlFor="joinCode">Join a class</label>
              <input
                id="joinCode"
                maxLength={6}
                minLength={6}
                name="joinCode"
                placeholder="6-character code"
                required
              />
              <button className="button button-primary" type="submit">
                Join class
              </button>
            </form>
          ) : null}
          <div className="sidebar-curiosity">
            <span aria-hidden="true">✦</span>
            <strong>Small challenges. Big discoveries.</strong>
            <p>A little curiosity goes a long way.</p>
          </div>
          <button className="sidebar-help" type="button">
            <span aria-hidden="true">?</span> Help &amp; resources
          </button>
          <div className="sidebar-note">
            <span className="note-icon" aria-hidden="true">
              i
            </span>
            <p>Demo project. Use fictional names and classroom data only.</p>
          </div>
        </aside>

        <section className="main-panel">
          {pageError ? (
            <div className="notice notice-error" role="alert">
              <span>{pageError}</span>
              <button
                aria-label="Dismiss error"
                onClick={() => setPageError('')}
              >
                ×
              </button>
            </div>
          ) : null}
          {selectedClass ? (
            <>
              <div className="page-heading workspace-page-heading">
                <div>
                  <p className="eyebrow">
                    {isTeacher
                      ? 'A WORKSHOP FOR CURIOUS MINDS'
                      : 'YOUR LEARNING SPACE'}
                  </p>
                  <h1>{isTeacher ? 'Challenge hub' : 'My challenges'}</h1>
                  <p className="page-subtitle">
                    {isTeacher
                      ? 'Small experiments. Real discoveries. See what your class can do.'
                      : `Pick a challenge from ${selectedClass.name} and show what you know.`}
                  </p>
                </div>
                {isTeacher ? (
                  <div className="class-heading-actions">
                    {teacherView === 'challenges' ? (
                      <button
                        className="button button-primary create-challenge-button"
                        onClick={() => {
                          setEditingChallenge(null)
                          setShowChallengeForm(true)
                        }}
                      >
                        <span aria-hidden="true">+</span> Create a challenge
                      </button>
                    ) : null}
                    <button
                      className="join-code"
                      onClick={() => void copyJoinCode(selectedClass.join_code)}
                      title="Copy class join code"
                    >
                      <span>CLASS JOIN CODE · COPY</span>
                      <strong>{selectedClass.join_code}</strong>
                    </button>
                    <button
                      className="button button-secondary manage-class-button"
                      onClick={() => setShowClassManagement(true)}
                    >
                      Manage class
                    </button>
                  </div>
                ) : null}
              </div>

              <section className="class-greeting" aria-label="Class overview">
                <div>
                  <p className="class-greeting-label">
                    {selectedClass.name.toUpperCase()}
                  </p>
                  <h2>
                    {isTeacher
                      ? 'A good day to ask “what if?”'
                      : 'Ready to explore something new?'}
                  </h2>
                  <p>
                    {isTeacher
                      ? `${currentDashboard?.members.length ?? 0} curious minds · ${currentDashboard?.challenges.filter((challenge) => challenge.is_published).length ?? 0} active challenges · Endless possibilities`
                      : `${currentDashboard?.challenges.filter((challenge) => challenge.is_published).length ?? 0} challenges waiting for you`}
                  </p>
                </div>
                <div className="class-greeting-orbit" aria-hidden="true">
                  <span>◎</span>
                  <i />
                </div>
              </section>

              {isTeacher ? (
                <TeacherDashboard
                  classRecord={selectedClass}
                  dashboard={currentDashboard}
                  view={teacherView}
                  onViewChange={setTeacherView}
                  onCreate={() => {
                    setEditingChallenge(null)
                    setShowChallengeForm(true)
                  }}
                  onDelete={deleteChallenge}
                  onEdit={(challenge) => {
                    setEditingChallenge(challenge)
                    setShowChallengeForm(true)
                  }}
                  onEvaluateSubmission={evaluateSubmission}
                  onViewAnswer={setViewingSubmission}
                  onTogglePublished={togglePublished}
                />
              ) : (
                <StudentDashboard
                  dashboard={currentDashboard}
                  answerDrafts={answerDrafts}
                  answerFeedback={answerFeedback}
                  onAnswerChange={(challengeId, answer) =>
                    setAnswerDrafts((current) => ({
                      ...current,
                      [challengeId]: answer,
                    }))
                  }
                  onSubmit={submitAnswer}
                />
              )}
            </>
          ) : (
            <EmptyClasses
              isTeacher={isTeacher}
              onCreate={() => setShowClassForm(true)}
            />
          )}
        </section>
      </main>

      {showChallengeForm && selectedClass ? (
        <ChallengeForm
          challenge={editingChallenge}
          classId={selectedClass.id}
          onCancel={() => setShowChallengeForm(false)}
          onError={setPageError}
          onSaved={() => {
            setShowChallengeForm(false)
            setRefreshKey((key) => key + 1)
          }}
          supabase={supabase!}
        />
      ) : null}
      {showClassManagement && selectedClass && dashboard ? (
        <ClassManagement
          classRecord={selectedClass}
          members={dashboard.members}
          onCancel={() => setShowClassManagement(false)}
          onDeleteClass={deleteClass}
          onRemoveStudent={removeStudent}
          onRenameClass={renameClass}
        />
      ) : null}
      {showProfile ? (
        <ProfileDialog
          email={user.email ?? ''}
          profile={profile}
          onCancel={() => setShowProfile(false)}
          onSave={updateProfile}
        />
      ) : null}
      {viewingSubmission ? (
        <AnswerViewer
          challenge={dashboard?.challenges.find(
            (challenge) => challenge.id === viewingSubmission.challenge_id,
          )}
          onClose={() => setViewingSubmission(null)}
          student={dashboard?.members.find(
            (member) => member.id === viewingSubmission.student_id,
          )}
          submission={viewingSubmission}
        />
      ) : null}
    </div>
  )
}

function TeacherDashboard({
  classRecord,
  dashboard,
  view,
  onViewChange,
  onCreate,
  onDelete,
  onEdit,
  onEvaluateSubmission,
  onViewAnswer,
  onTogglePublished,
}: {
  classRecord: ClassRecord
  dashboard: DashboardData | null
  view: 'challenges' | 'progress'
  onViewChange: (view: 'challenges' | 'progress') => void
  onCreate: () => void
  onDelete: (challenge: Challenge) => void
  onEdit: (challenge: Challenge) => void
  onEvaluateSubmission: (submission: Submission, isCorrect: boolean) => void
  onViewAnswer: (submission: Submission) => void
  onTogglePublished: (challenge: Challenge) => void
}) {
  const [challengeFilter, setChallengeFilter] = useState<
    'active' | 'drafts' | 'completed'
  >('active')
  const [query, setQuery] = useState('')
  const challenges = dashboard?.challenges ?? []
  const submissions = dashboard?.submissions ?? []
  const completedChallenges = challenges.filter((challenge) => {
    if (!challenge.is_published || !dashboard?.members.length) return false
    const submittedStudentIds = new Set(
      submissions
        .filter((submission) => submission.challenge_id === challenge.id)
        .map((submission) => submission.student_id),
    )
    return submittedStudentIds.size >= dashboard.members.length
  })
  const activeChallenges = challenges.filter(
    (challenge) =>
      challenge.is_published && !completedChallenges.includes(challenge),
  )
  const draftChallenges = challenges.filter((challenge) => !challenge.is_published)
  const visibleChallenges = (
    challengeFilter === 'active'
      ? activeChallenges
      : challengeFilter === 'drafts'
        ? draftChallenges
        : completedChallenges
  ).filter((challenge) =>
    `${challenge.title} ${challenge.prompt} ${challenge.subject}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )

  return (
    <>
      {view === 'challenges' ? (
        <div className="challenge-toolbar">
          <div
            className="challenge-filters"
            role="tablist"
            aria-label="Challenge status"
          >
            {(
              [
                ['active', 'Active', activeChallenges.length],
                ['drafts', 'Drafts', draftChallenges.length],
                ['completed', 'Completed', completedChallenges.length],
              ] as const
            ).map(([key, label, count]) => (
              <button
                aria-selected={challengeFilter === key}
                className={challengeFilter === key ? 'is-selected' : ''}
                key={key}
                onClick={() => setChallengeFilter(key)}
                role="tab"
              >
                {label} <span>{count}</span>
              </button>
            ))}
          </div>
          <div className="challenge-toolbar-actions">
            <label className="challenge-search">
              <span aria-hidden="true">⌕</span>
              <input
                aria-label="Find a challenge"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a challenge"
                value={query}
              />
            </label>
            </div>
        </div>
      ) : null}
      {!dashboard ? (
        <LoadingInline />
      ) : view === 'challenges' ? (
        visibleChallenges.length ? (
          <div className="challenge-gallery">
            {visibleChallenges.map((challenge) => {
              const challengeSubmissions = submissions.filter(
                (submission) => submission.challenge_id === challenge.id,
              )
              const pendingCount = challengeSubmissions.filter(
                (submission) => submission.is_correct === null,
              ).length
              const completion =
                dashboard.members.length > 0
                  ? Math.min(
                      100,
                      (challengeSubmissions.length / dashboard.members.length) *
                        100,
                    )
                  : 0
              return (
              <article
                className={`teacher-challenge-card challenge-${challenge.subject.toLowerCase()}`}
                key={challenge.id}
              >
                <div
                  className={`challenge-cover challenge-cover-${challenge.subject.toLowerCase()}`}
                  aria-hidden="true"
                >
                  <span>{challenge.subject}</span>
                  <SubjectMark subject={challenge.subject} />
                </div>
                <div className="teacher-challenge-content">
                  <div className="challenge-card-topline">
                    <span className="challenge-subject-label">
                      {challenge.subject.toUpperCase()}
                    </span>
                    <span
                      className={
                        challenge.is_published
                          ? 'status-pill status-live'
                          : 'status-pill status-draft'
                      }
                    >
                      {challenge.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="challenge-title-line">
                    <h2>{challenge.title}</h2>
                  </div>
                  <p className="teacher-challenge-prompt">{challenge.prompt}</p>
                  <div className="challenge-meta">
                    <span>{challenge.grade_band}</span>
                    <span>
                      {challenge.answer_type === 'multiple_choice'
                        ? 'Multiple choice'
                        : 'Short answer'}
                    </span>
                  </div>
                  <div className="challenge-submission-progress">
                    <div className="submission-progress-label">
                      <span>Class submissions</span>
                      <strong>
                        {challengeSubmissions.length}
                        {dashboard.members.length
                          ? `/${dashboard.members.length}`
                          : ''}
                      </strong>
                    </div>
                    <div
                      className="submission-progress-track"
                      role="progressbar"
                      aria-label={`${challenge.title} submissions`}
                      aria-valuemax={dashboard.members.length || 1}
                      aria-valuemin={0}
                      aria-valuenow={
                        dashboard.members.length
                          ? Math.min(
                              challengeSubmissions.length,
                              dashboard.members.length,
                            )
                          : 0
                      }
                    >
                      <span style={{ width: `${completion}%` }} />
                    </div>
                  </div>
                  <div className="challenge-card-footer">
                    <button
                      className="text-button"
                      onClick={() => onViewChange('progress')}
                    >
                      Review answers
                    </button>
                    <span className="review-count">
                      {pendingCount} to review
                    </span>
                  </div>
                  <div className="challenge-card-actions">
                    <button
                      className="text-button"
                      onClick={() => onTogglePublished(challenge)}
                    >
                      {challenge.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      className="text-button"
                      onClick={() => onEdit(challenge)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-button text-danger"
                      onClick={() => onDelete(challenge)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
              )
            })}
          </div>
        ) : (
          visibleChallenges.length === 0 &&
          (challengeFilter === 'drafts' && draftChallenges.length === 0 ? (
            <div className="empty-state compact-empty">
              <h2>No drafts yet</h2>
              <p>Save a challenge as a draft to finish it later.</p>
              <button className="button button-primary" onClick={onCreate}>
                Create a challenge
              </button>
            </div>
          ) : challengeFilter === 'completed' ? (
            <div className="empty-state compact-empty">
              <h2>No completed challenges yet</h2>
              <p>
                A challenge appears here after every student in the class has
                submitted an answer.
              </p>
            </div>
          ) : activeChallenges.length === 0 && !query ? (
            <EmptyChallenges onCreate={onCreate} />
          ) : (
            <div className="empty-state compact-empty">
              <h2>No matching challenges</h2>
              <p>Try a different search or choose another challenge filter.</p>
            </div>
          ))
        )
      ) : (
        <ProgressTable
          challenges={challenges.filter((challenge) => challenge.is_published)}
          classRecord={classRecord}
          members={dashboard.members}
          onEvaluateSubmission={onEvaluateSubmission}
          onViewAnswer={onViewAnswer}
          submissions={submissions}
        />
      )}
    </>
  )
}

function StudentDashboard({
  dashboard,
  answerDrafts,
  answerFeedback,
  onAnswerChange,
  onSubmit,
}: {
  dashboard: DashboardData | null
  answerDrafts: Record<string, string>
  answerFeedback: Record<string, AnswerFeedback>
  onAnswerChange: (challengeId: string, answer: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>, challenge: Challenge) => void
}) {
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all')
  const [query, setQuery] = useState('')
  const challenges =
    dashboard?.challenges.filter((challenge) => challenge.is_published) ?? []
  const submissions = dashboard?.submissions ?? []
  const submittedCount = challenges.filter((challenge) =>
    submissions.some((submission) => submission.challenge_id === challenge.id),
  ).length
  const pendingReviewCount = submissions.filter(
    (submission) => submission.is_correct === null,
  ).length

  if (!dashboard) return <LoadingInline />
  if (!challenges.length) {
    return (
      <div className="empty-state">
        <span className="empty-illustration" aria-hidden="true">
          ✳
        </span>
        <h2>No challenges just yet</h2>
        <p>Your teacher will add a challenge here when it’s ready.</p>
      </div>
    )
  }

  const filteredChallenges = challenges.filter((challenge) => {
    const isDone = submissions.some(
      (submission) => submission.challenge_id === challenge.id,
    )
    const matchesStatus =
      filter === 'all' || (filter === 'done' ? isDone : !isDone)
    const matchesQuery =
      `${challenge.title} ${challenge.prompt} ${challenge.subject}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    return matchesStatus && matchesQuery
  })

  return (
    <>
      <div className="student-dashboard-head">
        <div
          className="student-filter-tabs"
          role="tablist"
          aria-label="Filter challenges"
        >
          {(['all', 'todo', 'done'] as const).map((tab) => {
            const count = challenges.filter((challenge) => {
              const isDone = submissions.some(
                (submission) => submission.challenge_id === challenge.id,
              )
              return tab === 'all' || (tab === 'done' ? isDone : !isDone)
            }).length
            return (
              <button
                aria-selected={filter === tab}
                className={filter === tab ? 'is-selected' : ''}
                key={tab}
                onClick={() => setFilter(tab)}
                role="tab"
              >
                {tab === 'all' ? 'All' : tab === 'todo' ? 'To do' : 'Done'} (
                {count})
              </button>
            )
          })}
        </div>
        <label className="challenge-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Find a challenge"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a challenge"
            value={query}
          />
        </label>
      </div>
      {filteredChallenges.length ? (
        <div className="student-workspace-content">
        <div className="student-challenges">
      {filteredChallenges.map((challenge, index) => {
        const submission = submissions.find(
          (item) => item.challenge_id === challenge.id,
        )
        return (
          <article
            className={`student-challenge student-${challenge.subject.toLowerCase()}`}
            key={challenge.id}
          >
            <div
              className={`student-challenge-cover challenge-cover-${challenge.subject.toLowerCase()}`}
              aria-hidden="true"
            >
              <span>{challenge.subject}</span>
              <SubjectMark subject={challenge.subject} />
            </div>
            <div className="student-challenge-top">
              <span className="challenge-number">
                CHALLENGE {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h2>{challenge.title}</h2>
            <p className="student-prompt">{challenge.prompt}</p>
            <div className="challenge-meta">
              <span>{challenge.subject}</span>
              <span>{challenge.grade_band}</span>
              {submission ? <span>Submitted</span> : null}
            </div>
            <form
              className="answer-form"
              onSubmit={(event) => onSubmit(event, challenge)}
            >
              {challenge.answer_type === 'multiple_choice' ? (
                <div className="choice-list">
                  {(challenge.choices ?? []).map((choice) => (
                    <label className="choice-option" key={choice}>
                      <input
                        checked={answerDrafts[challenge.id] === choice}
                        name={`answer-${challenge.id}`}
                        onChange={() => onAnswerChange(challenge.id, choice)}
                        type="radio"
                        value={choice}
                      />
                      <span>{choice}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <label className="field-label">
                  Your answer
                  <textarea
                    onChange={(event) =>
                      onAnswerChange(challenge.id, event.target.value)
                    }
                    placeholder="Share your thinking..."
                    rows={3}
                    value={answerDrafts[challenge.id] ?? ''}
                  />
                </label>
              )}
              <div className="answer-actions">
                <button className="button button-primary" type="submit">
                  {submission ? 'Update answer' : 'Submit answer'}
                </button>
                {answerFeedback[challenge.id] ? (
                  <div
                    className={`answer-feedback answer-feedback-${answerFeedback[challenge.id].kind}`}
                    role="status"
                  >
                    {answerFeedback[challenge.id].message}
                  </div>
                ) : null}
              </div>
              {submission ? (
                <div className="saved-answer">
                  <strong>Your saved answer</strong>
                  <span>{submission.answer}</span>
                  {submission.is_correct === null ? (
                    <small>
                      Awaiting teacher evaluation. Check back later for feedback.
                    </small>
                  ) : (
                    <div
                      className={`teacher-result ${submission.is_correct ? 'teacher-result-correct' : 'teacher-result-revision'}`}
                      role="status"
                    >
                      <strong>
                        {submission.is_correct
                          ? challenge.answer_type === 'multiple_choice'
                            ? 'Correct!'
                            : 'Your teacher marked this correct.'
                          : challenge.answer_type === 'multiple_choice'
                            ? 'Not quite. Try another answer.'
                            : 'Your teacher reviewed this answer.'}
                      </strong>
                      <span>
                        {submission.is_correct
                          ? 'Great work! Keep up your curiosity.'
                          : challenge.answer_type === 'multiple_choice'
                            ? 'Choose a different answer and submit again.'
                            : 'Review your thinking with your teacher.'}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </form>
          </article>
        )
      })}
        </div>
        <aside className="student-discoveries">
          <div className="discoveries-heading">
            <span aria-hidden="true">✦</span>
            <h2>Your discoveries</h2>
          </div>
          <p>Every great idea starts with a question.</p>
          <div className="discovery-stat">
            <span>Challenges completed</span>
            <strong>
              {submittedCount}
              <small> / {challenges.length}</small>
            </strong>
          </div>
          <div className="discovery-stat">
            <span>Awaiting teacher review</span>
            <strong>{pendingReviewCount}</strong>
          </div>
          <div className="discovery-note">
            <span aria-hidden="true">✧</span>
            <p>
              {pendingReviewCount
                ? 'Your teacher is reviewing your work. Keep exploring while you wait!'
                : 'Try a challenge and share how you figured it out.'}
            </p>
          </div>
        </aside>
        </div>
      ) : (
        <div className="empty-state compact-empty">
          <h2>{filter === 'todo' ? 'All caught up!' : 'Nothing here yet'}</h2>
          <p>
            {filter === 'todo'
              ? 'You have submitted an answer for every challenge in this class.'
              : 'Challenges you submit will appear here.'}
          </p>
        </div>
      )}
    </>
  )
}

function ProgressTable({
  challenges,
  classRecord,
  members,
  onEvaluateSubmission,
  onViewAnswer,
  submissions,
}: {
  challenges: Challenge[]
  classRecord: ClassRecord
  members: Profile[]
  onEvaluateSubmission: (submission: Submission, isCorrect: boolean) => void
  onViewAnswer: (submission: Submission) => void
  submissions: Submission[]
}) {
  const mcSubmissions = submissions.filter((submission) => {
    const challenge = challenges.find(
      (item) => item.id === submission.challenge_id,
    )
    return (
      challenge?.answer_type === 'multiple_choice' &&
      submission.is_correct !== null
    )
  })
  const correctAnswers = mcSubmissions.filter(
    (submission) => submission.is_correct === true,
  ).length
  const reviewCount = submissions.filter((submission) => {
    const challenge = challenges.find(
      (item) => item.id === submission.challenge_id,
    )
    return (
      challenge?.answer_type === 'short_answer' &&
      submission.is_correct === null
    )
  }).length
  const studentsNeedingHelp = new Set(
    submissions
      .filter((submission) => submission.is_correct === false)
      .map((submission) => submission.student_id),
  ).size

  if (members.length === 0) {
    return (
      <div className="empty-state compact-empty">
        <h2>Waiting for students</h2>
        <p>
          Share class code <strong>{classRecord.join_code}</strong> with your
          students so they can join.
        </p>
      </div>
    )
  }

  if (challenges.length === 0) {
    return (
      <div className="empty-state compact-empty">
        <h2>Publish a challenge to track progress</h2>
        <p>Published challenges will appear in the class progress table.</p>
      </div>
    )
  }

  const accuracy =
    mcSubmissions.length === 0
      ? '—'
      : `${Math.round((correctAnswers / mcSubmissions.length) * 100)}%`

  return (
    <>
      <div className="progress-summary">
        <SummaryCard label="Students" value={String(members.length)} />
        <SummaryCard
          label="Multiple-choice accuracy"
          value={accuracy}
          detail={
            mcSubmissions.length
              ? `${correctAnswers} correct of ${mcSubmissions.length} evaluated`
              : 'No answers submitted'
          }
        />
        <SummaryCard label="Short answers to review" value={String(reviewCount)} />
        <SummaryCard
          label="Students who may need help"
          value={String(studentsNeedingHelp)}
        />
      </div>
      <div className="table-scroll">
      <table className="progress-table">
        <thead>
          <tr>
            <th>Student</th>
            {challenges.map((challenge) => (
              <th key={challenge.id}>{challenge.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <th scope="row">{member.display_name}</th>
              {challenges.map((challenge) => {
                const submission = submissions.find(
                  (item) =>
                    item.student_id === member.id &&
                    item.challenge_id === challenge.id,
                )
                const status = !submission
                  ? 'Not started'
                  : submission.is_correct === null
                    ? 'Awaiting review'
                    : submission.is_correct
                      ? 'Correct'
                      : 'Incorrect'
                return (
                  <td key={challenge.id}>
                    <div className="progress-cell">
                      <span
                        className={`progress-status progress-${status.toLowerCase().replace(' ', '-')}`}
                      >
                        {status}
                      </span>
                      {submission ? (
                        <>
                          {challenge.answer_type === 'short_answer' ? (
                            <button
                              className="text-button"
                              onClick={() => onViewAnswer(submission)}
                            >
                              View answer
                            </button>
                          ) : (
                            <span className="answer-preview">
                              Answer: {submission.answer}
                            </span>
                          )}
                          {challenge.answer_type === 'short_answer' ? (
                            <div className="evaluation-actions">
                              <button
                                aria-label={`Mark ${member.display_name}'s answer to ${challenge.title} correct`}
                                className={`evaluation-button${submission.is_correct === true ? ' is-selected' : ''}`}
                                onClick={() =>
                                  onEvaluateSubmission(submission, true)
                                }
                              >
                                Correct
                              </button>
                              <button
                                aria-label={`Mark ${member.display_name}'s answer to ${challenge.title} needs revision`}
                                className={`evaluation-button evaluation-button-revision${submission.is_correct === false ? ' is-selected' : ''}`}
                                onClick={() =>
                                  onEvaluateSubmission(submission, false)
                                }
                              >
                                Needs revision
                              </button>
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  )
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <article className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  )
}

function ClassManagement({
  classRecord,
  members,
  onCancel,
  onDeleteClass,
  onRemoveStudent,
  onRenameClass,
}: {
  classRecord: ClassRecord
  members: Profile[]
  onCancel: () => void
  onDeleteClass: () => void
  onRemoveStudent: (student: Profile) => void
  onRenameClass: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel()
    }}>
      <section
        aria-labelledby="manage-class-title"
        aria-modal="true"
        className="modal-card management-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">CLASSROOM SETTINGS</p>
            <h2 id="manage-class-title">Manage class</h2>
          </div>
          <button
            aria-label="Close dialog"
            className="icon-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </header>
        <form className="rename-class-form" onSubmit={onRenameClass}>
          <label className="field-label">
            Class name
            <input
              defaultValue={classRecord.name}
              maxLength={80}
              name="className"
              required
            />
          </label>
          <button className="button button-primary" type="submit">
            Save name
          </button>
        </form>
        <div className="management-section">
          <div className="management-section-heading">
            <h3>Students</h3>
            <span>{members.length}</span>
          </div>
          {members.length ? (
            <ul className="member-list">
              {members.map((member) => (
                <li key={member.id}>
                  <span className="member-avatar" aria-hidden="true">
                    {member.display_name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="member-name">{member.display_name}</span>
                  <button
                    className="text-button text-danger"
                    onClick={() => onRemoveStudent(member)}
                    type="button"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="management-empty">
              No students have joined this class yet.
            </p>
          )}
          <p className="field-hint">
            Removing a student revokes class access. Their earlier submissions
            are retained for teacher review.
          </p>
        </div>
        <div className="delete-class-section">
          <div>
            <strong>Delete this class</strong>
            <p>This permanently deletes its challenges and submissions.</p>
          </div>
          <button
            className="button button-danger"
            onClick={onDeleteClass}
            type="button"
          >
            Delete class
          </button>
        </div>
      </section>
    </div>
  )
}

function ProfileDialog({
  email,
  profile,
  onCancel,
  onSave,
}: {
  email: string
  profile: Profile
  onCancel: () => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel()
    }}>
      <section
        aria-labelledby="profile-title"
        aria-modal="true"
        className="modal-card profile-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">YOUR ACCOUNT</p>
            <h2 id="profile-title">Profile</h2>
          </div>
          <button
            aria-label="Close dialog"
            className="icon-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </header>
        <form className="challenge-form" onSubmit={onSave}>
          <label className="field-label">
            Display name
            <input
              defaultValue={profile.display_name}
              maxLength={60}
              name="displayName"
              required
            />
          </label>
          <label className="field-label">
            Email address
            <input disabled readOnly value={email} />
          </label>
          <footer className="modal-actions">
            <button
              className="button button-secondary"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button className="button button-primary" type="submit">
              Save profile
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function AnswerViewer({
  challenge,
  onClose,
  student,
  submission,
}: {
  challenge: Challenge | undefined
  onClose: () => void
  student: Profile | undefined
  submission: Submission
}) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        aria-labelledby="answer-viewer-title"
        aria-modal="true"
        className="modal-card answer-viewer"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">SHORT ANSWER</p>
            <h2 id="answer-viewer-title">{challenge?.title ?? 'Student answer'}</h2>
          </div>
          <button
            aria-label="Close dialog"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <p className="answer-author">
          {student?.display_name ?? 'Student'} ·{' '}
          {new Date(submission.submitted_at).toLocaleString()}
        </p>
        <blockquote>{submission.answer}</blockquote>
        <footer className="modal-actions">
          <button className="button button-primary" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  )
}

function EmptyClasses({
  isTeacher,
  onCreate,
}: {
  isTeacher: boolean
  onCreate: () => void
}) {
  return (
    <div className="empty-state empty-classes">
      <span className="empty-illustration" aria-hidden="true">
        ✳
      </span>
      <h2>{isTeacher ? 'Start with your first class' : 'Join your first class'}</h2>
      <p>
        {isTeacher
          ? 'Create a classroom, then share its join code with your students.'
          : 'Enter a class join code to see the challenges your teacher has made.'}
      </p>
      {isTeacher ? (
        <button className="button button-primary" onClick={onCreate}>
          Create a class
        </button>
      ) : null}
    </div>
  )
}

function EmptyChallenges({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="empty-state">
      <span className="empty-illustration" aria-hidden="true">
        ✳
      </span>
      <h2>Your next great question starts here</h2>
      <p>Create a short challenge to get your students thinking.</p>
      <button className="button button-primary" onClick={onCreate}>
        Create a challenge
      </button>
    </div>
  )
}

function SubjectMark({ subject }: { subject: Challenge['subject'] }) {
  const icon = {
    Science: '⚗',
    Technology: '⌘',
    Engineering: '△',
    Math: '∑',
  }[subject]
  return (
    <span className={`subject-mark subject-${subject.toLowerCase()}`} aria-label={subject}>
      {icon}
    </span>
  )
}

function Brand() {
  return (
    <a className="brand workspace-brand" href="/" aria-label="STEM Hub home">
      <span className="brand-mark" aria-hidden="true">
        ✳
      </span>
      <span className="brand-name">
        <strong>STEM</strong>
        <small>Hub</small>
      </span>
    </a>
  )
}

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <Brand />
      <LoadingInline />
    </main>
  )
}

function LoadingInline() {
  return (
    <div className="loading-indicator" role="status">
      <span className="spinner" />
      Loading your classroom...
    </div>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

export default App
