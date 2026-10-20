import { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { HomePage } from '../features/home/HomePage'
import { CreatorPage } from '../features/creator/CreatorPage'
import { PreviewPage } from '../features/receiver/PreviewPage'
import { createCard } from '../shared/templates/templates'

export default function App() {
  const [card, setCard] = useState(() => createCard('birthday'))
  return (
    <>
      <a className="skip-link" href="#main-content">
        အကြောင်းအရာသို့ သွားရန်
      </a>
      <header className="site-header">
        <div className="page-width header-inner">
          <Link to="/" className="brand">
            <span className="brand-icon">
              <Sparkles size={21} />
            </span>
            <span>
              အမှတ်တရ<small>AhMatTaYa</small>
            </span>
          </Link>
          <nav aria-label="အဓိက စာမျက်နှာများ">
            <Link to="/">ပင်မစာမျက်နှာ</Link>
            <Link className="button primary" to="/create">
              စဖန်တီးမယ် <span aria-hidden="true">↗</span>
            </Link>
          </nav>
        </div>
      </header>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage onSelect={(occasion) => setCard(createCard(occasion))} />
          }
        />
        <Route
          path="/create"
          element={<CreatorPage card={card} onChange={setCard} />}
        />
        <Route path="/preview" element={<PreviewPage card={card} />} />
        <Route
          path="*"
          element={
            <main id="main-content" className="empty-page">
              <h1>စာမျက်နှာ မတွေ့ပါ</h1>
              <Link className="button primary" to="/">
                ပင်မစာမျက်နှာသို့
              </Link>
            </main>
          }
        />
      </Routes>
    </>
  )
}
