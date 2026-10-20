import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { TemplatesPage } from '../features/templates/TemplatesPage'
import { HomePage } from '../features/home/HomePage'
import { CreatorPage } from '../features/creator/CreatorPage'
import { PreviewPage } from '../features/receiver/PreviewPage'
import { ProjectsPage } from '../features/projects/ProjectsPage'
import { EditorToolbar } from '../features/projects/EditorToolbar'
import { useCreatorDraft } from '../features/creator/hooks/useCreatorDraft'

export default function App() {
  const workspace = useCreatorDraft()
  const { card, onChange, saveStatus, retrySave } = workspace
  const editor = useLocation().pathname === '/create'
  return (
    <>
      <a className="skip-link" href="#main-content">
        အကြောင်းအရာသို့ သွားရန်
      </a>
      <div hidden={editor}>
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
              <Link to="/projects">Project များ</Link>
              <Link to="/templates">Templates</Link>
              <Link className="button primary" to="/templates">
                စဖန်တီးမယ် <span aria-hidden="true">↗</span>
              </Link>
            </nav>
          </div>
        </header>
      </div>
      {editor && (
        <EditorToolbar key={workspace.project.id} workspace={workspace} />
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/templates"
          element={<TemplatesPage workspace={workspace} />}
        />
        <Route
          path="/create"
          element={
            <CreatorPage
              key={workspace.project.id}
              card={card}
              onChange={onChange}
              saveStatus={saveStatus}
              onRetrySave={retrySave}
            />
          }
        />
        <Route
          path="/projects"
          element={<ProjectsPage workspace={workspace} />}
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
