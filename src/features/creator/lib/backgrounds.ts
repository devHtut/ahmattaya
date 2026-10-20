import type { CardConfig } from '../../../shared/models/card.ts'
import type { PageBackground } from '../../../shared/models/background.ts'
export function setPageBackground(
  card: CardConfig,
  pageId: string,
  background: PageBackground | null,
): CardConfig {
  if (pageId === 'cover') return { ...card, background }
  return {
    ...card,
    pages: card.pages.map((page) =>
      page.id === pageId ? { ...page, background } : page,
    ),
  }
}
