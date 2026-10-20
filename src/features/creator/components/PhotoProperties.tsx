import type { CardConfig, PhotoFrame } from '../../../shared/models/card'
import { constrainFrame } from '../../../shared/lib/photo-geometry'
import { moveItem } from '../lib/pages'

export function PhotoProperties({
  card,
  photoId,
  onChange,
  onSelect,
}: {
  card: CardConfig
  photoId: string
  onChange: (card: CardConfig) => void
  onSelect: (id: string | null) => void
}) {
  const photo = card.photos.find((item) => item.id === photoId)!
  const pagePhotos = card.photos.filter((item) => item.pageId === photo.pageId)
  const index = pagePhotos.findIndex((item) => item.id === photoId)
  const update = (change: Partial<PhotoFrame>) =>
    onChange({
      ...card,
      photos: card.photos.map((item) =>
        item.id === photoId
          ? { ...item, frame: constrainFrame({ ...item.frame, ...change }) }
          : item,
      ),
    })
  function layer(direction: -1 | 1) {
    const target = pagePhotos[index + direction]
    if (!target) return
    onChange({
      ...card,
      photos: moveItem(
        card.photos,
        card.photos.findIndex((item) => item.id === photoId),
        card.photos.findIndex((item) => item.id === target.id),
      ),
    })
  }
  return (
    <fieldset className="photo-properties">
      <legend>ရွေးထားတဲ့ပုံ ပြင်မယ်</legend>
      <div className="fields">
        <label>
          ပုံ စာတန်း
          <input
            maxLength={120}
            value={photo.caption}
            onChange={(e) =>
              onChange({
                ...card,
                photos: card.photos.map((item) =>
                  item.id === photoId
                    ? { ...item, caption: e.target.value }
                    : item,
                ),
              })
            }
          />
        </label>
        <label>
          ပုံအရွယ် — {Math.round(photo.frame.width)}%
          <input
            type="range"
            min={10}
            max={85}
            step={1}
            value={photo.frame.width}
            onChange={(e) => update({ width: Number(e.target.value) })}
          />
        </label>
        <label>
          စောင်းမှု — {Math.round(photo.frame.rotation)}°
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={photo.frame.rotation}
            onChange={(e) => update({ rotation: Number(e.target.value) })}
          />
        </label>
        <div className="photo-position-fields">
          <label>
            ဘယ် / ညာ — {Math.round(photo.frame.x)}%
            <input
              type="range"
              min={0}
              max={100}
              value={photo.frame.x}
              onChange={(e) => update({ x: Number(e.target.value) })}
            />
          </label>
          <label>
            အပေါ် / အောက် — {Math.round(photo.frame.y)}%
            <input
              type="range"
              min={0}
              max={100}
              value={photo.frame.y}
              onChange={(e) => update({ y: Number(e.target.value) })}
            />
          </label>
        </div>
        <label className="shadow-toggle">
          <input
            type="checkbox"
            checked={photo.frame.shadow}
            onChange={(e) => update({ shadow: e.target.checked })}
          />{' '}
          Shadow ထည့်မယ်
        </label>
        <div className="item-actions">
          <button disabled={index === 0} onClick={() => layer(-1)}>
            နောက်ပို့မယ်
          </button>
          <button
            disabled={index === pagePhotos.length - 1}
            onClick={() => layer(1)}
          >
            ရှေ့တင်မယ်
          </button>
          <button onClick={() => update({ x: 50, y: 50, rotation: 0 })}>
            အလယ်တည့်မယ်
          </button>
          <button
            className="danger"
            onClick={() => {
              onChange({
                ...card,
                photos: card.photos.filter((item) => item.id !== photoId),
              })
              onSelect(null)
            }}
          >
            ပုံဖျက်မယ်
          </button>
        </div>
        <p className="field-hint">
          ပုံအစွန်းတွေ စာမျက်နှာအပြင် မထွက်အောင် ထိန်းထားပါတယ်။ အပေါ်က
          ပုံစာရင်းမှာ နှိပ်ပြီး ဖုံးနေတဲ့ပုံကို ရွေးနိုင်ပါတယ်။
        </p>
      </div>
    </fieldset>
  )
}
