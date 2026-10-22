import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react'
import { occasions, createCard } from '../../shared/templates/templates'
import { CardPreview } from '../../shared/ui/CardPreview'

export function HomePage() {
  const demoCard = {
    ...createCard('birthday'),
    receiverName: 'ချစ်ရတဲ့ သီရိရေ',
    message:
      'ပျော်ရွှင်မှုတွေနဲ့ ပြည့်နေတဲ့ မွေးနေ့လေး ဖြစ်ပါစေ။ လိုရာဆန္ဒတွေလည်း ပြည့်ဝပါစေနော်။',
    senderName: 'မောင်မောင်',
  }

  return (
    <main id="main-content" className="foyer">
      <section className="foyer-lead page-width">
        <div className="foyer-copy">
          <span className="pill">
            <Sparkles size={14} /> ကိုယ်ပိုင် ဒီဇိုင်းနဲ့ ကတ်ဖန်တီးရုံ
          </span>
          <h1>
            ရင်ထဲက စကားလေးတွေကို
            <br />
            <em>အမှတ်တရ</em> ဖြစ်အောင် လုပ်ပါ။
          </h1>
          <p>
            ချစ်ရသူတွေအတွက် မွေးနေ့ဆုတောင်း၊ မင်္ဂလာဖိတ်စာနဲ့
            အထူးအခိုက်အတန့်လေးတွေကို ကိုယ်ပိုင်ပုံစံနဲ့ ဖန်တီးလိုက်ပါ။ ကြေး
            ကောက်စရာမလို — သင်ပဲ ဒီဇိုင်နာပါ။
          </p>
          <div className="foyer-actions">
            <Link className="button primary" to="/create">
              ကတ်စဖန်တီးမယ် <ArrowRight size={16} />
            </Link>
            <Link className="button secondary" to="/templates">
              နမူနာများ ကြည့်မယ်
            </Link>
          </div>
          <p className="foyer-note">
            အခမဲ့ · ဒီ browser ထဲမှာ သိမ်းပါမယ် · မြန်မာနဲ့ English
          </p>
        </div>

        <div className="foyer-table" aria-hidden="true">
          <span className="table-prop prop-tape" />
          <span className="table-prop prop-tape two" />
          <span className="table-prop prop-note">
            ချစ်ရသူအတွက်၊ စိတ်တိုင်းကျ ✨
          </span>
          <span className="table-prop prop-seal">A</span>
          <CardPreview card={demoCard} />
        </div>
      </section>

      <section className="page-width">
        <div className="craft-strip">
          <div className="craft-item">
            <span className="craft-num">၁</span>
            <h3>နမူနာ ရွေးပါ</h3>
            <p>အသင့်ပုံစံတစ်ခုကနေ စတင်ပါ၊ ဒါမှမဟုတ် ဗလာစာမျက်နှာနဲ့ စပါ။</p>
          </div>
          <div className="craft-item">
            <span className="craft-num">၂</span>
            <h3>ကိုယ့်စကား ရေးပါ</h3>
            <p>
              အမည်၊ ခေါင်းစဉ်၊ စကားလေးတွေ၊ ပုံတွေ၊ သီချင်းနဲ့ ကိတ်မုန့်ကိတ်မုန့်
              ထည့်ပါ။
            </p>
          </div>
          <div className="craft-item">
            <span className="craft-num">၃</span>
            <h3>ချစ်ရသူဆီ ပို့ပါ</h3>
            <p>ဖိတ်စာကို ဖွင့်ကြည့်ပြီး၊ မျှဝေဖို့ link လေးကို ကော်ပီပါ။</p>
          </div>
        </div>
      </section>

      <section className="occasion-section page-width">
        <span className="eyebrow">ဘယ်အမှတ်တရလေးလဲ</span>
        <h2>ဖန်တီးချင်တဲ့ အခမ်းအနား ရွေးပါ</h2>
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
                စဖန်တီးမယ် <ArrowUpRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="page-width">
        <span>အမှတ်တရ ဖြစ်စေမယ့် အရာလေးတွေ၊ ချစ်ခြင်းနဲ့ ဖန်တီးပါ။</span>
        <span>AhMatTaYa · Atelier</span>
      </footer>
    </main>
  )
}
