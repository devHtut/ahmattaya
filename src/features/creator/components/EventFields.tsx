import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Plus,
  RotateCcw,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import type { CardConfig } from '../../../shared/models/card'
import { ColorPaletteFields } from './ColorPaletteFields'
import { TextStyleFields } from './TextStyleFields'
import {
  createAnniversaryEvent,
  createBirthdayTimelineItems,
  createWeddingEvent,
  type TimelineItem,
} from '../../../shared/models/event'
import {
  clearRsvpResponses,
  deleteRsvpResponse,
  exportRsvpCsv,
  listRsvpResponses,
  type RsvpResponse,
} from '../../../shared/rsvp/rsvp-storage'
import { compressPhoto } from '../lib/compress-photo'
import {
  calcAnniversaryDuration,
  formatEnglishDate,
  ENGLISH_MONTHS,
  toMyanmarDigits,
} from '../../../shared/lib/anniversary-calc'

export function EventFields({
  card,
  onChange,
  projectId = 'default',
}: {
  card: CardConfig
  onChange: (card: CardConfig) => void
  projectId?: string
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'rsvp'>('details')
  const [rsvps, setRsvps] = useState<RsvpResponse[]>(() =>
    listRsvpResponses(projectId),
  )
  const [prevProjectId, setPrevProjectId] = useState(projectId)
  const [copied, setCopied] = useState(false)

  if (projectId !== prevProjectId) {
    setPrevProjectId(projectId)
    setRsvps(listRsvpResponses(projectId))
  }

  // Timeline new item form state
  const [timelineYear, setTimelineYear] = useState('')
  const [timelineTitle, setTimelineTitle] = useState('')
  const [timelineDesc, setTimelineDesc] = useState('')
  const [timelinePhoto, setTimelinePhoto] = useState<string | undefined>(
    undefined,
  )
  const [compressing, setCompressing] = useState(false)

  const wedding = card.event?.wedding ?? createWeddingEvent()
  const anniversary = card.event?.anniversary ?? createAnniversaryEvent()

  function updateWedding(patch: Partial<typeof wedding>) {
    onChange({
      ...card,
      event: {
        ...card.event,
        wedding: { ...wedding, ...patch },
      },
    })
  }

  function updateAnniversary(patch: Partial<typeof anniversary>) {
    onChange({
      ...card,
      event: {
        ...card.event,
        anniversary: { ...anniversary, ...patch },
      },
    })
  }

  function addTimelineItem() {
    if (!timelineTitle.trim()) return
    const newItem: TimelineItem = {
      id: crypto.randomUUID(),
      year: timelineYear.trim() || 'အမှတ်တရ',
      title: timelineTitle.trim(),
      description: timelineDesc.trim(),
      photo: timelinePhoto,
    }
    updateAnniversary({
      timeline: [...anniversary.timeline, newItem],
    })
    setTimelineYear('')
    setTimelineTitle('')
    setTimelineDesc('')
    setTimelinePhoto(undefined)
  }

  function removeTimelineItem(id: string) {
    updateAnniversary({
      timeline: anniversary.timeline.filter((item) => item.id !== id),
    })
  }

  async function handleItemPhotoUpload(itemId: string, file: File) {
    try {
      setCompressing(true)
      const { src } = await compressPhoto(file)
      updateAnniversary({
        timeline: anniversary.timeline.map((item) =>
          item.id === itemId ? { ...item, photo: src } : item,
        ),
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ပုံထည့်မရပါ။')
    } finally {
      setCompressing(false)
    }
  }

  function handleItemPhotoRemove(itemId: string) {
    updateAnniversary({
      timeline: anniversary.timeline.map((item) =>
        item.id === itemId ? { ...item, photo: undefined } : item,
      ),
    })
  }

  function handleDeleteRsvp(id: string) {
    deleteRsvpResponse(projectId, id)
    setRsvps(listRsvpResponses(projectId))
  }

  function handleClearAllRsvps() {
    if (!window.confirm('ဧည့်သည်စာရင်း အားလုံးကို ဖျက်ပစ်မှာ သေချာပါသလား?'))
      return
    clearRsvpResponses(projectId)
    setRsvps([])
  }

  function handleDownloadCsv() {
    const csv = exportRsvpCsv(rsvps)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rsvp-guests-${card.title || 'wedding'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCopyList() {
    const text = rsvps
      .map(
        (r) =>
          `• ${r.guestName} (${r.attending ? 'တက်ရောက်မည်' : 'မတက်ရောက်နိုင်'} · ${r.guestCount} ဦး) ${r.phone ? '📞 ' + r.phone : ''}`,
      )
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard error
    }
  }

  const isWedding = card.occasion === 'wedding-invitation'
  const isAnniversary = card.occasion === 'anniversary'
  const isBirthday = card.occasion === 'birthday'
  const isBirthdayTimelineEnabled =
    isBirthday && Boolean(card.event?.anniversary?.enabled)

  // Auto-migrate any anniversary leftover samples or non-year duration in birthday cards
  useEffect(() => {
    if (!isBirthday || !isBirthdayTimelineEnabled) return
    const hasAnniversarySample =
      anniversary.timeline?.some(
        (item) =>
          item.id === 't-1' ||
          item.id === 't-2' ||
          item.title === 'ပထမဆုံး တွေ့ဆုံခြင်း' ||
          item.title === 'လက်တွဲခရီး ၁ နှစ်ပြည့်',
      )
    const hasNonYearDuration =
      Boolean(anniversary.durationText) &&
      (anniversary.durationText!.includes('လ') ||
        anniversary.durationText!.includes('ရက်'))
    const hasDate = Boolean(anniversary.date || anniversary.rawDate)

    if (hasAnniversarySample || hasNonYearDuration || hasDate) {
      const cleanTimeline = hasAnniversarySample
        ? createBirthdayTimelineItems()
        : anniversary.timeline
      const cleanYears = anniversary.yearsValue ?? anniversary.yearsCount ?? 1
      onChange({
        ...card,
        event: {
          ...card.event,
          anniversary: {
            ...anniversary,
            timeline: cleanTimeline,
            yearsValue: cleanYears,
            yearsCount: cleanYears,
            monthsValue: 0,
            daysValue: 0,
            durationText: `${toMyanmarDigits(cleanYears)} နှစ်ပြည့်`,
            date: '',
            rawDate: '',
          },
        },
      })
    }
  }, [
    isBirthday,
    isBirthdayTimelineEnabled,
    anniversary,
    card,
    onChange,
  ])

  // Duration calculations and Alarm state
  function getFormattedDuration(
    mode: 'years-months' | 'days',
    years: number,
    months: number,
    days: number,
  ): string {
    if (mode === 'days') {
      return days > 0 ? `${toMyanmarDigits(days)} ရက်မြောက်နေ့` : '၀ ရက်'
    }
    if (years > 0 && months > 0) {
      return `${toMyanmarDigits(years)} နှစ် ${toMyanmarDigits(months)} လ`
    }
    if (years > 0 && months === 0) {
      return `${toMyanmarDigits(years)} နှစ်ပြည့်`
    }
    if (years === 0 && months > 0) {
      return `${toMyanmarDigits(months)} လပြည့်`
    }
    return '၀ လ'
  }

  const displayMode = anniversary.displayMode || 'years-months'
  const yearsVal = anniversary.yearsValue ?? anniversary.yearsCount ?? 0
  const monthsVal = anniversary.monthsValue ?? 0
  const daysVal = anniversary.daysValue ?? 0
  const rawDate = anniversary.rawDate || ''

  function handleDateSelect(isoDate: string) {
    if (!isoDate) {
      updateAnniversary({ rawDate: '', date: '' })
      return
    }
    const englishDate = formatEnglishDate(isoDate)
    const calc = calcAnniversaryDuration(isoDate)
    const currentMode = anniversary.displayMode || 'years-months'
    const newDurationText =
      currentMode === 'days' ? calc.formattedDays : calc.formattedYearsMonths

    updateAnniversary({
      rawDate: isoDate,
      date: englishDate,
      yearsValue: calc.years,
      yearsCount: calc.years,
      monthsValue: calc.months,
      daysValue: calc.days,
      durationText: newDurationText,
    })
  }

  const parsedDate = useMemo(() => {
    if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      const [y, m, d] = rawDate.split('-').map(Number)
      return { year: y, month: m, day: d }
    }
    const today = new Date()
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    }
  }, [rawDate])

  const currentYear = new Date().getFullYear()
  const yearsList = useMemo(() => {
    const list: number[] = []
    for (let y = currentYear + 1; y >= 1960; y--) {
      list.push(y)
    }
    return list
  }, [currentYear])

  const daysInCurrentMonth = useMemo(() => {
    const y = parsedDate.year
    const m = parsedDate.month
    return new Date(y, m, 0).getDate()
  }, [parsedDate.year, parsedDate.month])

  function handleDropdownChange(part: 'year' | 'month' | 'day', value: string) {
    const num = parseInt(value, 10)
    if (isNaN(num)) return

    let y = parsedDate.year
    let m = parsedDate.month
    let d = parsedDate.day

    if (part === 'year') {
      y = num
    } else if (part === 'month') {
      const monthIdx = ENGLISH_MONTHS.indexOf(value)
      m = monthIdx !== -1 ? monthIdx + 1 : num
    } else if (part === 'day') {
      d = num
    }

    const maxDays = new Date(y, m, 0).getDate()
    if (d > maxDays) d = maxDays

    const yStr = String(y)
    const mStr = String(m).padStart(2, '0')
    const dStr = String(d).padStart(2, '0')
    handleDateSelect(`${yStr}-${mStr}-${dStr}`)
  }

  function handleModeChange(mode: 'years-months' | 'days') {
    const newText = getFormattedDuration(mode, yearsVal, monthsVal, daysVal)
    updateAnniversary({
      displayMode: mode,
      durationText: newText,
    })
  }

  function handleStep(field: 'years' | 'months' | 'days', delta: number) {
    let y = yearsVal
    let m = monthsVal
    let d = daysVal

    if (field === 'years') {
      y = Math.max(0, Math.min(120, y + delta))
    } else if (field === 'months') {
      m = Math.max(0, Math.min(11, m + delta))
    } else if (field === 'days') {
      d = Math.max(0, Math.min(36500, d + delta))
    }

    const newText = isBirthday
      ? `${toMyanmarDigits(y)} နှစ်ပြည့်`
      : getFormattedDuration(displayMode, y, m, d)

    updateAnniversary({
      yearsValue: y,
      yearsCount: y,
      monthsValue: isBirthday ? 0 : m,
      daysValue: isBirthday ? 0 : d,
      durationText: newText,
      date: isBirthday ? '' : anniversary.date,
      rawDate: isBirthday ? '' : anniversary.rawDate,
    })
  }

  function handleDigitChange(
    field: 'years' | 'months' | 'days',
    valStr: string,
  ) {
    const parsed = parseInt(valStr, 10)
    const val = isNaN(parsed) ? 0 : Math.max(0, parsed)
    let y = yearsVal
    let m = monthsVal
    let d = daysVal

    if (field === 'years') {
      y = Math.min(120, val)
    } else if (field === 'months') {
      m = Math.min(11, val)
    } else if (field === 'days') {
      d = Math.min(36500, val)
    }

    const newText = isBirthday
      ? `${toMyanmarDigits(y)} နှစ်ပြည့်`
      : getFormattedDuration(displayMode, y, m, d)

    updateAnniversary({
      yearsValue: y,
      yearsCount: y,
      monthsValue: isBirthday ? 0 : m,
      daysValue: isBirthday ? 0 : d,
      durationText: newText,
      date: isBirthday ? '' : anniversary.date,
      rawDate: isBirthday ? '' : anniversary.rawDate,
    })
  }

  function handleRecalculateToToday() {
    if (!rawDate) return
    handleDateSelect(rawDate)
  }

  const attendingCount = rsvps
    .filter((r) => r.attending)
    .reduce((sum, r) => sum + r.guestCount, 0)
  const declineCount = rsvps.filter((r) => !r.attending).length

  if (!isWedding && !isAnniversary && !isBirthday) {
    return (
      <div className="fields">
        <p className="field-hint">
          ဒီကတ်သည် <strong>{card.occasion}</strong> ပုံစံ ဖြစ်နေပါသည်။
          မင်္ဂလာပွဲရက်စွဲ၊ ခန်းမနေရာ၊ Google Maps၊ RSVP ဧည့်စာရင်း သို့မဟုတ်
          နှစ်ပတ်လည် / မွေးနေ့ Timeline အသုံးပြုလိုပါက အပေါ်က “စာသား” အဆင့်တွင်
          အထိမ်းအမှတ်ကို “မင်္ဂလာဖိတ်စာ”၊ “နှစ်ပတ်လည်” သို့မဟုတ် “မွေးနေ့” အဖြစ်
          ပြောင်းလဲပေးပါ။
        </p>
      </div>
    )
  }

  return (
    <div className="fields event-fields-panel">
      {isWedding && (
        <>
          <div className="shelf-filter" role="tablist">
            <button
              type="button"
              className={`filter-pill ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <Calendar size={14} /> မင်္ဂလာပွဲ အချက်အလက်
            </button>
            <button
              type="button"
              className={`filter-pill ${activeTab === 'rsvp' ? 'active' : ''}`}
              onClick={() => setActiveTab('rsvp')}
            >
              <Users size={14} /> ဧည့်သည်စာရင်း / RSVP ({rsvps.length})
            </button>
          </div>

          {activeTab === 'details' && (
            <div className="event-form-group">
              <label>
                မင်္ဂလာရက်စွဲ
                <input
                  type="text"
                  maxLength={80}
                  placeholder="ဥပမာ — ၂၀၂၆ ခုနှစ်၊ နိုဝင်ဘာလ ၂၈ ရက်"
                  value={wedding.date}
                  onChange={(e) => updateWedding({ date: e.target.value })}
                />
              </label>

              <label>
                အချိန်
                <input
                  type="text"
                  maxLength={80}
                  placeholder="ဥပမာ — နံနက် ၉:၀၀ နာရီ မှ ၁၁:၀၀ နာရီထိ"
                  value={wedding.time}
                  onChange={(e) => updateWedding({ time: e.target.value })}
                />
              </label>

              <label>
                မင်္ဂလာခန်းမ / နေရာ
                <input
                  type="text"
                  maxLength={160}
                  placeholder="ဥပမာ — သုဝဏ္ဏဘူမိ Event Park"
                  value={wedding.venue}
                  onChange={(e) => updateWedding({ venue: e.target.value })}
                />
              </label>

              <label>
                မြို့နယ် / လိပ်စာ
                <input
                  type="text"
                  maxLength={160}
                  placeholder="ဥပမာ — သုဝဏ္ဏ၊ ရန်ကုန်မြို့"
                  value={wedding.location}
                  onChange={(e) => updateWedding({ location: e.target.value })}
                />
              </label>

              <label>
                Google Maps လင့်ခ်
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    maxLength={500}
                    placeholder="https://maps.google.com/..."
                    value={wedding.mapUrl}
                    onChange={(e) => updateWedding({ mapUrl: e.target.value })}
                  />
                  {wedding.mapUrl && (
                    <a
                      className="button secondary"
                      href={wedding.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Google Maps စမ်းဖွင့်ကြည့်မယ်"
                      style={{ padding: '0 12px' }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                <small className="field-hint">
                  Google Maps မှ နေရာလင့်ခ် ထည့်ပေးထားပါက ဖိတ်ကြားခံရသူ
                  တိုက်ရိုက်လမ်းညွှန် ကြည့်ရှုနိုင်ပါမည်။
                </small>
              </label>

              <fieldset
                className="palette-preset"
                style={{ marginTop: '16px' }}
              >
                <legend>RSVP ဧည့်သည်တုံ့ပြန်မှု စနစ်</legend>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={wedding.rsvpEnabled}
                    onChange={(e) =>
                      updateWedding({ rsvpEnabled: e.target.checked })
                    }
                  />
                  <span>ဧည့်သည်များထံမှ RSVP လက်ခံမှုကို ဖွင့်မည်</span>
                </label>

                {wedding.rsvpEnabled && (
                  <>
                    <label style={{ marginTop: '10px' }}>
                      RSVP ပိတ်မည့်ရက် (Deadline)
                      <input
                        type="text"
                        maxLength={80}
                        placeholder="ဥပမာ — နိုဝင်ဘာလ ၂၀ ရက်မတိုင်မီ"
                        value={wedding.rsvpDeadline}
                        onChange={(e) =>
                          updateWedding({ rsvpDeadline: e.target.value })
                        }
                      />
                    </label>

                    <label style={{ marginTop: '10px' }}>
                      ဆက်သွယ်ရန် ဖုန်းနံပါတ်
                      <input
                        type="text"
                        maxLength={60}
                        placeholder="ဥပမာ — ၀၉-၁၂၃၄၅၆၇၈၉"
                        value={wedding.rsvpPhone}
                        onChange={(e) =>
                          updateWedding({ rsvpPhone: e.target.value })
                        }
                      />
                    </label>
                  </>
                )}
              </fieldset>
            </div>
          )}

          {activeTab === 'rsvp' && (
            <div className="rsvp-management">
              <div className="rsvp-summary-badges">
                <div className="rsvp-badge badge-attending">
                  <span className="badge-count">{attendingCount} ဦး</span>
                  <span className="badge-label">တက်ရောက်မည်</span>
                </div>
                <div className="rsvp-badge badge-declined">
                  <span className="badge-count">{declineCount} ဦး</span>
                  <span className="badge-label">မတက်ရောက်နိုင်</span>
                </div>
                <div className="rsvp-badge badge-total">
                  <span className="badge-count">{rsvps.length} ခု</span>
                  <span className="badge-label">စုစုပေါင်း RSVP</span>
                </div>
              </div>

              {rsvps.length > 0 && (
                <div
                  className="rsvp-actions-bar"
                  style={{ display: 'flex', gap: '8px', marginBlock: '12px' }}
                >
                  <button
                    type="button"
                    className="button secondary"
                    onClick={handleDownloadCsv}
                  >
                    <Download size={14} /> CSV ဒေါင်းလုဒ်ယူမယ်
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => void handleCopyList()}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'ကူးပြီးပါပြီ' : 'စာရင်းကူးမယ်'}
                  </button>
                  <button
                    type="button"
                    className="button ghost"
                    onClick={handleClearAllRsvps}
                    style={{
                      marginLeft: 'auto',
                      color: 'var(--error, #ef4444)',
                    }}
                  >
                    <Trash2 size={14} /> အားလုံးရှင်းမယ်
                  </button>
                </div>
              )}

              {rsvps.length === 0 ? (
                <p
                  className="field-hint"
                  style={{ textAlign: 'center', padding: '24px 0' }}
                >
                  ဧည့်သည်များထံမှ RSVP မရရှိသေးပါ။ Receiver link သို့မဟုတ်
                  Preview မှ စမ်းသပ်ပေးပို့နိုင်ပါသည်။
                </p>
              ) : (
                <ul className="rsvp-list">
                  {rsvps.map((r) => (
                    <li key={r.id} className="rsvp-item">
                      <div className="rsvp-item-header">
                        <strong>{r.guestName}</strong>
                        <span
                          className={`rsvp-status ${r.attending ? 'status-attending' : 'status-declined'}`}
                        >
                          {r.attending ? (
                            <>
                              <Check size={12} /> တက်ရောက်မည် ({r.guestCount}{' '}
                              ဦး)
                            </>
                          ) : (
                            <>
                              <X size={12} /> မတက်ရောက်နိုင်ပါ
                            </>
                          )}
                        </span>
                      </div>
                      {r.phone && (
                        <p className="rsvp-item-phone">📞 {r.phone}</p>
                      )}
                      {r.wishes && (
                        <p className="rsvp-item-wishes">“{r.wishes}”</p>
                      )}
                      <div className="rsvp-item-footer">
                        <small>{new Date(r.createdAt).toLocaleString()}</small>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => handleDeleteRsvp(r.id)}
                          title="ဖျက်မယ်"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {isBirthday && (
        <div className="birthday-timeline-toggle-card">
          <div className="toggle-info">
            <strong
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                color: 'var(--ink, #1e293b)',
              }}
            >
              မွေးနေ့ အမှတ်တရ Timeline ထည့်သွင်းမည်
            </strong>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '12px',
                color: 'var(--ink-soft, #64748b)',
                lineHeight: 1.5,
              }}
            >
              လွန်ခဲ့သော နှစ်များက ကျင်းပခဲ့သော မွေးနေ့ပုံရိပ်များ၊ အမှတ်တရ
              မှတ်တမ်းများနှင့် ရက်စွဲများကို Timeline အနေဖြင့် ပြသလိုပါက
              ဖွင့်ပေးပါ။
            </p>
          </div>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={isBirthdayTimelineEnabled}
              onChange={(e) => {
                const checked = e.target.checked
                if (checked) {
                  const hasAnniversarySample =
                    !anniversary.timeline ||
                    anniversary.timeline.length === 0 ||
                    anniversary.timeline.some(
                      (item) =>
                        item.id === 't-1' ||
                        item.id === 't-2' ||
                        item.title === 'ပထမဆုံး တွေ့ဆုံခြင်း',
                    )
                  const timeline = hasAnniversarySample
                    ? createBirthdayTimelineItems()
                    : anniversary.timeline
                  const y = anniversary.yearsValue ?? anniversary.yearsCount ?? 1

                  updateAnniversary({
                    enabled: true,
                    yearsValue: y,
                    yearsCount: y,
                    monthsValue: 0,
                    daysValue: 0,
                    durationText: `${toMyanmarDigits(y)} နှစ်ပြည့်`,
                    date: '',
                    rawDate: '',
                    timeline,
                  })
                } else {
                  updateAnniversary({
                    enabled: false,
                  })
                }
              }}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--accent, #e11d48)',
                cursor: 'pointer',
              }}
            />
          </label>
        </div>
      )}

      {(isAnniversary || isBirthdayTimelineEnabled) && (
        <div className="anniversary-form-group">
          {/* 1. Date Picker with Auto-calc (Anniversary only) */}
          {!isBirthday && isAnniversary && (
            <div className="anniversary-date-picker-box">
              <label className="anniversary-date-label">
                <span>Anniversary Date</span>
              </label>

              {/* 3-part Fast Selectors: Day, Month, Year */}
              <div className="date-select-row">
                {/* Day */}
                <div className="date-select-col">
                  <span className="date-col-label">Day</span>
                  <select
                    className="date-dropdown-select"
                    value={rawDate ? parsedDate.day : ''}
                    onChange={(e) => handleDropdownChange('day', e.target.value)}
                    aria-label="ရက် ရွေးပါ"
                  >
                    {!rawDate && <option value="">ရွေးပါ</option>}
                    {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month */}
                <div className="date-select-col month-col">
                  <span className="date-col-label">Month</span>
                  <select
                    className="date-dropdown-select"
                    value={rawDate ? parsedDate.month : ''}
                    onChange={(e) => handleDropdownChange('month', e.target.value)}
                    aria-label="လ ရွေးပါ"
                  >
                    {!rawDate && <option value="">ရွေးပါ</option>}
                    {ENGLISH_MONTHS.map((name, i) => (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div className="date-select-col">
                  <span className="date-col-label">Year</span>
                  <select
                    className="date-dropdown-select"
                    value={rawDate ? parsedDate.year : ''}
                    onChange={(e) => handleDropdownChange('year', e.target.value)}
                    aria-label="ခုနှစ် ရွေးပါ"
                  >
                    {!rawDate && <option value="">ရွေးပါ</option>}
                    {yearsList.map((y: number) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. Alarm Digital Counter UI */}
          <div style={{ marginTop: isBirthday ? '4px' : '14px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--ink, #1e293b)',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              {isBirthday ? 'မွေးနေ့' : 'နှစ်ပတ်လည်'}
            </span>

            <div className="alarm-counter-container">
              {/* Mode switch: Years & Months vs Total Days (Anniversary only) */}
              {!isBirthday && (
                <div className="alarm-mode-selector">
                  <button
                    type="button"
                    className={`alarm-mode-btn ${displayMode === 'years-months' ? 'active' : ''}`}
                    onClick={() => handleModeChange('years-months')}
                  >
                    နှစ် နှင့် လ
                  </button>
                  <button
                    type="button"
                    className={`alarm-mode-btn ${displayMode === 'days' ? 'active' : ''}`}
                    onClick={() => handleModeChange('days')}
                  >
                    ရက်ပေါင်း
                  </button>
                </div>
              )}

              {/* Digital Alarm Display */}
              <div className="alarm-clock-display">
                {isBirthday ? (
                  /* Birthday: Single Years Group only */
                  <div
                    className="alarm-digit-group"
                    style={{ minWidth: '110px' }}
                  >
                    <button
                      type="button"
                      className="alarm-step-btn"
                      onClick={() => handleStep('years', 1)}
                      aria-label="၁ နှစ် တိုးမည်"
                      title="၁ နှစ် တိုးမည်"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="alarm-digit-card"
                      value={String(yearsVal).padStart(2, '0')}
                      onChange={(e) =>
                        handleDigitChange(
                          'years',
                          e.target.value.replace(/\D/g, ''),
                        )
                      }
                    />
                    <button
                      type="button"
                      className="alarm-step-btn"
                      onClick={() => handleStep('years', -1)}
                      aria-label="၁ နှစ် လျှော့မည်"
                      title="၁ နှစ် လျှော့မည်"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <span className="alarm-digit-label">Years</span>
                  </div>
                ) : displayMode === 'years-months' ? (
                  <>
                    {/* Years Group */}
                    <div className="alarm-digit-group">
                      <button
                        type="button"
                        className="alarm-step-btn"
                        onClick={() => handleStep('years', 1)}
                        aria-label="၁ နှစ် တိုးမည်"
                        title="၁ နှစ် တိုးမည်"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="alarm-digit-card"
                        value={String(yearsVal).padStart(2, '0')}
                        onChange={(e) =>
                          handleDigitChange(
                            'years',
                            e.target.value.replace(/\D/g, ''),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="alarm-step-btn"
                        onClick={() => handleStep('years', -1)}
                        aria-label="၁ နှစ် လျှော့မည်"
                        title="၁ နှစ် လျှော့မည်"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <span className="alarm-digit-label">Years</span>
                    </div>

                    <div className="alarm-separator">:</div>

                    {/* Months Group */}
                    <div className="alarm-digit-group">
                      <button
                        type="button"
                        className="alarm-step-btn"
                        onClick={() => handleStep('months', 1)}
                        aria-label="၁ လ တိုးမည်"
                        title="၁ လ တိုးမည်"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="alarm-digit-card"
                        value={String(monthsVal).padStart(2, '0')}
                        onChange={(e) =>
                          handleDigitChange(
                            'months',
                            e.target.value.replace(/\D/g, ''),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="alarm-step-btn"
                        onClick={() => handleStep('months', -1)}
                        aria-label="၁ လ လျှော့မည်"
                        title="၁ လ လျှော့မည်"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <span className="alarm-digit-label">Months</span>
                    </div>
                  </>
                ) : (
                  /* Days Group */
                  <div className="alarm-digit-group days-group">
                    <button
                      type="button"
                      className="alarm-step-btn"
                      onClick={() => handleStep('days', 10)}
                      aria-label="၁၀ ရက် တိုးမည်"
                      title="၁၀ ရက် တိုးမည်"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="alarm-digit-card"
                      value={String(daysVal).padStart(2, '0')}
                      onChange={(e) =>
                        handleDigitChange(
                          'days',
                          e.target.value.replace(/\D/g, ''),
                        )
                      }
                    />
                    <button
                      type="button"
                      className="alarm-step-btn"
                      onClick={() => handleStep('days', -10)}
                      aria-label="၁၀ ရက် လျှော့မည်"
                      title="၁၀ ရက် လျှော့မည်"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <span className="alarm-digit-label">ရက် (Total Days)</span>
                  </div>
                )}
              </div>

              {/* Status and Recalculate */}
              <div
                className="alarm-calc-row"
                style={isBirthday ? { justifyContent: 'center' } : undefined}
              >
                {!isBirthday && rawDate && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={handleRecalculateToToday}
                    title="ယနေ့ရက်စွဲဖြင့် အလိုအလျောက် ပြန်လည်တွက်ချက်မည်"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      padding: '6px 12px',
                    }}
                  >
                    <RotateCcw size={13} /> ယနေ့အထိ ပြန်တွက်မည်
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Colors Section */}
          <div className="timeline-colors-section" style={{ marginTop: '18px' }}>
            <ColorPaletteFields
              colors={anniversary.colors ?? card.appearance.colors}
              onChangeColors={(newColors) =>
                updateAnniversary({ colors: newColors })
              }
              isCustomized={Boolean(anniversary.colors)}
              onResetToDefault={() => updateAnniversary({ colors: undefined })}
              legend="Timeline အရောင်တွဲများ"
              resetButtonText="Cover အရောင်အတိုင်းထားမယ်"
              showCustomPickers={true}
            />
          </div>

          {/* Timeline Typography Section */}
          <div className="timeline-typography-section" style={{ marginTop: '14px' }}>
            <TextStyleFields
              heading={{
                ...card.appearance.heading,
                ...(anniversary.heading ?? {}),
              }}
              body={{
                ...card.appearance.body,
                ...(anniversary.body ?? {}),
              }}
              onChangeHeading={(change) =>
                updateAnniversary({
                  heading: { ...(anniversary.heading ?? {}), ...change },
                })
              }
              onChangeBody={(change) =>
                updateAnniversary({
                  body: { ...(anniversary.body ?? {}), ...change },
                })
              }
              isCustomized={Boolean(anniversary.heading || anniversary.body)}
              onResetToDefault={() =>
                updateAnniversary({
                  heading: undefined,
                  body: undefined,
                })
              }
              legend="Timeline စာလုံးပုံစံ ပြင်မယ်"
              headingLabel="ခေါင်းစဉ်"
              bodyLabel="စာသား / ဇာတ်လမ်း"
            />
          </div>

          {/* 3. Timeline Builder */}
          <fieldset className="palette-preset" style={{ marginTop: '18px' }}>
            <legend>
              {isBirthday ? 'မွေးနေ့ အမှတ်တရ Timeline' : 'အမှတ်တရ Timeline'}
            </legend>

            <div className="timeline-add-box">
              <label>
                အချိန်ကာလ / ခုနှစ်
                <input
                  type="text"
                  maxLength={40}
                  placeholder={
                    isBirthday
                      ? 'ဥပမာ — ၁ နှစ်ပြည့် သို့မဟုတ် အသက် ၁၈ နှစ်'
                      : 'ဥပမာ — ၂၀၂၁ ခုနှစ် သို့မဟုတ် စတင်တွေ့ဆုံချိန်'
                  }
                  value={timelineYear}
                  onChange={(e) => setTimelineYear(e.target.value)}
                />
              </label>

              <label>
                Timeline ခေါင်းစဉ်
                <input
                  type="text"
                  maxLength={100}
                  placeholder={
                    isBirthday
                      ? 'ဥပမာ — ပထမဆုံး မွေးနေ့ပွဲ အမှတ်တရ'
                      : 'ဥပမာ — ပထမဆုံး ခရီးအတူသွားခြင်း'
                  }
                  value={timelineTitle}
                  onChange={(e) => setTimelineTitle(e.target.value)}
                />
              </label>

              <label>
                အမှတ်တရ စကား / ဇာတ်လမ်း
                <textarea
                  maxLength={400}
                  rows={3}
                  placeholder={
                    isBirthday
                      ? 'ဒီမွေးနေ့မှာ ချစ်ခင်ရသူတွေနဲ့ ပျော်ရွှင်စွာ ဖြတ်သန်းခဲ့ရတဲ့ အမှတ်တရလေးတွေကို ရေးသားပါ…'
                      : 'ဒီအချိန်ကာလရဲ့ အမှတ်တရလေးတွေကို ရေးသားပါ…'
                  }
                  value={timelineDesc}
                  onChange={(e) => setTimelineDesc(e.target.value)}
                />
              </label>

              <div
                className="timeline-photo-input-section"
                style={{ margin: '10px 0' }}
              >
                <span
                  className="field-hint"
                  style={{ display: 'block', marginBottom: '6px' }}
                >
                  အမှတ်တရ ဓာတ်ပုံ
                </span>
                {timelinePhoto ? (
                  <div
                    className="timeline-form-photo-preview"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'var(--paper-soft, #f7fafc)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line, #e2e8f0)',
                    }}
                  >
                    <img
                      src={timelinePhoto}
                      alt="ရွေးချယ်ထားသော ပုံ"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                      }}
                    />
                    <span
                      style={{ fontSize: '12px', color: 'var(--ink-soft)' }}
                    >
                      ဓာတ်ပုံ ရွေးချယ်ပြီးပါပြီ
                    </span>
                    <button
                      type="button"
                      className="button ghost"
                      onClick={() => setTimelinePhoto(undefined)}
                      style={{
                        marginLeft: 'auto',
                        color: 'var(--error, #ef4444)',
                        padding: '4px 8px',
                      }}
                    >
                      <X size={13} /> Remove
                    </button>
                  </div>
                ) : (
                  <label
                    className="button secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: compressing ? 'wait' : 'pointer',
                    }}
                  >
                    <Camera size={14} />
                    {compressing ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={compressing}
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setCompressing(true)
                          const { src } = await compressPhoto(file)
                          setTimelinePhoto(src)
                        } catch (err) {
                          alert(
                            err instanceof Error ? err.message : 'ပုံထည့်မရပါ။',
                          )
                        } finally {
                          setCompressing(false)
                          e.target.value = ''
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <button
                type="button"
                className="button primary"
                disabled={!timelineTitle.trim()}
                onClick={addTimelineItem}
                style={{ marginTop: '8px' }}
              >
                <Plus size={14} /> Timeline ထဲ ထည့်မယ်
              </button>
            </div>

            <ul className="timeline-builder-list" style={{ marginTop: '16px' }}>
              {anniversary.timeline.map((item, idx) => (
                <li key={item.id} className="timeline-builder-item">
                  <div className="timeline-builder-dot">{idx + 1}</div>
                  <div className="timeline-builder-content">
                    <span className="timeline-builder-year">{item.year}</span>
                    <strong>{item.title}</strong>
                    {item.photo && (
                      <div
                        className="timeline-builder-photo-preview"
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                          margin: '6px 0',
                        }}
                      >
                        <img
                          src={item.photo}
                          alt={item.title}
                          style={{
                            width: '64px',
                            height: '64px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid var(--line, #e2e8f0)',
                          }}
                        />
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => handleItemPhotoRemove(item.id)}
                          title="ဓာတ်ပုံ ဖြုတ်မယ်"
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '20px',
                            height: '20px',
                            background: 'var(--card, #fff)',
                            border: '1px solid var(--line, #cbd5e0)',
                            borderRadius: '50%',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            padding: 0,
                          }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                    {item.description && <p>{item.description}</p>}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      marginLeft: 'auto',
                    }}
                  >
                    {!item.photo && (
                      <label
                        className="icon-button"
                        title="Upload Photo"
                        style={{ cursor: 'pointer' }}
                      >
                        <Camera size={14} />
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) void handleItemPhotoUpload(item.id, file)
                            e.target.value = ''
                          }}
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => removeTimelineItem(item.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </fieldset>
        </div>
      )}
    </div>
  )
}

