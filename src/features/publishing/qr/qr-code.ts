import QRCode from 'qrcode'
import { receiverUrl } from '../../../shared/cloud/publishing.ts'
export function invitationMatrix(publicationId: string) {
  const url = receiverUrl(publicationId)
  const { modules } = QRCode.create(url, { errorCorrectionLevel: 'M' })
  return {
    url,
    size: modules.size,
    data: Uint8Array.from(modules.data),
    margin: 4,
  }
}
export type InvitationMatrix = ReturnType<typeof invitationMatrix>
export function drawQr(
  ctx: CanvasRenderingContext2D,
  matrix: InvitationMatrix,
  x: number,
  y: number,
  available: number,
) {
  const cells = matrix.size + matrix.margin * 2,
    scale = Math.floor(available / cells)
  if (scale < 1) throw new Error('QR area too small')
  const width = cells * scale
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, width, width)
  ctx.fillStyle = '#000000'
  for (let row = 0; row < matrix.size; row++)
    for (let col = 0; col < matrix.size; col++)
      if (matrix.data[row * matrix.size + col])
        ctx.fillRect(
          x + (col + matrix.margin) * scale,
          y + (row + matrix.margin) * scale,
          scale,
          scale,
        )
  return width
}
export function wrapTicketText(
  text: string,
  measure: (text: string) => number,
  width: number,
  maxLines: number,
) {
  const units = [
    ...new Intl.Segmenter('my', { granularity: 'grapheme' }).segment(
      text.replace(/\s+/g, ' ').trim(),
    ),
  ].map((part) => part.segment)
  const lines: string[] = []
  let line = ''
  for (let i = 0; i < units.length; i++) {
    if (line && measure(line + units[i]) > width) {
      lines.push(line.trim())
      line = ''
      if (lines.length === maxLines) {
        let last = lines.at(-1) ?? ''
        while (last && measure(last + '…') > width)
          last = [
            ...new Intl.Segmenter('my', { granularity: 'grapheme' }).segment(
              last,
            ),
          ]
            .slice(0, -1)
            .map((part) => part.segment)
            .join('')
        lines[maxLines - 1] = last + '…'
        return lines
      }
    }
    line += units[i]
  }
  if (line) lines.push(line.trim())
  return lines
}
