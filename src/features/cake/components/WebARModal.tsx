import { useEffect, useState } from 'react'
import {
  Sparkles,
  Download,
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Eye,
  QrCode,
} from 'lucide-react'
import QRCode from 'qrcode'
import type { CakeRecipe } from '../../../shared/models/cake.ts'
import {
  detectARPlatform,
  exportCakeToGLB,
  exportCakeToUSDZ,
  triggerGLBDownload,
  triggerIOSQuickLook,
  type ARPlatform,
} from '../lib/ar-export.ts'

export function WebARModal({
  recipe,
  onClose,
  cakeTitle = 'အမှတ်တရ ကိတ်မုန့်',
}: {
  recipe: CakeRecipe
  onClose: () => void
  cakeTitle?: string
}) {
  const [platform] = useState<ARPlatform>(() => detectARPlatform())
  const [exporting, setExporting] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    // Generate QR code for current page URL so desktop users can open on phone
    if (typeof window !== 'undefined') {
      QRCode.toDataURL(window.location.href, { width: 180, margin: 2 })
        .then(setQrUrl)
        .catch(() => setQrUrl(null))
    }
  }, [])

  async function handleLaunchIOS() {
    setExporting('ios')
    setStatusMessage('iPhone အတွက် 3D AR မော်ဒယ် ပြင်ဆင်နေပါသည်...')
    try {
      const blob = await exportCakeToUSDZ(recipe)
      triggerIOSQuickLook(blob, `${cakeTitle}.usdz`)
      setStatusMessage('AR Quick Look ဖွင့်လှစ်နေပါသည် ✨')
    } catch {
      setStatusMessage('USDZ export ပြုလုပ်ရာတွင် အခက်အခဲ ရှိနေပါသည်။')
    } finally {
      setExporting(null)
    }
  }

  async function handleDownloadUSDZ() {
    setExporting('usdz')
    try {
      const blob = await exportCakeToUSDZ(recipe)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${cakeTitle}.usdz`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } finally {
      setExporting(null)
    }
  }

  async function handleLaunchAndroid() {
    setExporting('android')
    setStatusMessage('Android အတွက် 3D မော်ဒယ် ပြင်ဆင်နေပါသည်...')
    try {
      const blob = await exportCakeToGLB(recipe)
      triggerGLBDownload(blob, `${cakeTitle}.glb`)
      setStatusMessage(
        '3D မော်ဒယ် ဒေါင်းလုဒ်ပြီးပါပြီ! Google Files သို့မဟုတ် 3D Viewer ဖြင့် ဖွင့်၍ "View in your space" ကို နှိပ်ပါ ✨',
      )
    } catch {
      setStatusMessage('GLB export ပြုလုပ်ရာတွင် အခက်အခဲ ရှိနေပါသည်။')
    } finally {
      setExporting(null)
    }
  }

  async function handleDownloadGLB() {
    setExporting('glb')
    try {
      const blob = await exportCakeToGLB(recipe)
      triggerGLBDownload(blob, `${cakeTitle}.glb`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div
      className="webar-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="webar-title"
    >
      <div className="webar-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="webar-modal-header">
          <div className="webar-badge">
            <Sparkles size={14} /> WebAR (Augmented Reality)
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="ပိတ်မယ်"
          >
            <X size={18} />
          </button>
        </div>

        <h3 id="webar-title" className="webar-modal-title">
          လက်တွေ့ပတ်ဝန်းကျင်ထဲတွင် Cake ကြည့်ရှုခြင်း
        </h3>
        <p className="webar-modal-desc">
          ဒီကိတ်မုန့် 3D မော်ဒယ်လေးကို သင့်အခန်း၊ စားပွဲ သို့မဟုတ်
          လက်တွေ့ကမ္ဘာထဲတွင် ကင်မရာဖွင့်၍ အတိုင်းအတာအမှန်အတိုင်း
          ချထားကြည့်ရှုနိုင်ပါသည်။
        </p>

        {/* Platform Status Indicator */}
        <div className="webar-platform-box">
          <Smartphone size={18} />
          <span>
            လက်ရှိ စက်အမျိုးအစား —{' '}
            <strong>
              {platform === 'ios'
                ? '🍎 Apple iPhone / iPad (iOS AR Quick Look)'
                : platform === 'android'
                  ? '🤖 Android (Google Scene Viewer / 3D Viewer)'
                  : '💻 Desktop ကွန်ပျူတာ'}
            </strong>
          </span>
        </div>

        {statusMessage && (
          <div className="webar-status-alert" role="status">
            <CheckCircle2 size={16} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Action controls based on platform */}
        <div className="webar-actions-container">
          {platform === 'ios' && (
            <div className="webar-platform-action-group">
              <button
                type="button"
                className="button primary webar-main-btn"
                onClick={handleLaunchIOS}
                disabled={exporting !== null}
              >
                <Eye size={18} />
                {exporting === 'ios'
                  ? '3D မော်ဒယ် ပြင်ဆင်နေပါသည်...'
                  : '✨ iPhone AR ဖြင့် ကင်မရာဖွင့်ကြည့်မည်'}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={handleDownloadUSDZ}
                disabled={exporting !== null}
              >
                <Download size={15} /> .usdz ဖိုင် ဒေါင်းလုဒ်ဆွဲမည်
              </button>
              <p className="webar-hint-text">
                💡 Safari browser ဖြင့် အကောင်းဆုံး အလုပ်လုပ်ပါသည်။
                ကင်မရာပွင့်လာပါက အလင်းရောင်ကောင်းသော စားပွဲ သို့မဟုတ်
                ကြမ်းပြင်ကို ချိန်ပေးပါ။
              </p>
            </div>
          )}

          {platform === 'android' && (
            <div className="webar-platform-action-group">
              <button
                type="button"
                className="button primary webar-main-btn"
                onClick={handleLaunchAndroid}
                disabled={exporting !== null}
              >
                <Eye size={18} />
                {exporting === 'android'
                  ? '3D မော်ဒယ် ပြင်ဆင်နေပါသည်...'
                  : '✨ 3D / AR မော်ဒယ် (.glb) ဖွင့်ကြည့်မည်'}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={handleDownloadGLB}
                disabled={exporting !== null}
              >
                <Download size={15} /> .glb ဖိုင် ဒေါင်းလုဒ်ဆွဲမည်
              </button>
              <p className="webar-hint-text">
                💡 ဒေါင်းလုဒ်ရရှိသော `.glb` ဖိုင်ကို Google Files သို့မဟုတ်
                Google 3D Viewer ဖြင့် ဖွင့်ပြီး "View in your space" ကို နှိပ်၍
                AR ကြည့်နိုင်ပါသည်။
              </p>
            </div>
          )}

          {platform === 'desktop' && (
            <div className="webar-desktop-view">
              {qrUrl && (
                <div className="webar-qr-box">
                  <div className="webar-qr-frame">
                    <img
                      src={qrUrl}
                      alt="Scan QR for AR"
                      className="webar-qr-img"
                    />
                  </div>
                  <p className="webar-qr-caption">
                    <QrCode size={14} /> iPhone သို့မဟုတ် Android ကင်မရာဖြင့်
                    scan ဖတ်၍ ဖုန်းပေါ်တွင် AR တိုက်ရိုက် ကြည့်ရှုနိုင်ပါသည်။
                  </p>
                </div>
              )}

              <div className="webar-download-grid">
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleDownloadUSDZ}
                  disabled={exporting !== null}
                >
                  <Download size={15} /> Apple ဖိုင် (.usdz) ဒေါင်းလုဒ်
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleDownloadGLB}
                  disabled={exporting !== null}
                >
                  <Download size={15} /> 3D မော်ဒယ် (.glb) ဒေါင်းလုဒ်
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="webar-footer-note">
          <AlertCircle size={14} />
          <span>
            Three.js procedural geometry မှ တိုက်ရိုက်ထုတ်ယူထားသော အမှန်တကယ် 3D
            မော်ဒယ် ဖြစ်ပါသည်။
          </span>
        </div>
      </div>
    </div>
  )
}
