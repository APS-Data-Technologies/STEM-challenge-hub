import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { AuthScreen } from './components/AuthScreen'
import { Brand } from './components/Brand'
import { ChallengeForm } from './components/ChallengeForm'
import { DailyJourney } from './components/DailyJourney'
import { DailyPrograms } from './components/DailyPrograms'
import { ProfileAvatar, profilePhotoBucket, profilePhotosEnabled } from './components/ProfileAvatar'
import { DisplayModeControl } from './components/DisplayModeControl'
import type { DisplayMode } from './components/DisplayModeControl'
import { getSupabaseClient } from './lib/supabase'
import type {
  AnswerFeedback,
  Challenge,
  ClassGradeBand,
  ClassMessageType,
  ClassRecord,
  DashboardData,
  Profile,
  Submission,
  UserRole,
} from './lib/types'
import './App.css'

const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
)
const displayModeStorageKey = 'stem-challenge-hub-display-mode'
const readAloudStorageKey = 'stem-challenge-hub-read-aloud'
const classOrderStoragePrefix = 'stem-challenge-hub-class-order:'
const classMessageTypes: ClassMessageType[] = [
  'Announcement',
  'Description',
  'Guidelines',
]
function isClassMessageType(value: string): value is ClassMessageType {
  return classMessageTypes.some((type) => type === value)
}
const gradeNames: Record<string, string> = {
  k: 'Kindergarten',
  kindergarten: 'Kindergarten',
  '1': 'One',
  one: 'One',
  '2': 'Two',
  two: 'Two',
  '3': 'Three',
  three: 'Three',
  '4': 'Four',
  four: 'Four',
  '5': 'Five',
  five: 'Five',
  '6': 'Six',
  six: 'Six',
  '7': 'Seven',
  seven: 'Seven',
  '8': 'Eight',
  eight: 'Eight',
  '9': 'Nine',
  nine: 'Nine',
  '10': 'Ten',
  ten: 'Ten',
  '11': 'Eleven',
  eleven: 'Eleven',
  '12': 'Twelve',
  twelve: 'Twelve',
}

function getSavedDisplayMode(): DisplayMode {
  const savedMode = window.localStorage.getItem(displayModeStorageKey)
  return savedMode === 'color-blind' || savedMode === 'dyslexia-friendly'
    ? savedMode
    : 'default'
}

function getSavedReadAloudPreference() {
  return window.localStorage.getItem(readAloudStorageKey) === 'true'
}

function getGradeLabel(grade: string) {
  if (grade === 'Kindergarten') return grade
  const number = Number(grade)
  const suffix =
    number % 100 >= 11 && number % 100 <= 13
      ? 'th'
      : number % 10 === 1
        ? 'st'
        : number % 10 === 2
          ? 'nd'
          : number % 10 === 3
            ? 'rd'
            : 'th'
  return `${number}${suffix}`
}

type TeacherGradeBand = ClassGradeBand

const teacherGradeBands: {
  id: TeacherGradeBand
  title: string
  description: string
  grades: string[]
}[] = [
  {
    id: 'K-5',
    title: 'Kindergarten–Grade 5',
    description: 'Build welcoming foundations and explore core STEM ideas.',
    grades: ['Kindergarten', '1', '2', '3', '4', '5'],
  },
  {
    id: '6-8',
    title: 'Grades 6–8',
    description: 'Create hands-on challenges for middle school learners.',
    grades: ['6', '7', '8'],
  },
  {
    id: '9-12',
    title: 'Grades 9–12',
    description: 'Design deeper investigations for high school students.',
    grades: ['9', '10', '11', '12'],
  },
]

