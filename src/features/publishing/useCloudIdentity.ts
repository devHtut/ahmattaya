import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { cloudConfig, getCloudClient } from '../../shared/cloud/client'
import { verifiedIdentity } from '../../shared/cloud/account'
export function useCloudIdentity() {
  const [refresh, setRefresh] = useState(0)
  const [state, setState] = useState<{
    user: User | null
    loading: boolean
    failed: boolean
  }>({ user: null, loading: true, failed: false })
  useEffect(() => {
    if (cloudConfig.status !== 'configured') return
    let stopped = false,
      generation = 0,
      unsubscribe: (() => void) | undefined
    const timers = new Set<ReturnType<typeof setTimeout>>()
    getCloudClient()
      .then((client) => {
        async function verify() {
          const run = ++generation
          try {
            const user = await verifiedIdentity(client)
            if (!stopped && run === generation)
              setState({ user, loading: false, failed: false })
          } catch {
            if (!stopped && run === generation)
              setState({ user: null, loading: false, failed: true })
          }
        }
        const { data } = client.auth.onAuthStateChange(() => {
          // Auth callbacks must not await another SDK auth call under its lock.
          generation++
          const timer = setTimeout(() => {
            timers.delete(timer)
            if (!stopped) void verify()
          }, 0)
          timers.add(timer)
        })
        unsubscribe = () => data.subscription.unsubscribe()
        if (stopped) {
          unsubscribe()
          return
        }
        void verify()
      })
      .catch(() => {
        if (!stopped) setState({ user: null, loading: false, failed: true })
      })
    return () => {
      stopped = true
      generation++
      unsubscribe?.()
      for (const timer of timers) clearTimeout(timer)
    }
  }, [refresh])
  return { ...state, retry: () => setRefresh((n) => n + 1) }
}
