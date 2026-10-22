import { useEffect, useState } from 'react'
import { Link, Route, Routes, useParams } from 'react-router-dom'
import { getReceiverClient } from '../../shared/cloud/client'
import {
  downloadPublishedMedia,
  loadPublishedCard,
} from '../../shared/cloud/publishing'
import {
  MediaDeliveryContext,
  type DeliveredMedia,
} from '../../shared/media/MediaDeliveryContext'
import { PreviewPage } from './PreviewPage'

type Snapshot = Awaited<ReturnType<typeof loadPublishedCard>>
function Unavailable({ retry }: { retry?: () => void }) {
  return (
    <main id="main-content" className="empty-page">
      <h1>ကတ်လေးကို ဖွင့်မရသေးပါ</h1>
      <p>
        {retry
          ? 'Internet ချိတ်ဆက်မှုကို စစ်ပြီး ပြန်ကြိုးစားပါ။'
          : 'Link မှားနေတာ သို့မဟုတ် ပေးပို့သူက link ကို ပိတ်ထားတာ ဖြစ်နိုင်ပါတယ်။'}
      </p>
      {retry && (
        <button className="button primary" onClick={retry}>
          ပြန်ကြိုးစားမယ်
        </button>
      )}
      <Link className="button secondary" to="/">
        အမှတ်တရ သို့
      </Link>
    </main>
  )
}
function PublishedCardPage() {
  const { publicId = '' } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{
    id: string
    card?: Snapshot
    error?: 'missing' | 'network'
  }>({ id: '' })
  const [media, setMedia] = useState<DeliveredMedia>({})
  useEffect(() => {
    const controller = new AbortController(),
      urls: string[] = []
    let cancelled = false
    async function load() {
      try {
        const client = await getReceiverClient()
        const snapshot = await loadPublishedCard(
          client,
          publicId,
          controller.signal,
        )
        if (cancelled) return
        setMedia({})
        setState({ id: publicId, card: snapshot })
        // Memory-only URLs: no editor guest session or IndexedDB is consulted.
        for (const asset of [...snapshot.media].sort((a, b) =>
          a.kind === b.kind ? 0 : a.kind === 'image' ? -1 : 1,
        )) {
          if (cancelled) return
          const key = asset.kind + ':' + asset.id
          try {
            const blob = await downloadPublishedMedia(
              client,
              publicId,
              asset,
              controller.signal,
            )
            if (cancelled) return
            const url = URL.createObjectURL(blob)
            urls.push(url)
            setMedia((current) => ({ ...current, [key]: { url } }))
          } catch {
            if (!cancelled)
              setMedia((current) => ({ ...current, [key]: { failed: true } }))
          }
        }
      } catch (error) {
        if (!cancelled)
          setState({
            id: publicId,
            error:
              error &&
              typeof error === 'object' &&
              'code' in error &&
              error.code === 'publication-missing'
                ? 'missing'
                : 'network',
          })
      }
    }
    void load()
    return () => {
      cancelled = true
      controller.abort()
      for (const url of urls) URL.revokeObjectURL(url)
    }
  }, [publicId, attempt])
  if (state.id !== publicId || (!state.card && !state.error))
    return (
      <main id="main-content" className="empty-page" role="status">
        <p>သင့်အတွက် ကတ်လေးကို ဖွင့်နေပါတယ်…</p>
      </main>
    )
  if (!state.card)
    return (
      <Unavailable
        retry={
          state.error === 'network'
            ? () => {
                setState({ id: '' })
                setAttempt((n) => n + 1)
              }
            : undefined
        }
      />
    )
  return (
    <MediaDeliveryContext.Provider value={media}>
      <PreviewPage
        key={publicId + ':' + attempt}
        card={state.card.card}
        cardId={publicId}
        published
      />
    </MediaDeliveryContext.Provider>
  )
}
export default function ReceiverRoutes() {
  return (
    <Routes>
      <Route path="/r/:publicId" element={<PublishedCardPage />} />
      <Route path="*" element={<Unavailable />} />
    </Routes>
  )
}