function getClassGrade(className: string): number | null {
  const grade = className.match(
    /\b(?:grade\s+)?(kindergarten|k|(?:1[0-2]|[1-9])(?:st|nd|rd|th)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i,
  )?.[1]
  if (!grade) return null
  const normalized = grade.toLowerCase().replace(/(?:st|nd|rd|th)$/, '')
  if (normalized === 'k' || normalized === 'kindergarten') return 0
  return (
    Number(normalized) ||
    Number(
      Object.entries(gradeNames).find(
        ([, name]) => name.toLowerCase() === normalized,
      )?.[0],
    )
  )
}

function getClassGradeBand(className: string): TeacherGradeBand | null {
  const numericGrade = getClassGrade(className)
  if (numericGrade === null) return null
  if (numericGrade <= 5) return 'K-5'
  if (numericGrade <= 8) return '6-8'
  return '9-12'
}

function getBaseClassName(className: string) {
  const baseName = className
    .replace(/\s*(?:[-–]\s*)?Section\s+[A-C]$/i, '')
    .trim()
  const match = baseName.match(
    /^(?:grade\s+)?(kindergarten|k|(?:1[0-2]|[1-9])(?:st|nd|rd|th)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(math|science|technology|engineering)$/i,
  )
  if (!match) return baseName.toLocaleLowerCase()

  const grade = match[1].toLowerCase().replace(/(?:st|nd|rd|th)$/, '')
  const normalizedGrade =
    grade === 'kindergarten' || grade === 'k'
      ? 'k'
      : String(
          Number(grade) ||
            Object.entries(gradeNames).find(
              ([, name]) => name.toLowerCase() === grade,
            )?.[0],
        )
  return `${normalizedGrade} ${match[2].toLocaleLowerCase()}`
}

function getClassSection(className: string) {
  return className.match(/(?:[-–]\s*)?Section\s+([A-C])$/i)?.[1]?.toUpperCase()
}

function sortClassesByGrade(classRecords: ClassRecord[]) {
  return [...classRecords].sort(
    (left, right) =>
      (getClassGrade(left.name) ?? Number.MAX_SAFE_INTEGER) -
      (getClassGrade(right.name) ?? Number.MAX_SAFE_INTEGER),
  )
}

function orderClasses(classRecords: ClassRecord[], teacherId: string) {
  const gradeOrder = sortClassesByGrade(classRecords)
  const savedOrder = window.localStorage.getItem(
    `${classOrderStoragePrefix}${teacherId}`,
  )
  if (!savedOrder) return gradeOrder

  try {
    const orderedIds: unknown = JSON.parse(savedOrder)
    if (
      !Array.isArray(orderedIds) ||
      !orderedIds.every((id) => typeof id === 'string')
    ) {
      return gradeOrder
    }
    const orderIndex = new Map<string, number>(
      orderedIds.map((id: string, index: number) => [id, index]),
    )
    return gradeOrder.sort(
      (left, right) =>
        (orderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    )
  } catch {
    return gradeOrder
  }
}

function getFocusedControlAnnouncement(target: HTMLElement) {
  const labelledBy = target
    .getAttribute('aria-labelledby')
    ?.split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
  const labels =
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
      ? Array.from(target.labels ?? [])
          .map((label) => label.textContent?.trim() ?? '')
          .filter(Boolean)
          .join(' ')
      : ''
  const content = target.cloneNode(true) as HTMLElement
  content.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove())
  const name =
    target.getAttribute('aria-label') ||
    labelledBy ||
    labels ||
    content.textContent ||
    target.innerText ||
    ''
  const normalizedName = name.replace(/\s+/g, ' ').trim().slice(0, 140)
  if (!normalizedName) return ''

  const tagName = target.tagName.toLowerCase()
  const type = target instanceof HTMLInputElement ? target.type : ''
  const role =
    target.getAttribute('role') ||
    (tagName === 'a'
      ? 'link'
      : tagName === 'button' ||
          (tagName === 'input' && ['button', 'submit'].includes(type))
        ? 'button'
        : tagName === 'select'
          ? 'list'
          : ['input', 'textarea'].includes(tagName)
            ? type === 'checkbox'
              ? 'checkbox'
              : type === 'radio'
                ? 'radio button'
                : 'text field'
            : tagName === 'summary'
              ? 'disclosure'
              : '')
  const details = [normalizedName, role]

  if (
    (target instanceof HTMLInputElement &&
      ['checkbox', 'radio'].includes(target.type)) ||
    target.getAttribute('role') === 'checkbox'
  ) {
    const checked =
      target instanceof HTMLInputElement
        ? target.checked
        : target.getAttribute('aria-checked') === 'true'
    details.push(checked ? 'checked' : 'not checked')
  }
  if (target instanceof HTMLSelectElement) {
    details.push(target.selectedOptions[0]?.textContent?.trim() ?? '')
  }
  if (target.getAttribute('aria-pressed')) {
    details.push(
      target.getAttribute('aria-pressed') === 'true'
        ? 'pressed'
        : 'not pressed',
    )
  }
  if (target.getAttribute('aria-expanded')) {
    details.push(
      target.getAttribute('aria-expanded') === 'true'
        ? 'expanded'
        : 'collapsed',
    )
  }
  if (target.getAttribute('aria-current') === 'page') {
    details.push('current page')
  }

  return details.filter(Boolean).join(', ')
}

function App() {
  const supabase = useMemo(
    () => (isSupabaseConfigured ? getSupabaseClient() : null),
    [],
  )
  const [user, setUser] = useState<User | null>(null)
  const expectedSignInRole = useRef<UserRole | null>(null)
  const [displayMode, setDisplayMode] = useState<DisplayMode>(getSavedDisplayMode)
  const [readAloudEnabled, setReadAloudEnabled] = useState(
    getSavedReadAloudPreference,
  )
  const [passwordRecovery, setPasswordRecovery] = useState(() =>
    window.location.hash.includes('type=recovery'),
  )
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [teacherGradeBand, setTeacherGradeBand] =
    useState<TeacherGradeBand | null>(null)
  const [showAllClasses, setShowAllClasses] = useState(true)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [classRefresh, setClassRefresh] = useState<{
    classId: string
    classesLoadedKey: number | null
    dashboardLoadedKey: number | null
    dailyLoadedKey: number | null
    requiresDaily: boolean
  } | null>(null)
  const [showClassForm, setShowClassForm] = useState(false)
  const [showClassMessageForm, setShowClassMessageForm] = useState(false)
  const [showClassManagement, setShowClassManagement] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [viewingSubmission, setViewingSubmission] =
    useState<Submission | null>(null)
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [showChallengeType, setShowChallengeType] = useState(false)
  const [teacherView, setTeacherView] = useState<'challenges' | 'progress' | 'daily'>(
    'challenges',
  )
  const [studentDailyView, setStudentDailyView] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(
    null,
  )
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [answerFeedback, setAnswerFeedback] = useState<
    Record<string, AnswerFeedback>
  >({})
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({})
  const [showChallengeFeedback, setShowChallengeFeedback] = useState(false)
  const [selectedFeedbackChallengeId, setSelectedFeedbackChallengeId] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.displayMode = displayMode
    window.localStorage.setItem(displayModeStorageKey, displayMode)
  }, [displayMode])

  useEffect(() => {
    window.localStorage.setItem(
      readAloudStorageKey,
      String(readAloudEnabled),
    )
    if (!('speechSynthesis' in window)) return

    if (!readAloudEnabled) {
      window.speechSynthesis.cancel()
      return
    }

    function speak(text: string) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = document.documentElement.lang || navigator.language
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }

    let lastFocusedTarget: HTMLElement | null = null
    let lastAnnouncement = ''
    let lastHoveredTarget: HTMLElement | null = null
    let hoverTimer = 0

    function announce(target: HTMLElement) {
      const announcement = getFocusedControlAnnouncement(target)
      if (
        !announcement ||
        (target === lastFocusedTarget && announcement === lastAnnouncement)
      ) {
        return
      }
      lastFocusedTarget = target
      lastAnnouncement = announcement
      speak(announcement)
    }

    speak(
      'Read aloud is on. Move through buttons, links, and form controls to hear their names and states.',
    )

    function handleFocus(event: FocusEvent) {
      if (!(event.target instanceof HTMLElement)) return
      announce(event.target)
    }

    function handleChange(event: Event) {
      if (
        !(event.target instanceof HTMLSelectElement) &&
        !(
          event.target instanceof HTMLInputElement &&
          ['checkbox', 'radio'].includes(event.target.type)
        )
      ) {
        return
      }
      announce(event.target)
    }

    function handlePointerOver(event: PointerEvent) {
      if (
        event.pointerType === 'touch' ||
        !(event.target instanceof HTMLElement)
      ) {
        return
      }

      const readable = event.target.closest<HTMLElement>(
        'h1, h2, h3, p, label, li, blockquote, .challenge-prompt, .student-prompt',
      )
      if (
        !readable ||
        readable.closest('.display-mode-control, [aria-hidden="true"]') ||
        readable === lastHoveredTarget
      ) {
        return
      }

      window.clearTimeout(hoverTimer)
      hoverTimer = window.setTimeout(() => {
        const content = readable.cloneNode(true) as HTMLElement
        content.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove())
        const text = (content.innerText || content.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
        if (!text) return
        lastHoveredTarget = readable
        lastFocusedTarget = null
        speak(text.slice(0, 320))
      }, 450)
    }

    function handlePointerOut() {
      window.clearTimeout(hoverTimer)
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.target instanceof HTMLElement &&
          mutation.target === document.activeElement
        ) {
          announce(mutation.target)
        }
      }
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        'aria-current',
        'aria-expanded',
        'aria-label',
        'aria-labelledby',
        'aria-pressed',
      ],
      characterData: true,
      childList: true,
      subtree: true,
    })

    document.addEventListener('focusin', handleFocus)
    document.addEventListener('change', handleChange)
    document.addEventListener('pointerover', handlePointerOver)
    document.addEventListener('pointerout', handlePointerOut)
    return () => {
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('change', handleChange)
      document.removeEventListener('pointerover', handlePointerOver)
      document.removeEventListener('pointerout', handlePointerOut)
      window.clearTimeout(hoverTimer)
      observer.disconnect()
      window.speechSynthesis.cancel()
    }
  }, [readAloudEnabled])

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
      if (event === 'SIGNED_OUT') {
        setPasswordRecovery(false)
        setTeacherGradeBand(null)
        expectedSignInRole.current = null
      }
      setClassRefresh(null)
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
    void (async () => {
      try {
        const request = supabase.from('profiles')
        const { data, error } = await (profilePhotosEnabled
          ? request.select('id, role, display_name, avatar_path')
          : request.select('id, role, display_name'))
          .eq('id', user.id)
          .single()
        if (!active) return
        if (error) {
          setPageError(error.message)
          setProfileLoading(false)
          return
        }
        const nextProfile = data as Profile
        const expectedRole = expectedSignInRole.current
        if (expectedRole && nextProfile.role !== expectedRole) {
          const { error: signOutError } = await supabase.auth.signOut()
          if (signOutError) {
            setPageError(`The account role does not match your selection, and sign-out failed: ${signOutError.message}`)
            setProfileLoading(false)
          } else {
            expectedSignInRole.current = null
            setPageError(`This account is not a ${expectedRole} account. Select the correct role and try again.`)
          }
          return
        }
        expectedSignInRole.current = null
        setProfile(nextProfile)
        setProfileLoading(false)
      } catch (loadError) {
        if (active) {
          setPageError(errorMessage(loadError))
          setProfileLoading(false)
        }
      }
    })()

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
            .select(
              'id, name, join_code, created_at, grade_band, message_type, message_heading, message_content',
            )
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
              .select(
                'id, name, join_code, created_at, grade_band, message_type, message_heading, message_content',
              )
              .in('id', classIds)
              .order('created_at', { ascending: true })
            if (error) throw error
            nextClasses = (data ?? []) as ClassRecord[]
          }
        }

        if (!active) return
        const orderedClasses =
          profile.role === 'teacher'
            ? orderClasses(nextClasses, user.id)
            : nextClasses
        setClasses(orderedClasses)
        const availableClasses =
          profile.role === 'teacher' && teacherGradeBand
            ? orderedClasses.filter(
                (classRecord) =>
                  (classRecord.grade_band ??
                    getClassGradeBand(classRecord.name)) === teacherGradeBand,
              )
            : orderedClasses
        setSelectedClassId((current) =>
          availableClasses.some((classRecord) => classRecord.id === current)
            ? current
            : (availableClasses[0]?.id ?? ''),
        )
        setClassRefresh((current) =>
          current && current.classesLoadedKey !== refreshKey
            ? { ...current, classesLoadedKey: refreshKey }
            : current,
        )
      } catch (error) {
        if (active) {
          setClassRefresh(null)
          setPageError(errorMessage(error))
        }
      }
    })()

    return () => {
      active = false
    }
  }, [supabase, user, profile, refreshKey, teacherGradeBand])

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
            'id, class_id, title, prompt, subject, grade_band, answer_type, choices, is_published, program_day, level, created_at, feedback_enabled, hint_level_1, hint_level_2, hint_level_3',
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
            const request = supabase.from('profiles')
            const { data, error } = await (profilePhotosEnabled
              ? request.select('id, role, display_name, avatar_path')
              : request.select('id, role, display_name'))
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
          setClassRefresh((current) =>
            current?.classId === selectedClassId && current.dashboardLoadedKey !== refreshKey
              ? { ...current, dashboardLoadedKey: refreshKey }
              : current,
          )
        }
      } catch (error) {
        if (active) {
          setClassRefresh(null)
          setPageError(errorMessage(error))
        }
      }
    })()

    return () => {
      active = false
    }
  }, [supabase, user, profile, selectedClassId, refreshKey])

  useEffect(() => () => setClassRefresh(null), [selectedClassId, teacherView, studentDailyView, showAllClasses])

  const handleDailyRefresh = useCallback((key: number, status: 'loading' | 'success' | 'error') => {
    setClassRefresh((current) => {
      if (!current?.requiresDaily) return current
      if (status === 'error') return null
      const dailyLoadedKey = status === 'success' ? key : null
      return current.dailyLoadedKey === dailyLoadedKey ? current : { ...current, dailyLoadedKey }
    })
  }, [])

  useEffect(() => {
    if (!user || !profile) return

    function refreshOnReturn() {
      if (document.visibilityState === 'visible') {
        setRefreshKey((key) => key + 1)
      }
    }

    document.addEventListener('visibilitychange', refreshOnReturn)
    return () => document.removeEventListener('visibilitychange', refreshOnReturn)
  }, [user, profile])

  async function handleSignOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) setPageError(error.message)
  }

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !user) return
    const formData = new FormData(event.currentTarget)
    const grade = String(formData.get('grade') ?? '')
    const subject = String(formData.get('subject') ?? '')
    const section = String(formData.get('section') ?? '')
    const baseName = `${grade === 'Kindergarten' ? grade : `Grade ${getGradeLabel(grade)}`} ${subject}`.trim()
    const name = section ? `${baseName} - Section ${section}` : baseName
    if (!name || !teacherGradeBand) return

    const existingForCourse = classes.filter(
      (classRecord) => getBaseClassName(classRecord.name) === getBaseClassName(baseName),
    )
    if (
      section &&
      existingForCourse.some(
        (classRecord) =>
          getClassSection(classRecord.name) === section.toUpperCase(),
      )
    ) {
      setPageError(
        `Section ${section} already exists for ${baseName}. Choose another section.`,
      )
      return
    }
    if (!section && existingForCourse.length > 0) {
      setPageError(
        `${baseName} already exists. Choose Section A, B, or C to create another class.`,
      )
      return
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({ name, grade_band: teacherGradeBand })
      .select('id')
      .single()
    if (error) {
      setPageError(error.message)
      return
    }
    setShowClassForm(false)
    setSelectedClassId(data.id)
    setShowAllClasses(false)
    setTeacherView('challenges')
    setPageError('')
    setRefreshKey((key) => key + 1)
  }

  async function saveClassMessage(
    messageType: ClassMessageType,
    heading: string,
    content: string,
  ) {
    if (!supabase || !selectedClass) return false
    if (!heading.trim() || !content.trim()) {
      setPageError('Enter both a heading and a message.')
      return false
    }
    const message = {
      message_type: messageType,
      message_heading: heading.trim(),
      message_content: content.trim(),
    }
    try {
      const { error } = await supabase
        .from('classes')
        .update(message)
        .eq('id', selectedClass.id)
        .select('id')
        .single()
      if (error) throw error
    } catch (error) {
      setPageError(errorMessage(error))
      return false
    }
    setClasses((current) =>
      current.map((classRecord) =>
        classRecord.id === selectedClass.id
          ? { ...classRecord, ...message }
          : classRecord,
      ),
    )
    setPageError('')
    setShowClassMessageForm(false)
    return true
  }

  async function clearClassMessage() {
    if (!supabase || !selectedClass) return
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          message_type: null,
          message_heading: null,
          message_content: null,
        })
        .eq('id', selectedClass.id)
        .select('id')
        .single()
      if (error) throw error
    } catch (error) {
      setPageError(errorMessage(error))
      return
    }
    setClasses((current) =>
      current.map((classRecord) =>
        classRecord.id === selectedClass.id
          ? {
              ...classRecord,
              message_type: null,
              message_heading: null,
              message_content: null,
            }
          : classRecord,
      ),
    )
    setPageError('')
    setShowClassMessageForm(false)
  }

  function moveClass(classId: string, direction: -1 | 1) {
    if (!user || profile?.role !== 'teacher') return
    const bandClassIndexes = classes.flatMap((classRecord, index) =>
      (classRecord.grade_band ?? getClassGradeBand(classRecord.name)) ===
      teacherGradeBand
        ? [index]
        : [],
    )
    const bandIndex = bandClassIndexes.findIndex(
      (index) => classes[index].id === classId,
    )
    const nextBandIndex = bandIndex + direction
    if (bandIndex < 0 || nextBandIndex < 0 || nextBandIndex >= bandClassIndexes.length) {
      return
    }
    const currentIndex = bandClassIndexes[bandIndex]
    const nextIndex = bandClassIndexes[nextBandIndex]
    const nextClasses = [...classes]
    ;[nextClasses[currentIndex], nextClasses[nextIndex]] = [
      nextClasses[nextIndex],
      nextClasses[currentIndex],
    ]
    setClasses(nextClasses)
    window.localStorage.setItem(
      `${classOrderStoragePrefix}${user.id}`,
      JSON.stringify(nextClasses.map((classRecord) => classRecord.id)),
    )
  }

  function resetClassOrder(band: TeacherGradeBand) {
    if (!user || profile?.role !== 'teacher') return
    const belongsToBand = (classRecord: ClassRecord) =>
      (classRecord.grade_band ?? getClassGradeBand(classRecord.name)) === band
    const orderedBandClasses = sortClassesByGrade(classes.filter(belongsToBand))
    let index = 0
    const nextClasses = classes.map((classRecord) =>
      belongsToBand(classRecord) ? orderedBandClasses[index++] : classRecord,
    )
    setClasses(nextClasses)
    window.localStorage.setItem(
      `${classOrderStoragePrefix}${user.id}`,
      JSON.stringify(nextClasses.map((classRecord) => classRecord.id)),
    )
  }

  async function joinClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = event.currentTarget
    const formData = new FormData(form)
    const code = String(formData.get('joinCode') ?? '').trim()
    const { data: classId, error } = await supabase.rpc('join_class', { code })
    if (error) {
      setPageError(error.message)
      return
    }
    if (typeof classId !== 'string' || !classId) {
      setPageError('The class was joined, but it could not be opened. Refresh and try again.')
      return
    }
    form.reset()
    setSelectedClassId(classId)
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
            kind: isCorrect ? 'success' : 'retry',
            message: isCorrect
              ? 'Correct! Your curiosity paid off.'
              : getProgressiveHint(challenge, wrongAttempts[challenge.id] ?? 0),
          }
        : {
            kind: 'success',
            message: 'Nice work sharing your thinking. Your teacher will review it.',
          }
    
    // Track wrong attempts for progressive hints
    if (!isCorrect && challenge.answer_type === 'multiple_choice') {
      const newAttempts = (wrongAttempts[challenge.id] ?? 0) + 1
      setWrongAttempts((current) => ({
        ...current,
        [challenge.id]: newAttempts,
      }))
    }
    
    setAnswerFeedback((current) => ({
      ...current,
      [challenge.id]: feedback,
    }))
    setRefreshKey((key) => key + 1)
  }

  function getProgressiveHint(challenge: Challenge, attemptCount: number): string {
    // Show progressive hints based on number of wrong attempts
    if (attemptCount === 0) {
      // First wrong attempt - general encouragement with basic hint
      if (challenge.hint_level_1) {
        return `Good try! Here's a hint: ${challenge.hint_level_1}`
      }
      return 'Good try. Think about the question again and look for clues.'
    } else if (attemptCount === 1) {
      // Second wrong attempt - more specific hint
      if (challenge.hint_level_2) {
        return `Getting closer! Here's another hint: ${challenge.hint_level_2}`
      }
      return 'Keep thinking! Look at all the choices carefully.'
    } else {
      // Third attempt and beyond - nearly gives it away
      if (challenge.hint_level_3) {
        return `One more try! Final hint: ${challenge.hint_level_3}`
      }
      return 'You\'ve got this! Look for the most logical answer.'
    }
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
      .select('id')
      .single()
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

  async function updateProfile(event: FormEvent<HTMLFormElement>, photo: File | null) {
    event.preventDefault()
    if (!supabase || !user || !profile || profileSaving) return
    const formData = new FormData(event.currentTarget)
    const displayName = String(formData.get('displayName') ?? '').trim()
    if (!displayName) {
      setProfileError('Enter a display name.')
      return
    }
    const removePhoto = formData.has('removePhoto')
    if (photo && (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size === 0 || photo.size > 2 * 1024 * 1024)) {
      setProfileError('Choose a JPEG, PNG, or WebP image no larger than 2 MB.')
      return
    }
    if (photo && removePhoto) {
      setProfileError('Choose a new photo or remove the current photo, not both.')
      return
    }

    setProfileSaving(true)
    setProfileError('')
    let uploadedPath: string | null = null
    let saved = false
    try {
      if (photo && profilePhotosEnabled) {
        uploadedPath = `${user.id}/${crypto.randomUUID()}`
        const { error } = await supabase.storage.from(profilePhotoBucket).upload(uploadedPath, photo)
        if (error) throw error
      }
      const avatarPath = uploadedPath ?? (removePhoto ? null : profile.avatar_path ?? null)
      const values = profilePhotosEnabled
        ? { display_name: displayName, avatar_path: avatarPath }
        : { display_name: displayName }
      const { error } = await supabase.from('profiles').update(values).eq('id', user.id).select('id').single()
      if (error) throw error
      saved = true
      setProfile((current) =>
        current?.id === user.id ? { ...current, display_name: displayName, ...(profilePhotosEnabled ? { avatar_path: avatarPath } : {}) } : current,
      )
      if (profile.avatar_path && profile.avatar_path !== avatarPath) {
        const { error: removeError } = await supabase.storage.from(profilePhotoBucket).remove([profile.avatar_path])
        if (removeError) throw new Error(`Profile saved, but the previous photo could not be deleted: ${removeError.message}`)
      }
      setShowProfile(false)
    } catch (error) {
      let detail = errorMessage(error)
      if (uploadedPath && !saved) {
        try {
          const { error: cleanupError } = await supabase.storage.from(profilePhotoBucket).remove([uploadedPath])
          if (cleanupError) throw cleanupError
        } catch (cleanupError) {
          detail += ` The uploaded photo could not be cleaned up: ${errorMessage(cleanupError)}`
        }
      }
      setProfileError(detail)
    } finally {
      setProfileSaving(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="config-screen">
        <div className="config-card">
          <Brand workspace />
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
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        readAloudEnabled={readAloudEnabled}
        onReadAloudChange={setReadAloudEnabled}
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
        onSignInRoleChange={(role) => { expectedSignInRole.current = role }}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        readAloudEnabled={readAloudEnabled}
        onReadAloudChange={setReadAloudEnabled}
      />
    )
  }

  if (!profile) {
    return (
      <main className="loading-screen">
        <Brand workspace />
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
  const teacherBandClasses = teacherGradeBand
    ? classes.filter(
        (classRecord) =>
          (classRecord.grade_band ??
            getClassGradeBand(classRecord.name)) === teacherGradeBand,
      )
    : []
  const showingTeacherClasses = isTeacher && teacherGradeBand && showAllClasses
  const currentDashboard =
    dashboard?.classId === selectedClass?.id ? dashboard : null

  return (
    <div
      className={`app-shell${isTeacher ? ' teacher-workspace teacher-launchpad-shell' : ''}${isTeacher ? (teacherGradeBand ? ' teacher-class-shell' : ' teacher-home-shell') : ''}`}
    >
      <header className="app-header workspace-topbar">
        <div className="workspace-breadcrumb">
          <span>Workspace</span>
          <span aria-hidden="true">/</span>
          <strong>
            {isTeacher
              ? teacherGradeBand
                ? showingTeacherClasses
                  ? `${teacherGradeBand} classes`
                  : selectedClass?.name ?? 'Classes'
                : 'Grade groups'
              : selectedClass?.name ?? 'My classes'}
          </strong>
        </div>
        <details className="account-menu account-menu-dropdown">
          <summary
            aria-label={`Open account menu for ${profile.display_name}`}
            className="account-menu-trigger"
          >
            <ProfileAvatar className="avatar" profile={profile} supabase={supabase!} />
            <span className="account-copy">
              <strong>{profile.display_name}</strong>
              <span>{isTeacher ? 'Teacher' : 'Student'}</span>
            </span>
            <span className="account-menu-chevron" aria-hidden="true">⌄</span>
          </summary>
          <div className="account-menu-panel">
            <div className="account-menu-identity">
              <ProfileAvatar className="avatar account-menu-large-avatar" profile={profile} supabase={supabase!} />
              <span>
                <strong>{profile.display_name}</strong>
                <small>{isTeacher ? 'Teacher account' : 'Student account'}</small>
              </span>
            </div>
            <div className="account-menu-divider" />
            <button
              className="account-menu-action"
              onClick={(event) => {
                event.currentTarget.closest('details')?.removeAttribute('open')
                setProfileError('')
                setShowProfile(true)
              }}
              type="button"
            >
              <span aria-hidden="true">⚙</span>
              Settings &amp; preferences
              <span aria-hidden="true">›</span>
            </button>
            <button
              className="account-menu-action account-menu-signout"
              onClick={(event) => {
                event.currentTarget.closest('details')?.removeAttribute('open')
                void handleSignOut()
              }}
              type="button"
            >
              <span aria-hidden="true">↪</span>
              Sign out
            </button>
          </div>
        </details>
      </header>

      <main className="dashboard workspace-layout">
        <aside className="sidebar workspace-sidebar">
          <Brand workspace />
          <p className="workspace-role">
            {isTeacher ? 'TEACHER WORKSPACE' : 'STUDENT WORKSPACE'}
          </p>
          {(!isTeacher || (teacherGradeBand && !showAllClasses)) ? (
            <nav className="workspace-nav" aria-label="Workspace navigation">
              <button
                aria-current={isTeacher ? teacherView === 'challenges' ? 'page' : undefined : !studentDailyView ? 'page' : undefined}
                className={`workspace-nav-item${(isTeacher ? teacherView === 'challenges' : !studentDailyView) ? ' is-active' : ''}`}
                onClick={() => isTeacher ? setTeacherView('challenges') : setStudentDailyView(false)}
              >
                <span aria-hidden="true">{isTeacher ? '⚗' : '✳'}</span>
                {isTeacher ? `Individual Challenges${selectedClass ? ` - ${selectedClass.name}` : ''}` : 'Get Ready for the Challenge.'}
              </button>
              {isTeacher ? (
              <>
                <button
                  aria-current={teacherView === 'progress' ? 'page' : undefined}
                  className={`workspace-nav-item${teacherView === 'progress' ? ' is-active' : ''}`}
                  onClick={() => setTeacherView('progress')}
                >
                  <span aria-hidden="true">▤</span>
                  {`Class progress${selectedClass ? ` - ${selectedClass.name}` : ''}`}
                </button>
              </>
              ) : null}
              <button
                aria-current={(isTeacher ? teacherView === 'daily' : studentDailyView) ? 'page' : undefined}
                className={`workspace-nav-item${(isTeacher ? teacherView === 'daily' : studentDailyView) ? ' is-active' : ''}`}
                onClick={() => isTeacher ? setTeacherView('daily') : setStudentDailyView(true)}
                type="button"
              >
                <span aria-hidden="true">◷</span>
                {isTeacher ? `Daily programs${selectedClass ? ` - ${selectedClass.name}` : ''}` : 'Daily Streak Program.'}
              </button>
            </nav>
          ) : !teacherGradeBand ? (
            <nav className="workspace-nav teacher-launchpad-nav" aria-label="Teacher navigation">
              <button
                aria-current="page"
                className="workspace-nav-item is-active"
                type="button"
              >
                <span aria-hidden="true">⌂</span>
                Dashboard
              </button>
            </nav>
          ) : null}
          {(!isTeacher || teacherGradeBand) ? <div className="workspace-class-list">
            <p className="sidebar-label">
              {isTeacher
                ? teacherGradeBand
                  ? `${teacherGradeBand} CLASSES`
                  : 'CHOOSE A GRADE BAND'
                : 'YOUR CLASSES'}
            </p>
            {(isTeacher && teacherGradeBand
              ? teacherBandClasses
              : isTeacher
                ? []
                : classes
            ).map((classRecord) => (
              <button
                className={`class-link${selectedClassId === classRecord.id && !showingTeacherClasses ? ' is-active' : ''}`}
                key={classRecord.id}
                onClick={() => {
                  setSelectedClassId(classRecord.id)
                  if (isTeacher) {
                    setShowAllClasses(false)
                    setShowClassMessageForm(false)
                  }
                }}
              >
                <span className="class-dot" aria-hidden="true" />
                <span>{classRecord.name}</span>
              </button>
            ))}
          </div> : null}
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
          {isTeacher ? (
            teacherGradeBand ? (
              <TeacherClassOverview
                band={teacherGradeBand}
                classes={teacherBandClasses}
                selectedClassId={selectedClassId}
                showAllClasses={showAllClasses}
                showCreateForm={showClassForm}
                onSelect={(classId) => {
                  setSelectedClassId(classId)
                  setShowAllClasses(false)
                }}
                onShowAllClasses={() => {
                  resetClassOrder(teacherGradeBand)
                  setShowAllClasses(true)
                  setShowClassMessageForm(false)
                }}
                onCopyCode={copyJoinCode}
                onCreateClass={createClass}
                onToggleCreateForm={() =>
                  setShowClassForm((visible) => !visible)
                }
                onMoveClass={moveClass}
                onChangeBand={() => {
                  setTeacherGradeBand(null)
                  setSelectedClassId('')
                  setShowClassForm(false)
                  setShowClassMessageForm(false)
                }}
              />
            ) : (
              <TeacherBandChooser
                classes={classes}
                profile={profile}
                supabase={supabase!}
                onChoose={(band) => {
                  resetClassOrder(band)
                  setTeacherGradeBand(band)
                  setShowAllClasses(true)
                  setShowClassForm(false)
                  setTeacherView('challenges')
                  const firstClass = classes.find(
                    (classRecord) =>
                      (classRecord.grade_band ??
                        getClassGradeBand(classRecord.name)) === band,
                  )
                  setSelectedClassId(firstClass?.id ?? '')
                }}
              />
            )
          ) : null}
          {isTeacher &&
          teacherGradeBand &&
          !showAllClasses &&
          selectedClass &&
          showClassMessageForm ? (
            <ClassMessageEditor
              key={selectedClass.id}
              classRecord={selectedClass}
              onCancel={() => setShowClassMessageForm(false)}
              onClear={clearClassMessage}
              onSave={saveClassMessage}
            />
          ) : null}
          {selectedClass && (!isTeacher || (teacherGradeBand && !showAllClasses)) ? (
            <>
              <div className="page-heading workspace-page-heading">
                <div>
                  <p className="eyebrow">
                    {isTeacher
                      ? selectedClass.name
                      : 'YOUR CLASS'}
                  </p>
                  {!isTeacher ? (
                    <h1>
                      {teacherView === 'progress'
                        ? 'Class progress'
                        : 'Daily programs'}
                    </h1>
                  ) : null}
                </div>
                <div className="class-heading-actions">
                  {isTeacher ? (
                    <>
                      {teacherView === 'challenges' ? (
                        <button
                          className="button button-primary create-challenge-button"
                          onClick={() => {
                            setEditingChallenge(null)
                            setShowChallengeType(true)
                          }}
                        >
                          <span aria-hidden="true">+</span> Create a challenge
                        </button>
                      ) : null}
                      <button
                        className="button button-secondary manage-class-button"
                        onClick={() => setShowClassManagement(true)}
                      >
                        Manage class
                      </button>
                    </>
                  ) : null}
                  <button
                    className="button button-secondary"
                    disabled={Boolean(
                      classRefresh &&
                        classRefresh.classId === selectedClass.id &&
                        (classRefresh.classesLoadedKey !== refreshKey ||
                          classRefresh.dashboardLoadedKey !== refreshKey ||
                          (classRefresh.requiresDaily && classRefresh.dailyLoadedKey !== refreshKey)),
                    )}
                    onClick={() => {
                      setPageError('')
                      setClassRefresh({
                        classId: selectedClass.id,
                        classesLoadedKey: null,
                        dashboardLoadedKey: null,
                        dailyLoadedKey: null,
                        requiresDaily: isTeacher ? teacherView === 'daily' : studentDailyView,
                      })
                      setRefreshKey((key) => key + 1)
                    }}
                    type="button"
                  >
                    Refresh class
                  </button>
                  {classRefresh?.classId === selectedClass.id ? (
                    <span className="class-refresh-status" role="status">
                      {classRefresh.classesLoadedKey === refreshKey &&
                      classRefresh.dashboardLoadedKey === refreshKey &&
                      (!classRefresh.requiresDaily || classRefresh.dailyLoadedKey === refreshKey)
                        ? 'Class refreshed.'
                        : 'Refreshing class...'}
                    </span>
                  ) : null}
                </div>
              </div>

              {!((isTeacher && teacherView === 'daily') || (!isTeacher && studentDailyView)) ? <section
                className={`class-greeting${isTeacher ? '' : ' class-greeting-student'}`}
                aria-label={isTeacher ? 'Class overview' : 'Your learning journey'}
              >
                <div>
                  <p className="class-greeting-label">
                    {isTeacher
                      ? selectedClass.name.toUpperCase()
                      : `YOUR LEARNING ADVENTURE · ${selectedClass.name.toUpperCase()}`}
                  </p>
                  {selectedClass.message_type ? (
                    <span className="class-greeting-message-type">
                      {selectedClass.message_type}
                    </span>
                  ) : null}
                  <h2>
                    {isTeacher
                      ? selectedClass.message_heading ||
                        'A good day to ask “what if?”'
                      : selectedClass.message_heading ||
                        'Your next big discovery starts here!'}
                  </h2>
                  <p
                    className={
                      selectedClass.message_content
                        ? 'class-greeting-custom-content'
                        : undefined
                    }
                  >
                    {isTeacher
                      ? selectedClass.message_content ||
                        `${currentDashboard?.members.length ?? 0} curious minds · ${currentDashboard?.challenges.filter((challenge) => challenge.is_published).length ?? 0} active challenges · Endless possibilities`
                      : currentDashboard
                        ? selectedClass.message_content ||
                          'Pick a challenge that sparks your curiosity. Every attempt helps you grow.'
                        : 'Getting your next discoveries ready...'}
                  </p>
                  {isTeacher && selectedClass.message_content ? (
                    <p className="class-greeting-stats">
                      {currentDashboard?.members.length ?? 0} curious minds ·{' '}
                      {currentDashboard?.challenges.filter(
                        (challenge) => challenge.is_published,
                      ).length ?? 0}{' '}
                      active challenges
                    </p>
                  ) : null}
                </div>
                {isTeacher ? (
                  <div className="class-greeting-teacher-actions">
                    <button
                      className="button class-message-edit-button"
                      onClick={() => setShowClassMessageForm(true)}
                      type="button"
                    >
                      {selectedClass.message_content
                        ? 'Edit class message'
                        : 'Add class message'}
                    </button>
                    <div className="class-greeting-orbit" aria-hidden="true">
                      <span>◎</span>
                      <i />
                    </div>
                  </div>
                ) : (
                  <div className="student-greeting-count" aria-label={`${currentDashboard?.challenges.filter((challenge) => challenge.is_published).length ?? 0} challenges to explore`}>
                    <span aria-hidden="true">✦</span>
                    <strong>
                      {currentDashboard?.challenges.filter((challenge) => challenge.is_published).length ?? '…'}
                    </strong>
                    <small>challenges<br />to explore</small>
                  </div>
                )}
              </section> : null}

              {(isTeacher ? teacherView === 'daily' : studentDailyView) ? (
                currentDashboard ? <DailyPrograms
                  key={selectedClass.id}
                  supabase={supabase!}
                  classId={selectedClass.id}
                  classRecord={selectedClass}
                  userId={user.id}
                  isTeacher={isTeacher}
                  members={currentDashboard.members}
                  refreshKey={refreshKey}
                  refreshReady={!classRefresh?.requiresDaily || classRefresh.dashboardLoadedKey === refreshKey}
                  onRefreshResult={handleDailyRefresh}
                /> : <LoadingInline />
              ) : isTeacher ? (
                <TeacherDashboard
                  key={selectedClass.id}
                  classRecord={selectedClass}
                  dashboard={currentDashboard}
                  view={teacherView === 'daily' ? 'challenges' : teacherView}
                  onViewChange={setTeacherView}
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
                  key={selectedClass.id}
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
                  setSelectedFeedbackChallengeId={setSelectedFeedbackChallengeId}
                  setShowChallengeFeedback={setShowChallengeFeedback}
                />
              )}
            </>
          ) : isTeacher ? null : <EmptyClasses isTeacher={false} />}
        </section>
      </main>

      {showChallengeType && selectedClass ? (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowChallengeType(false)
        }}>
          <section aria-labelledby="challenge-type-title" aria-modal="true" className="modal-card" role="dialog">
            <header className="modal-header">
              <div><p className="eyebrow">CREATE FOR YOUR CLASS</p><h2 id="challenge-type-title">Choose a challenge type</h2></div>
              <button aria-label="Close dialog" className="icon-button" onClick={() => setShowChallengeType(false)} type="button">×</button>
            </header>
            <div className="challenge-type-options">
              <button className="button button-secondary" type="button" onClick={() => {
                setShowChallengeType(false)
                setTeacherView('daily')
              }}>
                <strong>Daily program</strong>
                <span>Plan questions across scheduled days.</span>
              </button>
              <button className="button button-secondary" type="button" onClick={() => {
                setShowChallengeType(false)
                setShowChallengeForm(true)
              }}>
                <strong>Individual challenge</strong>
                <span>Create 1–30 separate questions for this class.</span>
              </button>
            </div>
            <p className="daily-program-hint">Test assessments are not available yet.</p>
            <footer className="modal-actions"><button className="button button-secondary" onClick={() => setShowChallengeType(false)} type="button">Cancel</button></footer>
          </section>
        </div>
      ) : null}
      {showChallengeForm && selectedClass ? (
        <ChallengeForm
          challenge={editingChallenge}
          classId={selectedClass.id}
          classRecord={selectedClass}
          onCancel={() => {
            setShowChallengeForm(false)
            setRefreshKey((key) => key + 1)
          }}
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
          supabase={supabase!}
          onCancel={() => setShowClassManagement(false)}
          onDeleteClass={deleteClass}
          onRemoveStudent={removeStudent}
          onRenameClass={renameClass}
        />
      ) : null}
      {showChallengeFeedback && selectedClass && dashboard ? (
        <ChallengeFeedback
          challenges={dashboard.challenges.filter((c) => c.is_published)}
          preselectedChallengeId={selectedFeedbackChallengeId}
          supabase={supabase!}
          onCancel={() => {
            setShowChallengeFeedback(false)
            setSelectedFeedbackChallengeId(null)
          }}
        />
      ) : null}
      {showProfile ? (
        <ProfileDialog
          displayMode={displayMode}
          email={user.email ?? ''}
          onDisplayModeChange={setDisplayMode}
          onReadAloudChange={setReadAloudEnabled}
          profile={profile}
          error={profileError}
          saving={profileSaving}
          readAloudEnabled={readAloudEnabled}
          onCancel={() => { if (!profileSaving) setShowProfile(false) }}
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
                    {challenge.program_day ? (
                      <span className="daily-tag">
                        Day {challenge.program_day} · {challenge.level}
                      </span>
                    ) : null}
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
          (query.trim() ? (
            <div className="empty-state compact-empty">
              <h2>No matching challenges</h2>
              <p>Try a different search or choose another challenge filter.</p>
            </div>
          ) : challengeFilter === 'drafts' && draftChallenges.length === 0 ? (
            <div className="empty-state compact-empty">
              <h2>No drafts yet</h2>
              <p>Use Create a challenge above and save it as a draft to finish later.</p>
            </div>
          ) : challengeFilter === 'completed' && completedChallenges.length === 0 ? (
            <div className="empty-state compact-empty">
              <h2>No completed challenges yet</h2>
              <p>
                A challenge appears here after every student in the class has
                submitted an answer.
              </p>
            </div>
          ) : activeChallenges.length === 0 && !query ? (
            <EmptyChallenges />
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
  setSelectedFeedbackChallengeId,
  setShowChallengeFeedback,
}: {
  dashboard: DashboardData | null
  answerDrafts: Record<string, string>
  answerFeedback: Record<string, AnswerFeedback>
  onAnswerChange: (challengeId: string, answer: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>, challenge: Challenge) => void
  setSelectedFeedbackChallengeId: (id: string | null) => void
  setShowChallengeFeedback: (show: boolean) => void
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
      <div className="empty-state student-empty-state">
        <span className="empty-illustration" aria-hidden="true">
          ✳
        </span>
        <h2>No challenges yet</h2>
        <p>Your teacher has not published any challenges for this class yet.</p>
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
      <DailyJourney challenges={challenges} submissions={submissions} />
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
                aria-label={`${tab === 'all' ? 'All challenges' : tab === 'todo' ? 'Ready to explore' : 'Answers shared'}: ${count}`}
                aria-selected={filter === tab}
                className={filter === tab ? 'is-selected' : ''}
                key={tab}
                onClick={() => setFilter(tab)}
                role="tab"
              >
                {tab === 'all'
                  ? 'All challenges'
                  : tab === 'todo'
                    ? 'Ready to explore'
                    : 'Answers shared'} (
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
              <span className={`challenge-journey-status${submission ? ' is-shared' : ''}`}>
                <span aria-hidden="true">{submission ? '✓' : '✦'}</span>
                {submission ? 'Answer shared' : 'Ready when you are'}
              </span>
            </div>
            <h2>{challenge.title}</h2>
            <p className="student-prompt">{challenge.prompt}</p>
            <div className="challenge-meta">
              <span>{challenge.subject}</span>
              <span>{challenge.grade_band}</span>
              {challenge.program_day ? (
                <span className="daily-tag">
                  Day {challenge.program_day} · {challenge.level}
                </span>
              ) : null}
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
                      Thanks for sharing your thinking. Your teacher will review it.
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
                            ? 'Good try! Revisit the clues, then try another answer.'
                            : 'Your teacher reviewed this answer.'}
                      </strong>
                      <span>
                        {submission.is_correct
                          ? 'Great work! Keep up your curiosity.'
                          : challenge.answer_type === 'multiple_choice'
                            ? 'You are learning with every attempt. Use what you noticed and try again.'
                            : 'Your teacher has feedback to help your thinking grow.'}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </form>
            {challenge.feedback_enabled ? (
              <div className="challenge-feedback-action">
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setSelectedFeedbackChallengeId(challenge.id)
                    setShowChallengeFeedback(true)
                  }}
                  type="button"
                >
                  <span aria-hidden="true">💬</span> Send feedback
                </button>
              </div>
            ) : null}
          </article>
        )
      })}
        </div>
        <aside className="student-discoveries">
          <div className="discoveries-heading">
            <span aria-hidden="true">✦</span>
            <h2>Your journey so far</h2>
          </div>
          <p>Progress is made one curious question at a time.</p>
          <div
            aria-label={`${submittedCount} of ${challenges.length} challenges explored`}
            aria-valuemax={challenges.length}
            aria-valuemin={0}
            aria-valuenow={submittedCount}
            className="discovery-progress"
            role="progressbar"
          >
            <span
              style={{
                width: `${challenges.length ? (submittedCount / challenges.length) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="discovery-progress-label">
            {submittedCount} of {challenges.length} challenges explored
          </p>
          <div className="discovery-stat">
            <span>Answers shared</span>
            <strong>
              {submittedCount}
              <small> / {challenges.length}</small>
            </strong>
          </div>
          {pendingReviewCount ? (
            <div className="discovery-stat">
              <span>With your teacher</span>
              <strong>{pendingReviewCount}</strong>
            </div>
          ) : null}
          <div className="discovery-note">
            <span aria-hidden="true">✧</span>
            <p>
              {submittedCount === challenges.length
                ? 'Every answer is a step forward. You can revisit any challenge or celebrate what you have learned!'
                : pendingReviewCount
                  ? 'Your teacher is looking at your thinking. Take your time and explore another challenge whenever you are ready.'
                  : 'There is no rush. Pick one challenge and give it your best thinking.'}
            </p>
          </div>
        </aside>
        </div>
      ) : (
        <div className="empty-state compact-empty">
          <h2>
            {query.trim()
              ? 'No matching challenges'
              : filter === 'todo'
                ? 'All caught up!'
                : 'No submitted answers yet'}
          </h2>
          <p>
            {query.trim()
              ? 'Try a different search or choose another filter.'
              : filter === 'todo'
              ? 'You have submitted an answer for every challenge in this class.'
              : 'Challenges you have answered will appear here.'}
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
  const studentsNeedingHelpIds = new Set(
    submissions
      .filter((submission) => submission.is_correct === false)
      .map((submission) => submission.student_id),
  )
  const studentsNeedingHelpNames = members
    .filter((member) => studentsNeedingHelpIds.has(member.id))
    .map((member) => member.display_name)
    .sort()

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
          value={studentsNeedingHelpNames.length > 0 ? studentsNeedingHelpNames.join(', ') : 'None'}
          isTextValue={true}
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
  isTextValue,
}: {
  label: string
  value: string
  detail?: string
  isTextValue?: boolean
}) {
  return (
    <article className={`summary-card${isTextValue ? ' summary-card-text' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  )
}

function ClassManagement({
  classRecord,
  members,
  supabase,
  onCancel,
  onDeleteClass,
  onRemoveStudent,
  onRenameClass,
}: {
  classRecord: ClassRecord
  members: Profile[]
  supabase: SupabaseClient
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
                  <ProfileAvatar className="member-avatar" profile={member} supabase={supabase} />
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

function ChallengeFeedback({
  challenges,
  preselectedChallengeId,
  supabase,
  onCancel,
}: {
  challenges: Challenge[]
  preselectedChallengeId?: string | null
  supabase: SupabaseClient
  onCancel: () => void
}) {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(preselectedChallengeId ?? null)
  const [feedbackText, setFeedbackText] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [clarity, setClarity] = useState<'clear' | 'somewhat' | 'confusing'>('clear')
  const [enjoyment, setEnjoyment] = useState<'loved' | 'liked' | 'okay' | 'struggled'>('liked')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      // Save feedback to Supabase
      const { error: submitError } = await supabase
        .from('challenge_feedback')
        .upsert({
          challenge_id: selectedChallengeId,
          difficulty,
          clarity,
          enjoyment,
          comment: feedbackText || null,
        })

      if (submitError) throw submitError

      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setSelectedChallengeId(null)
        setFeedbackText('')
        setDifficulty('medium')
        setClarity('clear')
        setEnjoyment('liked')
        onCancel()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel()
    }}>
      <section
        aria-labelledby="feedback-title"
        aria-modal="true"
        className="modal-card feedback-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">HELP US IMPROVE</p>
            <h2 id="feedback-title">Challenge feedback</h2>
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
        <form className="feedback-content" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          {!selectedChallenge ? (
            <div>
              <label className="field-label">
                <span>Which challenge would you like to give feedback on?</span>
                <select
                  onChange={(event) => setSelectedChallengeId(event.target.value || null)}
                  value={selectedChallengeId || ''}
                  required
                >
                  <option value="">Choose a challenge...</option>
                  {challenges.map((challenge) => (
                    <option key={challenge.id} value={challenge.id}>
                      {challenge.title || challenge.prompt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="feedback-challenge-details">
              <div className="feedback-challenge-header">
                <div>
                  <h3>{selectedChallenge.title || selectedChallenge.prompt}</h3>
                  <p className="feedback-hint">Your honest feedback helps us create better learning experiences</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setSelectedChallengeId(null)}
                  type="button"
                >
                  ← Change challenge
                </button>
              </div>

              <div className="feedback-question">
                <label>
                  <span className="feedback-label">How difficult was this challenge?</span>
                  <div className="feedback-options">
                    <label className="feedback-option">
                      <input
                        type="radio"
                        name="difficulty"
                        value="easy"
                        checked={difficulty === 'easy'}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                      />
                      <span>🟢 Too easy</span>
                    </label>
                    <label className="feedback-option">
                      <input
                        type="radio"
                        name="difficulty"
                        value="medium"
                        checked={difficulty === 'medium'}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                      />
                      <span>🟡 Just right</span>
                    </label>
                    <label className="feedback-option">
                      <input
                        type="radio"
                        name="difficulty"
                        value="hard"
                        checked={difficulty === 'hard'}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                      />
                      <span>🔴 Too hard</span>
                    </label>
                  </div>
                </label>
              </div>

              <div className="feedback-question">
                <label>
                  <span className="feedback-label">Was the challenge clear and easy to understand?</span>
                  <div className="feedback-options">
                    <label className="feedback-option">
                      <input
                        type="radio"
                        name="clarity"
                        value="clear"
                        checked={clarity === 'clear'}
                        onChange={(e) => setClarity(e.target.value as any)}
                      />
                      <span>✓ Very clear</span>
                    </label>
                    <label className="feedback-option">
                      <input
                        type="radio"
                        name="clarity"
                        value="somewhat"
                        checked={clarity === 'somewhat'}
                        onChange={(e) => setClarity(e.target.value as any)}
                      />
                      <span>◐ Somewhat clear</span>
                    </label>
                    <label className="feedback-option">
                      <input
                        type="radio"
                        name="clarity"
                        value="confusing"
                        checked={clarity === 'confusing'}
                        onChange={(e) => setClarity(e.target.value as any)}
                      />
                      <span>✗ Confusing</span>
                    </label>
                  </div>
                </label>
              </div>

              <div className="feedback-question">
                <label>
                  <span className="feedback-label">Did you enjoy this challenge?</span>
                  <div className="feedback-options">
                    <label className="feedback-option">
                      <input
                        type="radio"
                        name="enjoyment"
                        value="loved"
                        checked={enjoyment === 'loved'}
                        onChange={(e) => setEnjoyment(e.target.value as any)}
                      />
                      <span>❤️ Loved it!</span>
                    </label>
                    <label className="feedback-option">
                      <input
                        type="radio"
                        name="enjoyment"
                        value="liked"
                        checked={enjoyment === 'liked'}
                        onChange={(e) => setEnjoyment(e.target.value as any)}
                      />
                      <span>👍 Liked it</span>
                    </label>
                    <label className="feedback-option">
                      <input
                        type="radio"
                        name="enjoyment"
                        value="okay"
                        checked={enjoyment === 'okay'}
                        onChange={(e) => setEnjoyment(e.target.value as any)}
                      />
                      <span>😐 It was okay</span>
                    </label>
                    <label className="feedback-option">
                      <input
                        type="radio"
                        name="enjoyment"
                        value="struggled"
                        checked={enjoyment === 'struggled'}
                        onChange={(e) => setEnjoyment(e.target.value as any)}
                      />
                      <span>😕 I struggled</span>
                    </label>
                  </div>
                </label>
              </div>

              <div className="feedback-question">
                <label className="field-label">
                  <span>Anything else you'd like to share? (optional)</span>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Your feedback helps us improve..."
                    rows={4}
                    maxLength={500}
                  />
                  <small>{feedbackText.length}/500</small>
                </label>
              </div>

              {submitted && (
                <div className="feedback-success">
                  <span>✓ Thank you! Your feedback has been recorded.</span>
                </div>
              )}

              <div className="feedback-actions">
                <button type="submit" className="button button-primary" disabled={submitted}>
                  {submitted ? 'Feedback sent!' : 'Send feedback'}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}

function ProfileDialog({
  displayMode,
  email,
  onDisplayModeChange,
  onReadAloudChange,
  profile,
  error,
  saving,
  readAloudEnabled,
  onCancel,
  onSave,
}: {
  displayMode: DisplayMode
  email: string
  onDisplayModeChange: (mode: DisplayMode) => void
  onReadAloudChange: (enabled: boolean) => void
  profile: Profile
  error: string
  saving: boolean
  readAloudEnabled: boolean
  onCancel: () => void
  onSave: (event: FormEvent<HTMLFormElement>, photo: File | null) => void
}) {
  const [photo, setPhoto] = useState<File | null>(null)
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
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h2 id="profile-title">Settings &amp; preferences</h2>
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
        <section
          aria-labelledby="accessibility-preferences-title"
          className="settings-preferences"
        >
          <div>
            <p className="eyebrow">ACCESSIBILITY</p>
            <h3 id="accessibility-preferences-title">Learning preferences</h3>
            <p>Choose how the workspace looks and whether it reads content aloud.</p>
          </div>
          <DisplayModeControl
            value={displayMode}
            onChange={onDisplayModeChange}
            readAloudEnabled={readAloudEnabled}
            onReadAloudChange={onReadAloudChange}
          />
        </section>
        <div className="settings-profile-heading">
          <p className="eyebrow">ACCOUNT</p>
          <h3>Profile details</h3>
        </div>
        <form className="challenge-form" onSubmit={(event) => onSave(event, photo)}>
          {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
          {profilePhotosEnabled ? (
            <>
              <label className="field-label">
                Profile photo
                <input accept="image/jpeg,image/png,image/webp" disabled={saving} name="photo" type="file" onChange={(event) => setPhoto(event.currentTarget.files?.[0] ?? null)} />
                <span className="field-hint">JPEG, PNG, or WebP; maximum 2 MB. Class members can view your photo. Use fictional images only.</span>
              </label>
              {profile.avatar_path ? <label className="profile-photo-remove"><input disabled={saving} name="removePhoto" type="checkbox" /> Remove current photo</label> : null}
            </>
          ) : <p className="field-hint">Profile photos are not enabled. Ask an administrator to complete the storage setup.</p>}
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
              disabled={saving}
              type="button"
            >
              Cancel
            </button>
            <button className="button button-primary" disabled={saving} type="submit">
              {saving ? 'Saving...' : 'Save profile'}
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

function TeacherBandChooser({
  classes,
  profile,
  supabase,
  onChoose,
}: {
  classes: ClassRecord[]
  profile: Profile
  supabase: SupabaseClient
  onChoose: (band: TeacherGradeBand) => void
}) {
  const displayName = profile.display_name.trim() || 'Teacher'
  const classCounts = teacherGradeBands.map((band) => ({
    ...band,
    classCount: classes.filter(
      (classRecord) =>
        (classRecord.grade_band ?? getClassGradeBand(classRecord.name)) ===
        band.id,
    ).length,
  }))
  return (
    <section
      aria-labelledby="teacher-band-title"
      className="teacher-band-chooser teacher-band-chooser-warm"
    >
      <div className="teacher-launchpad-layout">
        <div className="teacher-launchpad-main">
          <section className="teacher-mission-launch">
            <p className="teacher-mission-kicker">TEACHER DASHBOARD</p>
            <h1 id="teacher-band-title">Choose a grade group</h1>
            <p>Choose a group to find or create a class, then add challenges and share its join code.</p>
          </section>
          <section
            aria-labelledby="teacher-groups-title"
            className="teacher-band-groups"
          >
            <header>
              <div>
                <p className="eyebrow">YOUR CLASSROOMS</p>
                <h2 id="teacher-groups-title">Grade groups</h2>
              </div>
            </header>
            <div className="teacher-band-grid">
              {classCounts.map((band) => (
                  <button
                    className={`teacher-band-card teacher-band-card-${band.id
                      .toLowerCase()
                      .replace('-', '')}`}
                    key={band.id}
                    onClick={() => onChoose(band.id)}
                    type="button"
                  >
                    <span className="teacher-band-card-top">
                      <span className="teacher-band-art" aria-hidden="true">
                        {band.id === 'K-5'
                          ? '⚛'
                          : band.id === '6-8'
                            ? '⚗'
                            : '⚙'}
                      </span>
                    </span>
                    <strong className="teacher-band-title">
                      <span className="teacher-band-range-label">{band.id}</span>
                      <span className="teacher-band-name">
                        {band.id === 'K-5'
                          ? 'Explorers'
                          : band.id === '6-8'
                            ? 'Builders'
                            : 'Innovators'}
                      </span>
                    </strong>
                    <span className="teacher-band-count">
                      <strong>{band.classCount}</strong>
                      {band.classCount === 1 ? 'class' : 'classes'}
                    </span>
                    <span className="teacher-band-view-link">
                      View classes <span aria-hidden="true">→</span>
                    </span>
                  </button>
              ))}
            </div>
          </section>
        </div>
        <aside className="teacher-mission-rail" aria-label="Teacher dashboard summary">
          <section className="teacher-mission-profile">
            <ProfileAvatar className="teacher-mission-avatar" profile={profile} supabase={supabase} />
            <div>
              <p>Welcome back,</p>
              <h2>{displayName}</h2>
              <span>Teacher workspace</span>
            </div>
          </section>
          <section className="teacher-mission-summary">
            <span aria-hidden="true">✦</span>
            <div>
              <strong>{classes.length} {classes.length === 1 ? 'class' : 'classes'}</strong>
              <p>Ready for discovery</p>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}

function TeacherClassOverview({
  band,
  classes,
  selectedClassId,
  showAllClasses,
  showCreateForm,
  onSelect,
  onShowAllClasses,
  onCopyCode,
  onCreateClass,
  onToggleCreateForm,
  onMoveClass,
  onChangeBand,
}: {
  band: TeacherGradeBand
  classes: ClassRecord[]
  selectedClassId: string
  showAllClasses: boolean
  showCreateForm: boolean
  onSelect: (classId: string) => void
  onShowAllClasses: () => void
  onCopyCode: (joinCode: string) => void
  onCreateClass: (event: FormEvent<HTMLFormElement>) => void
  onToggleCreateForm: () => void
  onMoveClass: (classId: string, direction: -1 | 1) => void
  onChangeBand: () => void
}) {
  const [selectedGrade, setSelectedGrade] = useState(
    band === 'K-5' ? 'Kindergarten' : band === '6-8' ? '6' : '9',
  )
  const [selectedSubject, setSelectedSubject] = useState('Science')
  const [sectionPrompt, setSectionPrompt] = useState(false)
  const [sectionChoice, setSectionChoice] = useState('A')
  const selectedClass = classes.find(
    (classRecord) => classRecord.id === selectedClassId,
  )
  const visibleClasses =
    showAllClasses || !selectedClass ? classes : [selectedClass]
  const grades =
    teacherGradeBands.find((item) => item.id === band)?.grades ?? []
  const previewName = `${
    selectedGrade === 'Kindergarten'
      ? selectedGrade
      : `Grade ${getGradeLabel(selectedGrade)}`
  } ${selectedSubject}`
  const existingForCourse = classes.filter(
    (classRecord) =>
      getBaseClassName(classRecord.name) === getBaseClassName(previewName),
  )
  const occupiedSections = new Set(
    existingForCourse
      .map((classRecord) => getClassSection(classRecord.name))
      .filter((section): section is string => Boolean(section)),
  )
  const availableSections = ['A', 'B', 'C'].filter(
    (section) => !occupiedSections.has(section),
  )
  const selectedSection = availableSections.includes(sectionChoice)
    ? sectionChoice
    : (availableSections[0] ?? '')

  function handleCreateClass(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget)
    const section = String(formData.get('section') ?? '')
    if (existingForCourse.length > 0 && !sectionPrompt) {
      event.preventDefault()
      setSectionPrompt(true)
      setSectionChoice(availableSections[0] ?? '')
      return
    }
    if (existingForCourse.length > 0 && !section) {
      event.preventDefault()
      return
    }
    setSectionPrompt(false)
    onCreateClass(event)
  }

  return (
    <section
      aria-labelledby="teacher-classes-title"
      className={`teacher-class-overview teacher-class-overview-${band
        .toLowerCase()
        .replace('-', '')}`}
    >
      <header className="teacher-class-overview-heading">
        <div>
          <p className="eyebrow">YOUR CLASSROOMS</p>
          {selectedClass && !showAllClasses ? (
            <h2 id="teacher-classes-title">Current class</h2>
          ) : (
            <h1 id="teacher-classes-title">{band} classes</h1>
          )}
          <p>
            {selectedClass && !showAllClasses
              ? 'Your open class and its student join code.'
              : classes.length
                ? 'Select a class to manage its challenges and share its join code.'
                : 'Create a class to get started.'}
          </p>
        </div>
        <div className="teacher-class-overview-actions">
          <button
            className="button button-secondary teacher-all-classes-button"
            onClick={onChangeBand}
            type="button"
          >
            Change grade group
          </button>
          {classes.length > 1 && !showAllClasses ? (
            <button
              className="button button-secondary teacher-all-classes-button"
              onClick={onShowAllClasses}
              type="button"
            >
              All classes
            </button>
          ) : null}
          <button
            className="button button-primary teacher-create-class-button"
            onClick={onToggleCreateForm}
            type="button"
          >
            <span aria-hidden="true">{showCreateForm ? '×' : '+'}</span>
            {showCreateForm ? 'Cancel' : 'Create a class'}
          </button>
        </div>
      </header>
      {showCreateForm ? (
        <form className="teacher-create-class-form" onSubmit={handleCreateClass}>
          <label htmlFor="classGrade">
            Grade
            <select
              autoFocus
              id="classGrade"
              name="grade"
              onChange={(event) => {
                setSelectedGrade(event.target.value)
                setSectionPrompt(false)
              }}
              value={selectedGrade}
            >
              {grades.map((grade) => {
                return (
                  <option key={grade} value={grade}>
                    {grade === 'Kindergarten'
                      ? grade
                      : `Grade ${getGradeLabel(grade)}`}
                  </option>
                )
              })}
            </select>
          </label>
          <label htmlFor="classSubject">
            Subject
            <select
              id="classSubject"
              name="subject"
              onChange={(event) => {
                setSelectedSubject(event.target.value)
                setSectionPrompt(false)
              }}
              value={selectedSubject}
            >
              <option>Science</option>
              <option>Technology</option>
              <option>Engineering</option>
              <option>Math</option>
            </select>
          </label>
          <p className="teacher-create-class-preview">
            Class name preview <strong>{previewName}</strong>
          </p>
          {sectionPrompt ? (
            <div
              className="teacher-section-prompt"
              role="group"
              aria-labelledby="teacher-section-title"
            >
              <div>
                <strong id="teacher-section-title">
                  You already created {previewName}.
                </strong>
                <p>
                  Create another class with a separate join code. Choose an
                  available section.
                </p>
              </div>
              {availableSections.length ? (
                <>
                  <label htmlFor="classSection">
                    Section
                    <select
                      autoFocus
                      id="classSection"
                      name="section"
                      onChange={(event) => setSectionChoice(event.target.value)}
                      required
                      value={selectedSection}
                    >
                      {availableSections.map((section) => (
                        <option key={section} value={section}>
                          Section {section}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className="teacher-section-name">
                    Class name:{' '}
                    <strong>
                      {previewName} - Section {selectedSection}
                    </strong>
                  </span>
                  <button className="button button-primary" type="submit">
                    Create Section {selectedSection}
                  </button>
                </>
              ) : (
                <p className="teacher-section-full">
                  Sections A, B, and C already exist for this class.
                </p>
              )}
            </div>
          ) : (
            <button className="button button-primary" type="submit">
              Create class
            </button>
          )}
        </form>
      ) : null}
      {classes.length ? (
        <div className="teacher-class-grid">
          {visibleClasses.map((classRecord) => {
            const selected = !showAllClasses && classRecord.id === selectedClassId
            const index = classes.findIndex(
              (item) => item.id === classRecord.id,
            )
            return (
              <article
                className={`teacher-class-card${selected ? ' is-selected' : ''}`}
                key={classRecord.id}
              >
                <button
                  aria-pressed={selected}
                  className="teacher-class-select"
                  onClick={() => onSelect(classRecord.id)}
                  type="button"
                >
                  <span className="teacher-class-card-label">
                    {selected ? 'CURRENT CLASS' : 'OPEN CLASS'}
                  </span>
                  <strong>{classRecord.name}</strong>
                  <span>
                    View challenges and progress
                  </span>
                </button>
                <div className="teacher-class-code">
                  <div>
                    <span>CLASS JOIN CODE</span>
                    <strong>{classRecord.join_code}</strong>
                  </div>
                  <button
                    aria-label={`Copy join code for ${classRecord.name}`}
                    className="teacher-copy-code"
                    onClick={() => onCopyCode(classRecord.join_code)}
                    type="button"
                  >
                    Copy
                  </button>
                </div>
                <div className="teacher-class-card-footer">
                  <span>Share this code with students</span>
                  <div className="teacher-class-order">
                    <button
                      aria-label={`Move ${classRecord.name} up`}
                      disabled={index === 0}
                      onClick={() => onMoveClass(classRecord.id, -1)}
                      title="Move class up"
                      type="button"
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`Move ${classRecord.name} down`}
                      disabled={index === classes.length - 1}
                      onClick={() => onMoveClass(classRecord.id, 1)}
                      title="Move class down"
                      type="button"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="teacher-class-empty">
          <span aria-hidden="true">✳</span>
          <div>
            <strong>Your class list is ready to grow.</strong>
            <p>Create your first class to get a shareable student join code.</p>
          </div>
        </div>
      )}
    </section>
  )
}

function EmptyClasses({ isTeacher }: { isTeacher: boolean }) {
  return (
    <div className="empty-state empty-classes">
      <span className="empty-illustration" aria-hidden="true">
        ✳
      </span>
      <h2>{isTeacher ? 'Start with your first class' : 'Join your first class'}</h2>
      <p>
        {isTeacher
          ? 'Use Create a class above to set up a classroom and get a student join code.'
          : 'Enter a class join code to see the challenges your teacher has made.'}
      </p>
    </div>
  )
}

function ClassMessageEditor({
  classRecord,
  onCancel,
  onClear,
  onSave,
}: {
  classRecord: ClassRecord
  onCancel: () => void
  onClear: () => Promise<void>
  onSave: (
    messageType: ClassMessageType,
    heading: string,
    content: string,
  ) => Promise<boolean>
}) {
  const [messageType, setMessageType] = useState<ClassMessageType>(
    classRecord.message_type ?? 'Announcement',
  )
  const [heading, setHeading] = useState(classRecord.message_heading ?? '')
  const [content, setContent] = useState(classRecord.message_content ?? '')
  const [saving, setSaving] = useState(false)

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSave(messageType, heading, content)
    } finally {
      setSaving(false)
    }
  }

  async function removeMessage() {
    setSaving(true)
    try {
      await onClear()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      aria-labelledby="class-message-editor-title"
      className="class-message-editor"
      onSubmit={(event) => void submitMessage(event)}
    >
      <div>
        <p className="eyebrow">MESSAGE FOR {classRecord.name.toUpperCase()}</p>
        <h2 id="class-message-editor-title">
          {classRecord.message_content
            ? 'Edit class message'
            : 'Add a class message'}
        </h2>
        <p>Students in this class will see your message at the top of their page.</p>
      </div>
      <label>
        Message type
        <select
          onChange={(event) => {
            const value = event.target.value
            if (isClassMessageType(value)) setMessageType(value)
          }}
          value={messageType}
        >
          {classMessageTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </label>
      <label>
        Heading
        <input
          maxLength={100}
          onChange={(event) => setHeading(event.target.value)}
          placeholder="e.g. Welcome to our class!"
          required
          value={heading}
        />
      </label>
      <label>
        Message
        <textarea
          maxLength={2000}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write an announcement, class description, or guidelines..."
          required
          rows={4}
          value={content}
        />
      </label>
      <div className="class-message-editor-actions">
        {classRecord.message_content ? (
          <button
            className="button button-secondary"
            disabled={saving}
            onClick={() => void removeMessage()}
            type="button"
          >
            Remove message
          </button>
        ) : null}
        <button
          className="button button-secondary"
          disabled={saving}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="button button-primary"
          disabled={saving}
          type="submit"
        >
          {saving ? 'Saving...' : 'Save for students'}
        </button>
      </div>
    </form>
  )
}

function EmptyChallenges() {
  return (
    <div className="empty-state">
      <span className="empty-illustration" aria-hidden="true">
        ✳
      </span>
      <h2>Your next great question starts here</h2>
      <p>Use Create a challenge above to get your students thinking.</p>
    </div>
  )
}

function SubjectMark({ subject }: { subject: Challenge['subject'] }) {
  const icon = {
    Science: '🔬',
    Technology: '💻',
    Engineering: '🔧',
    Math: '🧮',
  }[subject]
  return (
    <span className={`subject-mark subject-${subject.toLowerCase()}`} aria-label={subject}>
      {icon}
    </span>
  )
}

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <Brand workspace />
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
  if (error instanceof Error) return error.message
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }
  return 'An unexpected error occurred.'
}

export default App
