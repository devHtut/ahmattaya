import { useEffect, useRef, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { getReceiverClient } from '../../../shared/cloud/client'
import { loadPublishedCard } from '../../../shared/cloud/publishing'
import { renderInvitation } from './render-ticket'
type Images = { ticket: string; qr: string; revision: number }
export default function QrInvitation({
  id,
  revision,
  disabled,
}: {
  id: string
  revision: number
  disabled: boolean
}) {
  const [notice, setNotice] = useState('')
  const [checking, setChecking] = useState(false)
  const [images, setImages] = useState<Images | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0)
  const running = useRef(false),
    alive = useRef(false)
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController(),
      urls: string[] = []
    alive.current = true
    async function load() {
      try {
        const client = await getReceiverClient(),
          snapshot = await loadPublishedCard(client, id, controller.signal)
        const result = await renderInvitation(id, snapshot.card)
        if (cancelled) return
        const ticket = URL.createObjectURL(result.ticket),
          qr = URL.createObjectURL(result.qr)
        urls.push(ticket, qr)
        setImages({ ticket, qr, revision: snapshot.revision })
        setError('')
        setLoading(false)
      } catch {
        if (!cancelled) {
          setImages(null)
          setError(
            'QR ဖိတ်စာကို ပြင်ဆင်မရပါ။ Internet နဲ့ Publish link ကို စစ်ပြီး ပြန်ကြိုးစားပါ။',
          )
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
      alive.current = false
      controller.abort()
      for (const url of urls) URL.revokeObjectURL(url)
    }
  }, [id, revision, retry])
  async function download(kind: 'ticket' | 'qr') {
    if (running.current || disabled || loading || !images) return
    running.current = true
    setChecking(true)
    setNotice('')
    setError('')
    try {
      // Recheck the actual publication, including changes made in another tab/device.
      const snapshot = await loadPublishedCard(await getReceiverClient(), id)
      if (!alive.current) return
      if (snapshot.revision !== images.revision) {
        setLoading(true)
        setRetry((n) => n + 1)
        setNotice(
          'Publish ကတ် ပြောင်းထားလို့ QR ဖိတ်စာကို အသစ်ပြင်ဆင်ပေးနေပါတယ်။ ပြီးရင် Download ပြန်နှိပ်ပေးပါ။',
        )
        return
      }
      const link = document.createElement('a')
      link.href = images[kind]
      link.download = `ahmattaya-${kind}-${id}.png`
      document.body.append(link)
      link.click()
      link.remove()
    } catch {
      if (alive.current)
        setError(
          'Link ပိတ်ထားတာ သို့မဟုတ် ချိတ်ဆက်မှုမရတာ ဖြစ်နိုင်လို့ Download မလုပ်ထားပါ။ Publish link ကို ပြန်စစ်ပေးပါ။',
        )
    } finally {
      running.current = false
      if (alive.current) setChecking(false)
    }
  }
  return (
    <div className="qr-invitation">
      <h4>QR ဖိတ်စာ</h4>
      <p className="field-hint">
        ဖိတ်စာပုံကို ပို့ပေးနိုင်သလို ပုံနှိပ်ပြီးလည်း သုံးနိုင်ပါတယ်။ Scan
        လုပ်ရင် Publish လုပ်ထားတဲ့ကတ် ဖွင့်ပေးပါမယ်။
      </p>
      {loading && <p role="status">QR ဖိတ်စာ ပြင်ဆင်နေပါတယ်…</p>}
      {!loading && images && (
        <>
          <img
            className="qr-ticket-preview"
            src={images.ticket}
            width={1080}
            height={1440}
            alt="Published ကတ်ကို ဖွင့်နိုင်တဲ့ QR ဖိတ်စာ နမူနာ"
          />
          <div className="publish-actions">
            <button
              className="button secondary"
              disabled={disabled || checking}
              onClick={() => void download('ticket')}
            >
              <Download size={14} /> ဖိတ်စာ PNG
            </button>
            <button
              className="button secondary"
              disabled={disabled || checking}
              onClick={() => void download('qr')}
            >
              <Download size={14} /> QR PNG
            </button>
          </div>
        </>
      )}
      {notice && (
        <p role="status" className="field-hint">
          {notice}
        </p>
      )}
      {checking && <p role="status">Link ကို စစ်နေပါတယ်…</p>}
      {error && (
        <p className="music-error" role="alert">
          {error}
        </p>
      )}
      {!loading && error && (
        <button
          className="button secondary"
          disabled={disabled}
          onClick={() => {
            setLoading(true)
            setRetry((n) => n + 1)
          }}
        >
          <RefreshCw size={14} /> ပြန်စမ်းမယ်
        </button>
      )}
      <p className="field-hint">
        Link ပိတ်ရင် QR ကနေ ကတ်ကို ဖွင့်မရတော့ပါ။ ဖိတ်စာပုံမှာ Publish
        လုပ်ထားတဲ့ စာသားကိုပဲ သုံးပါတယ်။
      </p>
    </div>
  )
}
