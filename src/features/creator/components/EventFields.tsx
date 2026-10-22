import { useState } from 'react'
import {
  Calendar,
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import type { CardConfig } from '../../../shared/models/card'
import {
  createAnniversaryEvent,
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

  const attendingCount = rsvps
    .filter((r) => r.attending)
    .reduce((sum, r) => sum + r.guestCount, 0)
  const declineCount = rsvps.filter((r) => !r.attending).length

  if (!isWedding && !isAnniversary) {
    return (
      <div className="fields">
        <p className="field-hint">
          ဒီကတ်သည် <strong>{card.occasion}</strong> ပုံစံ ဖြစ်နေပါသည်။
          မင်္ဂလာပွဲရက်စွဲ၊ ခန်းမနေရာ၊ Google Maps၊ RSVP ဧည့်စာရင်း သို့မဟုတ်
          နှစ်ပတ်လည် Timeline အသုံးပြုလိုပါက အပေါ်က “စာသား” အဆင့်တွင်
          အခမ်းအနားကို “မင်္ဂလာဖိတ်စာ” သို့မဟုတ် “နှစ်ပတ်လည်” အဖြစ်
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

      {isAnniversary && (
        <div className="anniversary-form-group">
          <label>
            နှစ်ပတ်လည် သက်တမ်း / ကာလ
            <input
              type="text"
              maxLength={80}
              placeholder="ဥပမာ — ၁ နှစ်နဲ့ ၃ လ၊ ၃ နှစ်ပြည့်၊ ၆ လပြည့်"
              value={anniversary.durationText || ''}
              onChange={(e) =>
                updateAnniversary({ durationText: e.target.value })
              }
            />
            <small className="field-hint">
              ၁ နှစ်ပြည့် သာမက “၁ နှစ်နဲ့ ၃ လ”၊ “၆ လပြည့်” စသဖြင့် လွတ်လပ်စွာ
              ရေးသားနိုင်ပါသည်။
            </small>
          </label>

          <div
            className="duration-preset-pills"
            role="group"
            aria-label="အမြန်ရွေးချယ်နိုင်သော ကာလများ"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              margin: '4px 0 16px',
            }}
          >
            {[
              '၆ လပြည့်',
              '၁ နှစ်ပြည့်',
              '၁ နှစ်နဲ့ ၃ လ',
              '၂ နှစ်ပြည့်',
              '၃ နှစ်ပြည့်',
              '၃ နှစ်နဲ့ ၆ လ',
              '၅ နှစ်ပြည့်',
              '၁၀ နှစ်ပြည့်',
            ].map((preset) => {
              const currentVal =
                anniversary.durationText?.trim() ||
                (anniversary.yearsCount
                  ? `${anniversary.yearsCount} နှစ်ပြည့်`
                  : '')
              const isActive = currentVal === preset
              return (
                <button
                  key={preset}
                  type="button"
                  className={`filter-pill ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    const match = preset.match(/(\d+)\s*နှစ်/)
                    updateAnniversary({
                      durationText: preset,
                      yearsCount: match
                        ? parseInt(match[1], 10)
                        : anniversary.yearsCount,
                    })
                  }}
                >
                  {preset}
                </button>
              )
            })}
          </div>

          <label>
            နှစ်ပတ်လည် ရက်စွဲ
            <input
              type="text"
              maxLength={80}
              placeholder="ဥပမာ — ၂၀၂၆ ခုနှစ်၊ ဒီဇင်ဘာလ"
              value={anniversary.date}
              onChange={(e) => updateAnniversary({ date: e.target.value })}
            />
          </label>

          <fieldset className="palette-preset" style={{ marginTop: '18px' }}>
            <legend>အမှတ်တရ Timeline မှတ်တိုင်များ</legend>

            <div className="timeline-add-box">
              <label>
                အချိန်ကာလ / ခုနှစ်
                <input
                  type="text"
                  maxLength={40}
                  placeholder="ဥပမာ — ၂၀၂၁ ခုနှစ် သို့မဟုတ် စတင်တွေ့ဆုံချိန်"
                  value={timelineYear}
                  onChange={(e) => setTimelineYear(e.target.value)}
                />
              </label>

              <label>
                မှတ်တိုင် ခေါင်းစဉ်
                <input
                  type="text"
                  maxLength={100}
                  placeholder="ဥပမာ — ပထမဆုံး ခရီးအတူသွားခြင်း"
                  value={timelineTitle}
                  onChange={(e) => setTimelineTitle(e.target.value)}
                />
              </label>

              <label>
                အမှတ်တရ စကား / ဇာတ်လမ်း
                <textarea
                  maxLength={400}
                  rows={3}
                  placeholder="ဒီအချိန်ကာလရဲ့ အမှတ်တရလေးတွေကို ရေးသားပါ…"
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
                  အမှတ်တရ ဓာတ်ပုံ (ရွေးချယ်နိုင်သည်)
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
                      <X size={13} /> ဖယ်ရှားမယ်
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
                    {compressing ? 'ပုံချုံ့နေပါသည်...' : '📷 ဓာတ်ပုံ ထည့်မယ်'}
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
                        title="ဓာတ်ပုံ ထည့်မယ်"
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
                      title="ဖျက်မယ်"
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
