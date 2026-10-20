import { useState } from 'react'
import {
  MAX_CANDLES,
  MAX_CREAM_STROKES,
  type CakeRecipe,
  type CreamStroke,
} from '../../../shared/models/cake'
import {
  initialCakeTools,
  type CakeActions,
  type CakeTools,
} from './editor-types'
import { constrainPoint } from './surface'

export function useCakeEditor(
  recipe: CakeRecipe,
  onChange: (recipe: CakeRecipe) => void,
) {
  const [tools, setTools] = useState<CakeTools>(initialCakeTools)
  const [redoStack, setRedoStack] = useState<CreamStroke[]>([])
  const changeRecipe = (next: CakeRecipe) => {
    if (next.strokes !== recipe.strokes) setRedoStack([])
    onChange(next)
  }
  const actions: CakeActions = {
    onSelectCandle: (id) =>
      setTools((current) => ({ ...current, selectedId: id })),
    onStroke: (stroke) => {
      if (recipe.strokes.length >= MAX_CREAM_STROKES) return
      setRedoStack([])
      onChange({ ...recipe, strokes: [...recipe.strokes, stroke] })
    },
    onAddCandle: (point) => {
      if (recipe.candles.length >= MAX_CANDLES) return
      const id = crypto.randomUUID()
      onChange({
        ...recipe,
        candles: [
          ...recipe.candles,
          {
            id,
            design: tools.candleDesign,
            digit: tools.candleDigit,
            color: tools.candleColor,
            position: constrainPoint(point),
          },
        ],
      })
      setTools((current) => ({ ...current, selectedId: id }))
    },
    onMoveCandle: (id, point) =>
      onChange({
        ...recipe,
        candles: recipe.candles.map((candle) =>
          candle.id === id
            ? { ...candle, position: constrainPoint(point) }
            : candle,
        ),
      }),
  }
  return {
    tools,
    actions,
    changeRecipe,
    changeTools: (change: Partial<CakeTools>) =>
      setTools((current) => ({ ...current, ...change })),
    canUndo: recipe.strokes.length > 0,
    canRedo: redoStack.length > 0,
    undo: () => {
      const last = recipe.strokes.at(-1)
      if (!last) return
      setRedoStack((current) => [last, ...current])
      onChange({ ...recipe, strokes: recipe.strokes.slice(0, -1) })
    },
    redo: () => {
      const first = redoStack[0]
      if (!first || recipe.strokes.length >= MAX_CREAM_STROKES) return
      setRedoStack((current) => current.slice(1))
      onChange({ ...recipe, strokes: [...recipe.strokes, first] })
    },
  }
}
export type CakeEditorSession = ReturnType<typeof useCakeEditor>
