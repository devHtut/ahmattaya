import { Link } from 'react-router-dom'
import type { CardConfig } from '../../shared/models/card'
import { findMusicTrack } from '../../shared/audio/tracks'
import { MusicPlayer } from '../../shared/audio/MusicPlayer'
import { CardPreview } from '../../shared/ui/CardPreview'
export function PreviewPage({ card }: { card: CardConfig }) {
  const track = findMusicTrack(card.music.trackId)
  return (
    <main id="main-content" className="receiver-preview page-width">
      <p className="pill">နမူနာသာ ဖြစ်ပါတယ် · Publish မလုပ်ရသေးပါ</p>
      {track && (
        <section className="receiver-music" aria-label="နောက်ခံသံစဉ်">
          <MusicPlayer key={track.id} track={track} music={card.music} />
        </section>
      )}
      <CardPreview card={card} />
      {card.pages.map((page, index) => (
        <section
          className="receiver-card-page"
          key={page.id}
          aria-label={`စာမျက်နှာ ${index + 2}`}
        >
          <p className="page-number">
            {index + 2} / {card.pages.length + 1}
          </p>
          <CardPreview card={card} pageId={page.id} />
        </section>
      ))}
      <Link className="button secondary" to="/create">
        ပြန်ပြင်မယ်
      </Link>
    </main>
  )
}
