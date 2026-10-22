import { createContext } from 'react'
export type DeliveredMedia = Record<string, { url?: string; failed?: boolean }>
// A present context means receiver delivery; never fall back to private cache.
export const MediaDeliveryContext = createContext<DeliveredMedia | undefined>(
  undefined,
)
