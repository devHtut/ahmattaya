import type { CardConfig, CardPage } from '../../../shared/models/card'

export function moveItem<T>(
  items: readonly T[],
  from: number,
  to: number,
): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length)
    return [...items]
  const updated = [...items]
  const [item] = updated.splice(from, 1)
  updated.splice(to, 0, item)
  return updated
}
export function removePage(card: CardConfig, pageId: string): CardConfig {
  return {
    ...card,
    pages: card.pages.filter((page) => page.id !== pageId),
    photos: card.photos.filter((photo) => photo.pageId !== pageId),
  }
}
export function createPage(id: string): CardPage {
  return { id, title: '', message: '', paper: 'blank', background: null }
}
