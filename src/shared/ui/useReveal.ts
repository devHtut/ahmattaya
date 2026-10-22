import { useEffect, useRef, type RefObject } from 'react'

/**
 * Adds `.is-visible` when the element scrolls into view. One-shot: once the
 * reveal has played it stays visible (no re-trigger flicker while scrolling
 * back and forth). Respects nothing else — CSS handles reduced-motion by
 * disabling the transition itself.
 */
export function useReveal<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) {
      el?.classList.add('is-visible')
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            observer.disconnect()
          }
        }
      },
      { threshold: 0.3, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}
