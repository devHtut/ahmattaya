import { Clock } from 'lucide-react'
import type { AnniversaryEvent } from '../../../shared/models/event'
import type { CardAppearance } from '../../../shared/models/card'

function getOrdinalSuffix(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) {
    return `${n}th`
  }
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

function getMilestoneTitle(
  anniversary: AnniversaryEvent,
  isBirthday?: boolean,
): string {
  const years = anniversary.yearsValue ?? anniversary.yearsCount ?? 0
  const months = anniversary.monthsValue ?? 0
  const days = anniversary.daysValue ?? 0
  const mode = anniversary.displayMode || 'years-months'

  if (isBirthday) {
    if (years > 0) {
      return `Happy ${getOrdinalSuffix(years)} Birthday`
    }
    return 'Happy Birthday'
  }

  // Anniversary
  if (mode === 'days' && days > 0) {
    return `Happy ${days} Days Together`
  }
  if (years > 0) {
    return `Happy ${getOrdinalSuffix(years)} Anniversary`
  }
  if (months > 0) {
    return `Happy ${months} Months Anniversary`
  }
  return 'Happy Anniversary'
}

export function AnniversaryTimeline({
  anniversary,
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
  const milestoneTitle = getMilestoneTitle(anniversary, isBirthday)
  const hasDateOrYears = Boolean(
    anniversary.date ||
      (anniversary.yearsValue ?? anniversary.yearsCount ?? 0) > 0 ||
      anniversary.durationText?.trim(),
  )

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
          {isBirthday ? ' မွေးနေ့မှာ ပျော်ရွှင်ပါစေ' : ' အတူရှိနေပေးလို့ ကျေးဇူးတင်ပါတယ်'}
        </span>

        {milestoneTitle ? (
          <div className="anniversary-milestone-highlight">
            <span className="milestone-english-title">{milestoneTitle}</span>
          </div>
        ) : null}

        {anniversary.date && !isBirthday && (
          <p className="anniversary-date-line">
            <Clock size={14} /> Date —{' '}
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
