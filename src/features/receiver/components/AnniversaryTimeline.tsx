import { Clock } from 'lucide-react'
import type { AnniversaryEvent } from '../../../shared/models/event'
import type { CardAppearance } from '../../../shared/models/card'

export function AnniversaryTimeline({
  anniversary,
  coupleNames,
  colors,
  isBirthday,
}: {
  anniversary?: AnniversaryEvent
  coupleNames?: string
  colors?: CardAppearance['colors']
  isBirthday?: boolean
}) {
  if (!anniversary) return null
  if (isBirthday && anniversary.enabled === false) return null

  const hasTimeline = anniversary.timeline && anniversary.timeline.length > 0
  const durationLabel = anniversary.durationText?.trim()
    ? anniversary.durationText
    : anniversary.yearsCount
      ? `${anniversary.yearsCount} နှစ်ပြည့်`
      : null
  const hasDateOrYears = Boolean(anniversary.date || durationLabel)

  if (!hasTimeline && !hasDateOrYears) return null

  const containerStyle = colors
    ? ({
      '--accent': colors.accent,
      '--card': colors.surface,
      '--ink': colors.text,
    } as React.CSSProperties)
    : undefined

  return (
    <div className="anniversary-timeline-container" style={containerStyle}>
      <div className="anniversary-header">
        <span className="anniversary-badge">
          {isBirthday ? ' မွေးနေ့ အမှတ်တရ' : ' နှစ်ပတ်လည် အမှတ်တရ'}
        </span>
        {coupleNames && <h3 className="anniversary-couple">{coupleNames}</h3>}

        {durationLabel ? (
          <div className="anniversary-milestone-highlight">
            <span className="years-number">{durationLabel}</span>
            <span className="years-text">
              {isBirthday ? 'မွေးနေ့အမှတ်တရ မှတ်တိုင်' : 'ချစ်သက်တမ်း မှတ်တိုင်'}
            </span>
          </div>
        ) : null}

        {anniversary.date && !isBirthday && (
          <p className="anniversary-date-line">
            <Clock size={14} /> စတင်ခဲ့သည့် နေ့ရက် —{' '}
            <strong>{anniversary.date}</strong>
          </p>
        )}
      </div>

      {hasTimeline && (
        <div
          className="anniversary-timeline-tree is-zigzag"
          role="feed"
          aria-label="အမှတ်တရ မှတ်တိုင်များ"
        >
          <div className="timeline-vertical-stem" aria-hidden="true" />
          {anniversary.timeline.map((item, index) => {
            const isLeft = index % 2 === 0
            return (
              <article
                key={item.id}
                className={`timeline-card-node ${isLeft ? 'is-left' : 'is-right'} reveal-step-${Math.min(index + 1, 5)}`}
              >
                <div className="timeline-node-pin" aria-hidden="true">
                  <span className="pin-dot" />
                </div>

                <div className="timeline-node-content">
                  <span className="timeline-year-tag">{item.year}</span>
                  <h4 className="timeline-node-title">{item.title}</h4>
                  {item.photo && (
                    <div className="timeline-photo-wrap">
                      <img
                        src={item.photo}
                        alt={item.title}
                        className="timeline-milestone-photo"
                      />
                    </div>
                  )}
                  {item.description && (
                    <p className="timeline-node-desc">{item.description}</p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
