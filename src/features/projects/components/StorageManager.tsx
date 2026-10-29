import { useEffect, useState } from 'react'
import {
  HardDrive,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Music,
  FolderOpen,
} from 'lucide-react'
import type { Project } from '../project-storage.ts'
import {
  cleanupUnreferencedMedia,
  formatBytes,
  getStorageSummary,
  type StorageSummary,
} from '../../../shared/media/storage-manager.ts'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.tsx'

export function StorageManager({ projects }: { projects: Project[] }) {
  const [summary, setSummary] = useState<StorageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [cleanFeedback, setCleanFeedback] = useState<string | null>(null)
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false)

  function refresh() {
    setLoading(true)
    getStorageSummary(projects).then((data) => {
      setSummary(data)
      setLoading(false)
    })
  }

  useEffect(() => {
    let active = true
    getStorageSummary(projects).then((data) => {
      if (active) {
        setSummary(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [projects])

  async function handleCleanup() {
    if (!summary || summary.unreferenced.totalBytes <= 0) return
    setCleanupConfirmOpen(false)
    setCleaning(true)
    setCleanFeedback(null)
    try {
      const result = await cleanupUnreferencedMedia(projects)
      setCleanFeedback(
        `အောင်မြင်ပါသည်! နေရာလွတ် ${formatBytes(result.totalFreedBytes)} ကို ပြန်လည်ရရှိခဲ့ပါသည်။`,
      )
      refresh()
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="storage-manager-card">
      <div className="storage-card-header">
        <div>
          <span
            className="wedding-badge"
            style={{
              background: '#ebf8ff',
              color: '#2b6cb0',
              borderColor: '#bee3f8',
            }}
          >
            <HardDrive size={14} /> စက်တွင်း သိုလှောင်မှု
          </span>
          <h3 className="storage-title">
            Browser Storage နှင့် မီဒီယာ စီမံခန့်ခွဲမှု
          </h3>
          <p className="storage-subtitle">
            AhMatTaYa သည် ဓာတ်ပုံများနှင့် သီချင်းများကို သင့် browser ၏
            IndexedDB ထဲတွင် လုံခြုံစွာ သိမ်းဆည်းပေးထားပါသည်။
          </p>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={refresh}
          disabled={loading || cleaning}
          title="အခြေအနေ ပြန်လည်စစ်ဆေးမည်"
        >
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />{' '}
          ပြန်စစ်မည်
        </button>
      </div>

      {loading && !summary ? (
        <div className="storage-loading-state">
          <p>သိုလှောင်မှု အချက်အလက်များကို တွက်ချက်နေပါသည်...</p>
        </div>
      ) : summary ? (
        <div className="storage-body">
          {/* Progress Bar / Usage Meter */}
          <div className="storage-gauge-wrap">
            <div className="storage-gauge-labels">
              <span className="storage-gauge-text">
                အသုံးပြုထားသော ပမာဏ —{' '}
                <strong>{formatBytes(summary.usedBytes)}</strong>
              </span>
              <span className="storage-gauge-quota">
                ရရှိနိုင်သည့် ပမာဏ — {formatBytes(summary.quotaBytes)} (
                {summary.usagePercent}%)
              </span>
            </div>
            <div
              className="storage-gauge-track"
              role="progressbar"
              aria-valuenow={summary.usagePercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="storage-gauge-fill"
                style={{
                  width: `${Math.max(2, Math.min(100, summary.usagePercent))}%`,
                  background:
                    summary.usagePercent > 80
                      ? '#e53e3e'
                      : summary.usagePercent > 50
                        ? '#dd6b20'
                        : '#319795',
                }}
              />
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="storage-breakdown-grid">
            <div className="storage-stat-tile">
              <div className="storage-icon-circle image-icon">
                <ImageIcon size={20} />
              </div>
              <div>
                <span className="storage-stat-label">နောက်ခံ ဓာတ်ပုံများ</span>
                <strong className="storage-stat-value">
                  {summary.images.count} ပုံ (
                  {formatBytes(summary.images.totalBytes)})
                </strong>
              </div>
            </div>

            <div className="storage-stat-tile">
              <div className="storage-icon-circle audio-icon">
                <Music size={20} />
              </div>
              <div>
                <span className="storage-stat-label">သီချင်းဖိုင်များ</span>
                <strong className="storage-stat-value">
                  {summary.audio.count} ပုဒ် (
                  {formatBytes(summary.audio.totalBytes)})
                </strong>
              </div>
            </div>

            <div className="storage-stat-tile">
              <div className="storage-icon-circle project-icon">
                <FolderOpen size={20} />
              </div>
              <div>
                <span className="storage-stat-label">
                  သိမ်းဆည်းထားသော ကတ်များ
                </span>
                <strong className="storage-stat-value">
                  {summary.projects.activeCount} ခု{' '}
                  {summary.projects.trashedCount > 0
                    ? `(${summary.projects.trashedCount} ခု အမှိုက်ပုံး)`
                    : ''}
                </strong>
              </div>
            </div>
          </div>

          {/* Clean Feedback Alert */}
          {cleanFeedback && (
            <div className="storage-alert-box success" role="status">
              <CheckCircle2 size={18} />
              <span>{cleanFeedback}</span>
            </div>
          )}

          {/* Unreferenced Media / Cleanup Section */}
          <div className="storage-cleanup-section">
            {summary.unreferenced.totalBytes > 0 ? (
              <div className="storage-cleanup-alert">
                <div className="cleanup-alert-header">
                  <AlertTriangle size={20} className="alert-warn-icon" />
                  <div>
                    <h4 className="cleanup-alert-title">
                      အသုံးမပြုတော့သော မီဒီယာဖိုင်{' '}
                      {summary.unreferenced.imageCount +
                        summary.unreferenced.audioCount}{' '}
                      ခု တွေ့ရှိရပါသည် (
                      {formatBytes(summary.unreferenced.totalBytes)})
                    </h4>
                    <p className="cleanup-alert-desc">
                      ကတ်များကို ပြင်ဆင်ဖျက်ပစ်စဉ် ကျန်ရှိနေခဲ့သော
                      မလိုလားအပ်သည့် ဖိုင်များဖြစ်ပါသည်။ သန့်ရှင်းပေးခြင်းဖြင့်
                      သင့် browser နေရာလွတ်ကို ချဲ့ထွင်နိုင်ပါသည်။
                      (လက်ရှိကတ်များနှင့် အမှိုက်ပုံးထဲရှိ ကတ်များ မပျက်စီးပါ)
                    </p>
                  </div>
                </div>

                <div className="cleanup-action-row">
                  <button
                    type="button"
                    className="button primary cleanup-action-button"
                    onClick={() => setCleanupConfirmOpen(true)}
                    disabled={cleaning}
                  >
                    <Trash2 size={15} />{' '}
                    {cleaning
                      ? 'သန့်ရှင်းနေပါသည်...'
                      : `အသုံးမပြုတော့သည့် ဖိုင်များ သန့်ရှင်းမည် (${formatBytes(summary.unreferenced.totalBytes)})`}
                  </button>
                </div>

                <ConfirmDialog
                  isOpen={cleanupConfirmOpen}
                  title="အသုံးမပြုတော့သော မီဒီယာဖိုင်များ ရှင်းလင်းမလား?"
                  description={`အသုံးမပြုတော့သော မီဒီယာဖိုင် ${summary.unreferenced.imageCount + summary.unreferenced.audioCount} ခု (${formatBytes(summary.unreferenced.totalBytes)}) ကို သန့်ရှင်းပစ်ပါမည်။ (လက်ရှိကတ်များနှင့် အမှိုက်ပုံးထဲရှိ ကတ်များ၏ ဖိုင်များကို လုံးဝဖျက်မည်မဟုတ်ပါ)`}
                  confirmText="Delete"
                  cancelText="Cancel"
                  variant="danger"
                  icon="trash"
                  onConfirm={handleCleanup}
                  onClose={() => setCleanupConfirmOpen(false)}
                />
              </div>
            ) : (
              <div className="storage-optimal-state">
                <CheckCircle2 size={24} className="optimal-check-icon" />
                <div>
                  <h4 className="optimal-title">
                    သိုလှောင်မှု အခြေအနေ ကောင်းမွန်နေပါသည်
                  </h4>
                  <p className="optimal-desc">
                    အသုံးမပြုတော့သည့် မလိုအပ်သော မီဒီယာဖိုင်များ မရှိပါ။
                    ဖိုင်များအားလုံး ကတ်များနှင့် စနစ်တကျ ချိတ်ဆက်အသုံးပြုနေဆဲ
                    ဖြစ်ပါသည်။
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
