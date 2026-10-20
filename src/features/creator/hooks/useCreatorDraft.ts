import { useState } from 'react'
import { cardSchema, type CardConfig } from '../../../shared/models/card'
import { createCard } from '../../../shared/templates/templates'
import { browserDraftStorage, loadDraft, saveDraft } from '../lib/draft-storage'

type SaveStatus = 'idle' | 'saved' | 'error' | 'blocked'
interface DraftState {
  card: CardConfig
  saveStatus: SaveStatus
}
function initializeDraft(): DraftState {
  const loaded = loadDraft(browserDraftStorage)
  return {
    card: loaded.status === 'restored' ? loaded.card : createCard('birthday'),
    saveStatus:
      loaded.status === 'invalid'
        ? 'blocked'
        : loaded.status === 'unavailable'
          ? 'error'
          : loaded.status === 'restored'
            ? 'saved'
            : 'idle',
  }
}

export function useCreatorDraft() {
  const [draft, setDraft] = useState(initializeDraft)

  const onChange = (card: CardConfig) => {
    const validated = cardSchema.safeParse(card)
    if (!validated.success) return
    // Bounded local drafts save in the edit event so a quick reload cannot
    // discard the last change waiting in a debounce timer.
    const saveStatus =
      draft.saveStatus === 'blocked'
        ? 'blocked'
        : saveDraft(browserDraftStorage, validated.data)
          ? 'saved'
          : 'error'
    setDraft({ card: validated.data, saveStatus })
  }
  const retrySave = () => {
    const saved = saveDraft(browserDraftStorage, draft.card)
    setDraft({ ...draft, saveStatus: saved ? 'saved' : 'error' })
  }
  return { ...draft, onChange, retrySave }
}
