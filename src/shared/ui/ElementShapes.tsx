import type { ReactElement } from 'react'
import type { ElementShape } from '../models/card'

export interface ShapeDefinition {
  id: ElementShape
  label: string
  icon: string
  defaultWidth: number
  defaultRatio: number
}

export const ELEMENT_SHAPES: ShapeDefinition[] = [
  { id: 'text', label: 'စာတို (Text)', icon: '📝', defaultWidth: 42, defaultRatio: 0.38 },
  { id: 'washi-tape', label: 'Washi Tape', icon: '🏷️', defaultWidth: 32, defaultRatio: 0.28 },
  { id: 'heart', label: 'အသည်းပုံ', icon: '💖', defaultWidth: 20, defaultRatio: 1 },
  { id: 'sparkle', label: 'Sparkle', icon: '✨', defaultWidth: 18, defaultRatio: 1 },
  { id: 'star', label: 'ကြယ်ပွင့်', icon: '⭐', defaultWidth: 18, defaultRatio: 1 },
  { id: 'ribbon', label: 'ဖဲကြိုး', icon: '🎀', defaultWidth: 24, defaultRatio: 0.75 },
  { id: 'flower', label: 'ပန်းပွင့်', icon: '🌸', defaultWidth: 20, defaultRatio: 1 },
  { id: 'circle', label: 'စက်ဝိုင်း', icon: '⭕', defaultWidth: 20, defaultRatio: 1 },
  { id: 'rect', label: 'ထောင့်ဝိုင်း', icon: '🟩', defaultWidth: 26, defaultRatio: 0.6 },
  { id: 'stamp', label: 'တံဆိပ်ခေါင်း', icon: '💌', defaultWidth: 22, defaultRatio: 1.2 },
]

export interface FontOption {
  id: string
  label: string
  family: string
  isCustom?: boolean
}

export const TEXT_BACKGROUNDS = [
  { id: 'transparent', label: 'ကြည်လင် (Transparent)', color: 'transparent', border: '#94a3b8' },
  { id: 'sticky-yellow', label: 'အဝါရောင် Post-it', color: '#fef08a', border: '#fde047' },
  { id: 'sticky-pink', label: 'ပန်းရောင် Post-it', color: '#fbcfe8', border: '#f472b6' },
  { id: 'sticky-blue', label: 'မိုးပြာရောင် Post-it', color: '#bae6fd', border: '#7dd3fc' },
  { id: 'parchment', label: 'စက္ကူဟောင်း (Parchment)', color: '#fef3c7', border: '#d97706' },
  { id: 'badge-white', label: 'အဖြူရောင် Badge', color: '#ffffff', border: '#cbd5e1' },
  { id: 'mint', label: 'အစိမ်းနုရောင်', color: '#d1fae5', border: '#a7f3d0' },
  { id: 'lavender', label: 'ခရမ်းနုရောင်', color: '#ede9fe', border: '#ddd6fe' },
  { id: 'peach', label: 'မက်မွန်ရောင်', color: '#ffedd5', border: '#fed7aa' },
  { id: 'dark', label: 'အမည်းရောင် (Dark)', color: '#1e293b', border: '#334155' },
]

export const TEXT_FONTS: FontOption[] = [
  { id: 'handwriting', label: 'Handwriting', family: "'Caveat', 'Segoe Print', 'Noto Sans Myanmar', cursive" },
  { id: 'serif', label: 'Serif (Playfair / Fraunces)', family: "'Playfair Display', 'Fraunces', 'Cinzel', 'Noto Serif Myanmar', serif" },
  { id: 'sans', label: 'Sans (Padauk)', family: "'Padauk', 'Noto Sans Myanmar', sans-serif" },
  { id: 'Padauk', label: 'Padauk (ပိတောက်)', family: "'Padauk', sans-serif" },
  { id: 'Noto Sans Myanmar', label: 'Noto Sans Myanmar', family: "'Noto Sans Myanmar', sans-serif" },
  { id: 'Playfair Display', label: 'Playfair Display', family: "'Playfair Display', serif" },
  { id: 'Fraunces', label: 'Fraunces Display', family: "'Fraunces', serif" },
]

export const COLOR_PALETTE = [
  { id: 'theme', label: 'Theme အရောင်', hex: 'currentColor' },
  { id: '#f43f5e', label: 'Rose Red', hex: '#f43f5e' },
  { id: '#fb7185', label: 'Rose Pink', hex: '#fb7185' },
  { id: '#f59e0b', label: 'Warm Gold', hex: '#f59e0b' },
  { id: '#a855f7', label: 'Lavender', hex: '#a855f7' },
  { id: '#10b981', label: 'Mint', hex: '#10b981' },
  { id: '#fb923c', label: 'Peach', hex: '#fb923c' },
  { id: '#ffffff', label: 'White', hex: '#ffffff' },
  { id: '#334155', label: 'Slate', hex: '#334155' },
]

