import type { CardConfig } from '../../../shared/models/card'
import { drawQr, invitationMatrix, wrapTicketText } from './qr-code'
function canvas(width: number, height: number) {
  const result = document.createElement('canvas')
  result.width = width
  result.height = height
  const ctx = result.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  return { canvas: result, ctx }
}
function png(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG unavailable'))),
      'image/png',
    ),
  )
}
export async function renderInvitation(id: string, card: CardConfig) {
  const matrix = invitationMatrix(id)
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(
          '500 48px "Noto Sans Myanmar"',
          card.title + 'သင့်အတွက် အမှတ်တရ',
        ),
        document.fonts.load(
          '600 52px "Noto Sans Myanmar"',
          card.title + card.receiverName,
        ),
      ]),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Font unavailable')), 8000)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
  const qr = canvas(630, 630)
  qr.ctx.fillStyle = '#ffffff'
  qr.ctx.fillRect(0, 0, 630, 630)
  const qrSize =
    (matrix.size + matrix.margin * 2) *
    Math.floor(630 / (matrix.size + matrix.margin * 2))
  drawQr(
    qr.ctx,
    matrix,
    Math.floor((630 - qrSize) / 2),
    Math.floor((630 - qrSize) / 2),
    630,
  )
  // Integer QR modules and a full white quiet zone remain untouched by styling.
  const { canvas: ticket, ctx } = canvas(1080, 1440)
  const accent = card.appearance.colors.accent
  ctx.fillStyle = '#f4ecdc'
  ctx.fillRect(0, 0, 1080, 1440)
  ctx.fillStyle = '#fffdf7'
  ctx.beginPath()
  ctx.roundRect(54, 54, 972, 1332, 36)
  ctx.fill()
  ctx.strokeStyle = accent
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(108, 112)
  ctx.lineTo(972, 112)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#7c6d57'
  ctx.font = '500 24px "Noto Sans Myanmar", sans-serif'
  ctx.fillText('အမှတ်တရ · AhMatTaYa', 540, 178)
  ctx.fillStyle = '#332a1d'
  ctx.font = '600 36px "Noto Sans Myanmar", sans-serif'
  const receiver = wrapTicketText(
    card.receiverName ? `${card.receiverName} အတွက်` : 'သင့်အတွက် အမှတ်တရလေး',
    (text) => ctx.measureText(text).width,
    820,
    2,
  )
  receiver.forEach((line, index) => ctx.fillText(line, 540, 266 + index * 58))
  ctx.font = '600 52px "Noto Sans Myanmar", sans-serif'
  const title = wrapTicketText(
    card.title || card.opening.title,
    (text) => ctx.measureText(text).width,
    820,
    3,
  )
  title.forEach((line, index) => ctx.fillText(line, 540, 395 + index * 78))
  const qrWidth =
    (matrix.size + matrix.margin * 2) *
    Math.floor(630 / (matrix.size + matrix.margin * 2))
  drawQr(ctx, matrix, Math.round((1080 - qrWidth) / 2), 600, 630)
  ctx.fillStyle = '#332a1d'
  ctx.font = '500 27px "Noto Sans Myanmar", sans-serif'
  ctx.fillText('QR ကို Scan လုပ်ပြီး ကတ်လေး ဖွင့်ကြည့်ပါ', 540, 1280)
  ctx.fillStyle = '#7c6d57'
  ctx.font = '400 24px "Noto Sans Myanmar", sans-serif'
  const sender = wrapTicketText(
    card.senderName
      ? `ချစ်ခြင်းများစွာဖြင့် · ${card.senderName}`
      : 'ချစ်ခြင်းတွေနဲ့ ဖန်တီးထားတဲ့ အမှတ်တရလေး',
    (text) => ctx.measureText(text).width,
    820,
    1,
  )
  ctx.fillText(sender[0] ?? '', 540, 1340)
  return {
    ticket: await png(ticket),
    qr: await png(qr.canvas),
    url: matrix.url,
  }
}
