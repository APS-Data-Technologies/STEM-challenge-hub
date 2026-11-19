import type { Challenge, Submission } from '../lib/types'
import { getDailyJourney, levelBadges, streakBadges } from '../lib/daily'

export function DailyJourney({
  challenges,
  submissions,
}: {
  challenges: Challenge[]
  submissions: Submission[]
}) {
  const journey = getDailyJourney(challenges, submissions)
  if (!journey.hasDaily) return null

  return (
    <section className="daily-journey" aria-labelledby="daily-journey-title">
      <header className="daily-journey-head">
        <div>
          <p className="eyebrow">DAILY CHALLENGE</p>
          <h2 id="daily-journey-title">Your daily journey</h2>
        </div>
        <div className="daily-streak" aria-label={`Current streak ${journey.current} days`}>
          <span aria-hidden="true">🔥</span>
          <strong>{journey.current}</strong>
          <small>day streak</small>
        </div>
      </header>
      <div className="daily-levels">
        {journey.levels.map((item) => {
          const badge = levelBadges[item.level]
          const percent = item.total ? (item.done / item.total) * 100 : 0
          return (
            <article
              className={`daily-level daily-level-${item.level.toLowerCase()}${item.complete ? ' is-complete' : ''}`}
              key={item.level}
            >
              <span className="daily-badge" aria-hidden="true">
                {item.complete ? badge.avatar : '🔒'}
              </span>
              <div>
                <h3>{item.level}</h3>
                <p>
                  {item.total === 0
                    ? 'No challenges yet'
                    : item.complete
                      ? `${badge.title} badge earned!`
                      : `Next: Day ${item.nextDay}`}
                </p>
                <div
                  aria-label={`${item.level} progress`}
                  aria-valuemax={item.total || 1}
                  aria-valuenow={item.done}
                  className="daily-progress"
                  role="progressbar"
                >
                  <span style={{ width: `${percent}%` }} />
                </div>
                <small>
                  {item.done} of {item.total} days done
                </small>
              </div>
            </article>
          )
        })}
      </div>
      <div className="daily-streak-badges">
        <h3>Streak badges</h3>
        <ul>
          {streakBadges.map((badge) => {
            const earned = journey.longest >= badge.days
            return (
              <li
                className={earned ? 'is-earned' : ''}
                key={badge.days}
                title={earned ? `${badge.title} earned` : `Locked: ${badge.days}-day streak`}
              >
                <span aria-hidden="true">{earned ? badge.avatar : '🔒'}</span>
                <strong>{badge.title}</strong>
                <small>{badge.days} days</small>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