export function renderElementSvg(shape: ElementShape, color: string): ReactElement {
  const fillColor = color === 'theme' ? 'currentColor' : color

  switch (shape) {
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" fill={fillColor} className="element-svg" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )

    case 'star':
      return (
        <svg viewBox="0 0 24 24" fill={fillColor} className="element-svg" aria-hidden="true">
          <polygon points="12,1.8 15.1,8.3 22.3,9.3 17,14.4 18.3,21.6 12,18.1 5.7,21.6 7,14.4 1.7,9.3 8.9,8.3" />
        </svg>
      )

    case 'sparkle':
      return (
        <svg viewBox="0 0 24 24" fill={fillColor} className="element-svg" aria-hidden="true">
          <path d="M12 2L13.8 8.8L20.6 10.6L13.8 12.4L12 19.2L10.2 12.4L3.4 10.6L10.2 8.8Z" />
          <circle cx="18" cy="4" r="1.5" />
          <circle cx="5" cy="18" r="1.2" />
        </svg>
      )

    case 'washi-tape':
      return (
        <svg viewBox="0 0 100 28" className="element-svg washi-tape-svg" aria-hidden="true">
          <defs>
            <pattern id="washiStripe" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" />
            </pattern>
          </defs>
          {/* Jagged / torn edges on left and right */}
          <path
            d="M 4 2 
               L 96 2 
               L 99 7 L 97 12 L 99 17 L 96 22 L 98 26 
               L 4 26 
               L 2 21 L 4 16 L 1 11 L 3 6 Z"
            fill={fillColor}
            fillOpacity="0.82"
          />
          <path
            d="M 4 2 
               L 96 2 
               L 99 7 L 97 12 L 99 17 L 96 22 L 98 26 
               L 4 26 
               L 2 21 L 4 16 L 1 11 L 3 6 Z"
            fill="url(#washiStripe)"
          />
        </svg>
      )

    case 'circle':
      return (
        <svg viewBox="0 0 24 24" className="element-svg" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill={fillColor} fillOpacity="0.85" />
          <circle cx="12" cy="12" r="9.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        </svg>
      )

    case 'rect':
      return (
        <svg viewBox="0 0 24 16" className="element-svg" aria-hidden="true">
          <rect x="1" y="1" width="22" height="14" rx="4" fill={fillColor} fillOpacity="0.85" />
          <rect x="2" y="2" width="20" height="12" rx="3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        </svg>
      )

    case 'ribbon':
      return (
        <svg viewBox="0 0 24 20" fill={fillColor} className="element-svg" aria-hidden="true">
          <path d="M12 9 C10 5, 4 4, 3 8 C2 12, 9 11, 12 10 C15 11, 22 12, 21 8 C20 4, 14 5, 12 9 Z" />
          <circle cx="12" cy="9.5" r="2" fill="rgba(255,255,255,0.6)" />
          <path d="M11 11 L8 18 L11 16 L12 19 L13 16 L16 18 L13 11 Z" opacity="0.9" />
        </svg>
      )

    case 'flower':
      return (
        <svg viewBox="0 0 24 24" fill={fillColor} className="element-svg" aria-hidden="true">
          <circle cx="12" cy="6" r="3.5" />
          <circle cx="18" cy="10" r="3.5" />
          <circle cx="16" cy="17" r="3.5" />
          <circle cx="8" cy="17" r="3.5" />
          <circle cx="6" cy="10" r="3.5" />
          <circle cx="12" cy="12" r="3" fill="#fbbf24" />
        </svg>
      )

    case 'stamp':
      return (
        <svg viewBox="0 0 24 28" className="element-svg" aria-hidden="true">
          <rect x="2" y="2" width="20" height="24" rx="1" fill={fillColor} fillOpacity="0.15" stroke={fillColor} strokeWidth="1.5" strokeDasharray="2.5 1.5" />
          <rect x="4" y="4" width="16" height="20" rx="1" fill={fillColor} fillOpacity="0.75" />
          <circle cx="12" cy="14" r="4" fill="rgba(255,255,255,0.5)" />
        </svg>
      )

    default:
      return (
        <svg viewBox="0 0 24 24" fill={fillColor} className="element-svg" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}
