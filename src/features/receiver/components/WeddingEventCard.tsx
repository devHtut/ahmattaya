import { useState } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  Navigation,
  Users,
  Heart,
} from 'lucide-react'
import type { WeddingEvent } from '../../../shared/models/event'
import {
  saveRsvpResponse,
  type RsvpResponse,
} from '../../../shared/rsvp/rsvp-storage'

export function WeddingEventCard({
  wedding,
  cardId = 'default',
  coupleNames,
}: {
  wedding?: WeddingEvent
  cardId?: string
  coupleNames?: string
}) {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [attending, setAttending] = useState<'yes' | 'no'>('yes')
  const [guestCount, setGuestCount] = useState(1)
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submittedData, setSubmittedData] = useState<RsvpResponse | null>(null)

  if (!wedding) return null

  const hasEventDetails =
    wedding.date ||
    wedding.time ||
    wedding.venue ||
    wedding.location ||
    wedding.mapUrl

  function handleSubmitRsvp(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const response = saveRsvpResponse(cardId, {
      guestName: name.trim(),
      attending: attending === 'yes',
      guestCount: attending === 'yes' ? Math.max(1, guestCount) : 0,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    })

    setSubmittedData(response)
    setSubmitted(true)
  }

  function handleEditAgain() {
    setSubmitted(false)
  }

  return (
    <div className="wedding-event-container">
      {hasEventDetails && (
        <div className="wedding-info-card">
          <div className="wedding-header">
            <span className="wedding-badge">
              <Heart size={14} className="heart-icon" /> မင်္ဂလာအခမ်းအနား
            </span>
            {coupleNames && <h3 className="wedding-couple">{coupleNames}</h3>}
          </div>

          <div className="wedding-details-grid">
            {wedding.date && (
              <div className="wedding-detail-item">
                <div className="wedding-icon-wrap">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="wedding-label">ရက်စွဲ</span>
                  <strong className="wedding-val">{wedding.date}</strong>
                </div>
              </div>
            )}

            {wedding.time && (
              <div className="wedding-detail-item">
                <div className="wedding-icon-wrap">
                  <Clock size={18} />
                </div>
                <div>
                  <span className="wedding-label">အချိန်</span>
                  <strong className="wedding-val">{wedding.time}</strong>
                </div>
              </div>
            )}

            {wedding.venue && (
              <div className="wedding-detail-item">
                <div className="wedding-icon-wrap">
                  <MapPin size={18} />
                </div>
                <div>
                  <span className="wedding-label">မင်္ဂလာခန်းမ</span>
                  <strong className="wedding-val">{wedding.venue}</strong>
                </div>
              </div>
            )}

            {wedding.location && (
              <div className="wedding-detail-item">
                <div className="wedding-icon-wrap">
                  <Navigation size={18} />
                </div>
                <div>
                  <span className="wedding-label">လိပ်စာ / တည်နေရာ</span>
                  <p className="wedding-val">{wedding.location}</p>
                </div>
              </div>
            )}
          </div>

          {wedding.mapUrl && (
            <div className="wedding-map-action">
              <a
                href={wedding.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button primary wedding-map-button"
              >
                <Navigation size={16} /> Google Maps တွင် လမ်းညွှန်ကြည့်ရန်
              </a>
            </div>
          )}
        </div>
      )}

      {wedding.rsvpEnabled && (
        <div className="wedding-rsvp-card">
          <div className="rsvp-header">
            <span className="wedding-badge">
              <Users size={14} /> RSVP
            </span>
            <h3>တက်ရောက်မှု အတည်ပြုပေးရန်</h3>
            <p className="rsvp-subtitle">
              မင်္ဂလာဧည့်ခံပွဲ အဆင်ပြေချောမွေ့စွာ ပြင်ဆင်နိုင်ရေးအတွက်
              တက်ရောက်နိုင်မှု အခြေအနေကို
              {wedding.rsvpDeadline
                ? ` (${wedding.rsvpDeadline} မတိုင်မီ) `
                : ' '}
              အကြောင်းပြန်ပေးပါရန် လေးစားစွာ ဖိတ်ကြားအပ်ပါသည်။
            </p>
          </div>

          {submitted && submittedData ? (
            <div className="rsvp-thankyou-box" role="status">
              <CheckCircle2 size={40} className="rsvp-check-icon" />
              <h4>ကျေးဇူးတင်ရှိပါသည်</h4>
              <p>
                <strong>{submittedData.guestName}</strong> ၏ အကြောင်းပြန်ချက် (
                {submittedData.attending
                  ? `တက်ရောက်ပါမည် · ${submittedData.guestCount} ဦး`
                  : 'မတက်ရောက်နိုင်ပါ'}
                ) ကို မှတ်တမ်းတင်ပြီးပါပြီ။
              </p>
              <button
                type="button"
                className="button secondary"
                onClick={handleEditAgain}
                style={{ marginTop: '12px' }}
              >
                ပြန်လည်ပြင်ဆင်မည်
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitRsvp} className="rsvp-form">
              <label className="rsvp-field">
                <span>သင့်အမည် / ဧည့်သည်တော်အမည် *</span>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="ဥပမာ — ဦးမင်းမင်း / မသီတာ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <div className="rsvp-field">
                <span>တက်ရောက်နိုင်မှု အခြေအနေ *</span>
                <div
                  className="rsvp-attendance-options"
                  role="radiogroup"
                  aria-label="တက်ရောက်နိုင်မှု"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={attending === 'yes'}
                    className={`rsvp-choice-btn ${attending === 'yes' ? 'selected' : ''}`}
                    onClick={() => setAttending('yes')}
                  >
                    🎉 ဝမ်းမြောက်စွာ တက်ရောက်ပါမည်
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={attending === 'no'}
                    className={`rsvp-choice-btn ${attending === 'no' ? 'selected' : ''}`}
                    onClick={() => setAttending('no')}
                  >
                    💌 မတက်ရောက်နိုင်ပါ (မေတ္တာဖြင့် အဝေးမှ ဆုတောင်း)
                  </button>
                </div>
              </div>

              {attending === 'yes' && (
                <label className="rsvp-field">
                  <span>တက်ရောက်မည့် လူဦးရေ</span>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} ဦး
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="rsvp-field">
                <span>ဖုန်းနံပါတ် (လိုအပ်ပါက ဆက်သွယ်ရန်)</span>
                <input
                  type="tel"
                  maxLength={30}
                  placeholder="ဥပမာ — 09 123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              <label className="rsvp-field">
                <span>မင်္ဂလာဆုမွန်ကောင်း စကားလွှာ</span>
                <textarea
                  rows={3}
                  maxLength={300}
                  placeholder="မင်္ဂလာမောင်နှံအတွက် ဆုမွန်ကောင်း ချီးမြှင့်လိုပါက ရေးသားနိုင်ပါသည်..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>

              <button type="submit" className="button primary rsvp-submit-btn">
                <Send size={15} /> အတည်ပြု အကြောင်းပြန်မည်
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
