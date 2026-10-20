import { Link } from 'react-router-dom'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { occasions, createCard } from '../../shared/templates/templates'
import { CardPreview } from '../../shared/ui/CardPreview'

export function HomePage() {
  return (
    <main id="main-content">
      <section className="hero page-width">
        <div className="hero-copy">
          <span className="pill">
            <Sparkles size={15} /> ချစ်ခြင်းတွေကို အမှတ်တရဖြစ်စေဖို့
          </span>
          <h1>
            ရင်ထဲက စကားတွေကို
            <br />
            <em>အမှတ်တရ</em> ဖန်တီးပါ။
          </h1>
          <p>
            ချစ်ရသူတွေအတွက် မွေးနေ့ဆုတောင်း၊ မင်္ဂလာဖိတ်စာနဲ့
            အထူးအခိုက်အတန့်လေးတွေကို ကိုယ်ပိုင်ပုံစံနဲ့ ဖန်တီးလိုက်ပါ။
          </p>
          <Link className="button primary" to="/templates">
            အမှတ်တရ စဖန်တီးမယ် <ArrowUpRight size={18} />
          </Link>
          <p className="small-note">
            အခမဲ့ ဖန်တီးနိုင်မယ့် နေရာလေး · မြန်မာဘာသာနဲ့ English
          </p>
        </div>
        <div className="hero-preview">
          <div className="floating-note">ချစ်ရသူအတွက်၊ စိတ်တိုင်းကျ ✨</div>
          <CardPreview
            card={{
              ...createCard('birthday'),
              receiverName: 'ချစ်ရတဲ့ သီရိရေ',
              message:
                'ပျော်ရွှင်မှုတွေနဲ့ ပြည့်နေတဲ့ မွေးနေ့လေး ဖြစ်ပါစေ။ လိုရာဆန္ဒတွေလည်း ပြည့်ဝပါစေနော်။',
              senderName: 'မောင်မောင်',
            }}
          />
        </div>
      </section>
      <section className="occasion-section page-width">
        <span className="eyebrow">EVERY OCCASION, A NEW MEMORY</span>
        <h2>ဘယ်အမှတ်တရလေး ဖန်တီးချင်လဲ?</h2>
        <p className="muted">အခမ်းအနားရွေးပြီး သင့်စကားလေးတွေနဲ့ စတင်ပါ။</p>
        <div className="occasion-grid">
          {occasions.map((item) => (
            <Link
              key={item.id}
              to={`/templates?occasion=${item.id}`}
              className="occasion-card"
            >
              <span className="occasion-icon">{item.icon}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <span className="card-link">
                စဖန်တီးမယ် <ArrowUpRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <footer className="page-width">
        အမှတ်တရ ဖြစ်စေမယ့် အရာလေးတွေ၊ ချစ်ခြင်းနဲ့ ဖန်တီးပါ။{' '}
        <span>AhMatTaYa · Foundation preview</span>
      </footer>
    </main>
  )
}
