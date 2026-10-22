import test from 'node:test'
import assert from 'node:assert/strict'
import jsQR from 'jsqr'
import {
  invitationMatrix,
  drawQr,
  wrapTicketText,
} from '../src/features/publishing/qr/qr-code.ts'
test('exported QR pixels decode to the exact canonical receiver link with a full quiet zone', () => {
  const id = '11111111-1111-4111-8111-111111111111',
    matrix = invitationMatrix(id)
  const width = 630,
    data = new Uint8ClampedArray(width * width * 4).fill(255)
  const ctx = {
    fillStyle: '',
    fillRect(x, y, w, h) {
      for (let py = y; py < y + h; py++)
        for (let px = x; px < x + w; px++) {
          const i = (py * width + px) * 4
          data[i] =
            data[i + 1] =
            data[i + 2] =
              this.fillStyle === '#000000' ? 0 : 255
          data[i + 3] = 255
        }
    },
  }
  drawQr(ctx, matrix, 0, 0, width)
  const decoded = jsQR(data, width, width)
  assert.equal(decoded.data, `https://ahmattaya.vercel.app/r/${id}`)
  const scale = Math.floor(width / (matrix.size + 8))
  for (let y = 0; y < scale * 4; y++)
    for (let x = 0; x < width; x++) assert.equal(data[(y * width + x) * 4], 255)
  assert.throws(() => invitationMatrix('../../preview'))
  assert.throws(() => drawQr(ctx, matrix, 0, 0, 5), /too small/)
})
test('long Myanmar and emoji titles wrap within bounds without splitting graphemes', () => {
  const measure = (text) =>
    [...new Intl.Segmenter('my', { granularity: 'grapheme' }).segment(text)]
      .length
  const text = 'မင်္ဂလာပါ ချစ်ရသူလေး 🎂 ချစ်ခြင်းများစွာဖြင့် အမှတ်တရ'
  const lines = wrapTicketText(text, measure, 10, 3)
  assert.ok(lines.length <= 3)
  assert.ok(lines.every((line) => measure(line) <= 10))
  assert.ok(lines.at(-1).endsWith('…'))
  assert.deepEqual(wrapTicketText('  Happy  Birthday  ', measure, 30, 3), [
    'Happy Birthday',
  ])
  assert.deepEqual(wrapTicketText('', measure, 30, 3), [])
})
