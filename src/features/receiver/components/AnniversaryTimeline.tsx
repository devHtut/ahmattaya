import { Heart, Sparkles, Clock } from 'lucide-react'
import type { AnniversaryEvent } from '../../../shared/models/event'

export function AnniversaryTimeline({
  anniversary,
  coupleNames,
}: {
  anniversary?: AnniversaryEvent
  coupleNames?: string
}) {
  if (!anniversary) return null

  const hasTimeline = anniversary.timeline && anniversary.timeline.length > 0
  const hasDateOrYears = anniversary.date || anniversary.yearsCount

  if (!hasTimeline && !hasDateOrYears) return null

  return (
    <div className="anniversary-timeline-container">
      <div className="anniversary-header">
        <span className="anniversary-badge">
          <Heart size={14} className="heart-icon" /> နှစ်ပတ်လည် အမှတ်တရ
        </span>
        {coupleNames && <h3 className="anniversary-couple">{coupleNames}</h3>}

        {anniversary.yearsCount ? (
          <div className="anniversary-milestone-highlight">
            <Sparkles size={20} className="sparkle-icon" />
            <span className="years-number">{anniversary.yearsCount}</span>
            <span className="years-text">နှစ်ပြည့် ချစ်သက်တမ်း မှတ်တိုင်</span>
          </div>
        ) : null}

        {anniversary.date && (
          <p className="anniversary-date-line">
            <Clock size={14} /> စတင်ခဲ့သည့် နေ့ရက် —{' '}
            <strong>{anniversary.date}</strong>
          </p>
        )}
      </div>

      {hasTimeline && (
        <div
          className="anniversary-timeline-tree"
          role="feed"
          aria-label="အမှတ်တရ မှတ်တိုင်များ"
        >
          <div className="timeline-vertical-stem" aria-hidden="true" />
          {anniversary.timeline.map((item, index) => (
            <article
              key={item.id}
              className={`timeline-card-node reveal-step-${Math.min(index + 1, 5)}`}
            >
              <div className="timeline-node-pin" aria-hidden="true">
                <span className="pin-dot" />
              </div>

              <div className="timeline-node-content">
                <span className="timeline-year-tag">{item.year}</span>
                <h4 className="timeline-node-title">{item.title}</h4>
                {item.description && (
                  <p className="timeline-node-desc">{item.description}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
