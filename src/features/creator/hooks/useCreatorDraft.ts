import { useState } from 'react'
import {
  createTemplateCard,
  templateCatalog,
} from '../../../shared/templates/catalog'
import {
  cardSchema,
  type CardConfig,
  type Occasion,
} from '../../../shared/models/card'
import { createCard } from '../../../shared/templates/templates'
import { browserDraftStorage } from '../lib/draft-storage'
import {
  loadProjects,
  saveProjects,
  type Library,
  type Project,
} from '../../projects/project-storage'

type SaveStatus = 'idle' | 'saved' | 'error' | 'blocked'
function makeProject(
  card = createCard('birthday'),
  name = 'အမှတ်တရ အသစ်',
): Project {
  return {
    id: crypto.randomUUID(),
    name,
    updatedAt: new Date().toISOString(),
    deleted: false,
    card,
  }
}
function initialize() {
  const loaded = loadProjects(browserDraftStorage)
  const project = makeProject()
  return {
    library:
      loaded.status === 'restored'
        ? loaded.library
        : { version: 1 as const, activeId: project.id, projects: [project] },
    saveStatus: (loaded.status === 'invalid'
      ? 'blocked'
      : loaded.status === 'unavailable'
        ? 'error'
        : loaded.status === 'restored'
          ? 'saved'
          : 'idle') as SaveStatus,
    past: [] as CardConfig[],
    future: [] as CardConfig[],
  }
}
export function useCreatorDraft() {
  const [state, setState] = useState(initialize)
  const active = state.library.projects.find(
    (p) => p.id === state.library.activeId,
  )!
  const persist = (
    library: Library,
    past = state.past,
    future = state.future,
  ) => {
    const saveStatus =
      state.saveStatus === 'blocked'
        ? 'blocked'
        : saveProjects(browserDraftStorage, library)
          ? 'saved'
          : 'error'
    setState({ library, saveStatus, past, future })
  }
  const update = (project: Project, past = state.past, future = state.future) =>
    persist(
      {
        ...state.library,
        projects: state.library.projects.map((p) =>
          p.id === project.id ? project : p,
        ),
      },
      past,
      future,
    )
  const onChange = (card: CardConfig) => {
    const parsed = cardSchema.safeParse(card)
    if (!parsed.success) return
    update(
      { ...active, card: parsed.data, updatedAt: new Date().toISOString() },
      [...state.past.slice(-9), active.card],
      [],
    )
  }
  return {
    card: active.card,
    project: active,
    projects: state.library.projects,
    saveStatus: state.saveStatus,
    onChange,
    retrySave: () =>
      setState({
        ...state,
        saveStatus: saveProjects(browserDraftStorage, state.library)
          ? 'saved'
          : 'error',
      }),
    rename: (name: string) => {
      if (name.trim())
        update({
          ...active,
          name: name.trim().slice(0, 100),
          updatedAt: new Date().toISOString(),
        })
    },
    create: (occasion: Occasion = 'birthday') => {
      const project = makeProject(createCard(occasion))
      persist(
        {
          ...state.library,
          activeId: project.id,
          projects: [...state.library.projects, project],
        },
        [],
        [],
      )
    },
    createFromTemplate: (id: string) => {
      const card = createTemplateCard(id)
      const template = templateCatalog.find((item) => item.id === id)
      if (!card || !template) return false
      const project = makeProject(card, template.name)
      persist(
        {
          ...state.library,
          activeId: project.id,
          projects: [...state.library.projects, project],
        },
        [],
        [],
      )
      return true
    },
    open: (id: string) => {
      if (state.library.projects.some((p) => p.id === id && !p.deleted))
        persist({ ...state.library, activeId: id }, [], [])
    },
    duplicate: (id = active.id) => {
      const source = state.library.projects.find((p) => p.id === id)
      if (!source) return
      const copy = makeProject(
        structuredClone(source.card),
        `${source.name.slice(0, 90)} · မိတ္တူ`,
      )
      persist(
        {
          ...state.library,
          activeId: copy.id,
          projects: [...state.library.projects, copy],
        },
        [],
        [],
      )
    },
    trash: (id: string, deleted: boolean) => {
      let projects = state.library.projects.map((p) =>
        p.id === id ? { ...p, deleted } : p,
      )
      let activeId = state.library.activeId
      if (!projects.some((p) => p.id === activeId && !p.deleted)) {
        let next = projects.find((p) => !p.deleted)
        if (!next) {
          next = makeProject()
          projects = [...projects, next]
        }
        activeId = next.id
      }
      persist({ ...state.library, projects, activeId }, [], [])
    },
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undo: () => {
      const card = state.past.at(-1)
      if (card)
        update(
          { ...active, card, updatedAt: new Date().toISOString() },
          state.past.slice(0, -1),
          [active.card, ...state.future],
        )
    },
    redo: () => {
      const card = state.future[0]
      if (card)
        update(
          { ...active, card, updatedAt: new Date().toISOString() },
          [...state.past, active.card],
          state.future.slice(1),
        )
    },
  }
}
export type ProjectWorkspace = ReturnType<typeof useCreatorDraft>
