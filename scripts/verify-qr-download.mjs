// Read-only verification of images downloaded through the browser UI.
// Usage: node --experimental-strip-types scripts/verify-qr-download.mjs <share UUID> <PNG> [PNG...]
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'
import { receiverUrl } from '../src/shared/cloud/publishing.ts'
const [id, ...files] = process.argv.slice(2)
if (!id || !files.length)
  throw new Error('Provide a published share UUID and downloaded PNG paths')
const expected = receiverUrl(id)
for (const file of files) {
  const png = PNG.sync.read(await readFile(file))
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
  assert.equal(
    decoded?.data,
    expected,
    'Downloaded QR must point to the exact receiver URL',
  )
  console.log(
    `PASS: ${png.width}×${png.height} PNG decodes to the expected receiver link`,
  )
}
