import type { Challenge, DailyLevel, Submission } from './types'

export const dailyLevels: DailyLevel[] = ['Easy', 'Medium', 'Hard']

export const levelBadges: Record<
  DailyLevel,
  { avatar: string; title: string }
> = {
  Easy: { avatar: '🌱', title: 'Sprout Explorer' },
  Medium: { avatar: '🚀', title: 'Rocket Builder' },
  Hard: { avatar: '🏆', title: 'Master Inventor' },
}

export const streakBadges = [
  { days: 3, avatar: '🔥', title: 'Spark' },
  { days: 7, avatar: '⚡', title: 'Lightning Week' },
  { days: 14, avatar: '🦊', title: 'Clever Fox' },
  { days: 30, avatar: '🐉', title: 'Dragon Streak' },
  { days: 100, avatar: '👑', title: 'Century Champion' },
]

export interface LevelProgress {
  level: DailyLevel
  total: number
  done: number
  complete: boolean
  nextDay: number | null
}

const dayMs = 24 * 60 * 60 * 1000

function dayNumber(isoDate: string): number {
  const date = new Date(isoDate)
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) / dayMs,
  )
}

export function getDailyJourney(
  challenges: Challenge[],
  submissions: Submission[],
  now = new Date(),
) {
  const daily = challenges.filter(
    (challenge) => challenge.program_day !== null && challenge.level !== null,
  )
  const submittedIds = new Set(
    submissions.map((submission) => submission.challenge_id),
  )

  const levels: LevelProgress[] = dailyLevels.map((level) => {
    const inLevel = daily
      .filter((challenge) => challenge.level === level)
      .sort((a, b) => a.program_day! - b.program_day!)
    const done = inLevel.filter((challenge) => submittedIds.has(challenge.id))
    return {
      level,
      total: inLevel.length,
      done: done.length,
      complete: inLevel.length > 0 && done.length === inLevel.length,
      nextDay:
        inLevel.find((challenge) => !submittedIds.has(challenge.id))
          ?.program_day ?? null,
    }
  })

  const dailyIds = new Set(daily.map((challenge) => challenge.id))
  const days = [
    ...new Set(
      submissions
        .filter((submission) => dailyIds.has(submission.challenge_id))
        .map((submission) => dayNumber(submission.submitted_at)),
    ),
  ].sort((a, b) => a - b)

  let longest = 0
  let run = 0
  days.forEach((day, index) => {
    run = index > 0 && day === days[index - 1] + 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  })

  // A streak stays alive until the end of the day after the last submission.
  const today = dayNumber(now.toISOString())
  const last = days[days.length - 1]
  let current = 0
  if (last !== undefined && today - last <= 1) {
    current = 1
    for (let i = days.length - 1; i > 0 && days[i] - days[i - 1] === 1; i--) {
      current++
    }
  }

  return { hasDaily: daily.length > 0, levels, longest, current }
}
