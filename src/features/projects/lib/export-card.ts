import type { CardConfig } from '../../../shared/models/card'
import { cardSchema } from '../../../shared/models/card'
import type { Project } from '../project-storage'

export interface CardBackupPayload {
  app: 'AhMatTaYa'
  version: 1
  exportedAt: string
  project: {
    name: string
    card: CardConfig
  }
}

/**
 * Downloads the current card project as an offline .json backup file
 */
export function downloadProjectJson(project: Project) {
  const payload: CardBackupPayload = {
    app: 'AhMatTaYa',
    version: 1,
    exportedAt: new Date().toISOString(),
    project: {
      name: project.name,
      card: project.card,
    },
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const safeName = (project.name || 'ahmattaya-card')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  const a = document.createElement('a')
  a.href = url
  a.download = `${safeName || 'card-backup'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Validates and extracts card project data from an imported JSON backup file
 */
export function parseProjectBackup(rawText: string): {
  name: string
  card: CardConfig
} {
  const parsed = JSON.parse(rawText) as Record<string, unknown>
  const rawProject =
    (parsed.project as Record<string, unknown> | undefined) ?? parsed

  const name =
    typeof rawProject.name === 'string' && rawProject.name.trim()
      ? rawProject.name.trim().slice(0, 100)
      : 'Imported Card'

  const rawCard = rawProject.card ?? rawProject
  const card = cardSchema.parse(rawCard)

  return { name, card }
}

/**
 * Exports the card cover or page to a high-resolution PNG image
 */
export async function downloadCardImage(
  card: CardConfig,
  pageId: string = 'cover',
  title = 'card-image',
) {
  const width = 1280
  const height = 800
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const { colors } = card.appearance
  const page = card.pages.find((p) => p.id === pageId)
  const isCover = !page
  const heading = { ...card.appearance.heading, ...(page?.heading ?? {}) }
  const body = { ...card.appearance.body, ...(page?.body ?? {}) }

  // Background
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, colors.surface)
  gradient.addColorStop(1, colors.background)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Border frame
  ctx.strokeStyle = colors.accent
  ctx.lineWidth = 12
  ctx.strokeRect(30, 30, width - 60, height - 60)

  // Font loading attempt
  try {
    await document.fonts.load('bold 48px "Noto Sans Myanmar"')
    await document.fonts.load('28px "Noto Sans Myanmar"')
  } catch {
    // Continue with system fallbacks
  }

  // Header text
  ctx.fillStyle = colors.text
  ctx.textAlign = heading.align === 'center' ? 'center' : 'left'
  const textX = heading.align === 'center' ? width / 2 : 80

  const mainTitle = (page ? page.title?.trim() : card.title?.trim()) || ''
  if (mainTitle) {
    ctx.font = `bold ${Math.round(heading.size * 1.5)}px "Noto Sans Myanmar", sans-serif`
    ctx.fillText(mainTitle, textX, 130)
  }

  // Subtext / Receiver
  if (isCover && card.receiverName) {
    ctx.font = '28px "Noto Sans Myanmar", sans-serif'
    ctx.fillStyle = colors.accent
    ctx.fillText(`${card.receiverName} အတွက် အမှတ်တရ`, textX, 180)
  }

  // Body message
  const message = (page ? page.message?.trim() : card.message?.trim()) || ''
  if (message) {
    ctx.fillStyle = colors.text
    ctx.font = `${Math.round(body.size * 1.4)}px "Noto Sans Myanmar", sans-serif`
    const lines = message.split('\n').slice(0, 8)
    let y = mainTitle ? 240 : 160
    for (const line of lines) {
      ctx.fillText(line, textX, y)
      y += Math.round(body.size * 2)
    }
  }

  // Sender footer
  if (isCover && card.senderName) {
    ctx.font = 'bold 26px "Noto Sans Myanmar", sans-serif'
    ctx.fillStyle = colors.accent
    ctx.textAlign = 'right'
    ctx.fillText(`— ${card.senderName}`, width - 80, height - 70)
  }

  // Brand tag
  ctx.font = '20px "Noto Sans Myanmar", sans-serif'
  ctx.fillStyle = colors.accent
  ctx.textAlign = 'left'
  ctx.fillText('အမှတ်တရ · AhMatTaYa', 80, height - 70)

  // Convert to PNG and download
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Image generation failed'))
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.toLowerCase().replace(/[^a-z0-9_-]+/gi, '-')}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}

/**
 * Triggers native Print / Save as PDF
 */
export function printCard() {
  window.print()
}
