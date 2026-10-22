import { MediaDeliveryContext } from './MediaDeliveryContext'
import { useContext, useEffect, useState } from 'react'
import { loadImageAsset } from './image-assets'
export function useImageAsset(assetId: string | undefined) {
  const delivery = useContext(MediaDeliveryContext)
  const [state, setState] = useState<{
    id?: string
    url?: string
    failed?: boolean
  }>({})
  useEffect(() => {
    if (!assetId || delivery) return
    let cancelled = false
    let url: string | undefined
    loadImageAsset(assetId)
      .then((blob) => {
        if (cancelled) return
        if (!blob) {
          setState({ id: assetId, failed: true })
          return
        }
        url = URL.createObjectURL(blob)
        setState({ id: assetId, url })
      })
      .catch(() => {
        if (!cancelled) setState({ id: assetId, failed: true })
      })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [assetId, delivery])
  if (delivery) return { id: assetId, ...delivery['image:' + assetId] }
  return state.id === assetId ? state : {}
}
