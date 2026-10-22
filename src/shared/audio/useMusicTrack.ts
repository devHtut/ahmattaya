import { MediaDeliveryContext } from '../media/MediaDeliveryContext'
import { useContext, useEffect, useState } from 'react'
import type { MusicConfig } from '../models/music'
import { loadAudioAsset } from '../media/audio-assets'
import { findMusicTrack } from './tracks'
export interface PlayableTrack {
  id: string
  title: string
  src: string
}
export function useMusicTrack(music: MusicConfig) {
  const delivery = useContext(MediaDeliveryContext)
  const assetId = music.trackId === 'custom' ? music.custom?.assetId : undefined
  const revision = music.custom?.revision
  const requestId = assetId ? `${assetId}:${revision ?? 0}` : undefined
  const [asset, setAsset] = useState<{
    id?: string
    url?: string
    failed?: boolean
  }>({})
  useEffect(() => {
    if (!assetId || delivery) return
    let cancelled = false
    let url: string | undefined
    loadAudioAsset(assetId)
      .then((blob) => {
        if (cancelled) return
        if (!blob) {
          setAsset({ id: requestId, failed: true })
          return
        }
        url = URL.createObjectURL(blob)
        setAsset({ id: requestId, url })
      })
      .catch(() => {
        if (!cancelled) setAsset({ id: requestId, failed: true })
      })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [assetId, requestId, delivery])
  const current = delivery
    ? (delivery['audio:' + assetId] ?? {})
    : asset.id === requestId
      ? asset
      : {}
  const custom = music.custom
  const track: PlayableTrack | undefined =
    music.trackId === 'custom'
      ? custom && current.url
        ? {
            id: `custom:${custom.assetId}`,
            title: custom.name,
            src: current.url,
          }
        : undefined
      : findMusicTrack(music.trackId)
  return {
    track,
    failed: Boolean(assetId && current.failed),
    loading: Boolean(assetId && !current.url && !current.failed),
  }
}
