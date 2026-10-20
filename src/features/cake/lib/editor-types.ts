import type {
  CakeCandle,
  CakePoint,
  CreamStroke,
} from '../../../shared/models/cake'
export interface CakeTools {
  mode: 'orbit' | 'cream' | 'candles'
  brushColor: string
  brushWidth: number
  candleDesign: CakeCandle['design']
  candleColor: string
  candleDigit: number
  selectedId: string | null
}
export const initialCakeTools: CakeTools = {
  mode: 'orbit',
  brushColor: '#e8548b',
  brushWidth: 0.04,
  candleDesign: 'classic',
  candleColor: '#8b5cf6',
  candleDigit: 2,
  selectedId: null,
}
export interface CakeActions {
  onStroke: (stroke: CreamStroke) => void
  onAddCandle: (point: CakePoint) => void
  onMoveCandle: (id: string, point: CakePoint) => void
  onSelectCandle: (id: string | null) => void
}
