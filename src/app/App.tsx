import { lazy, Suspense } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { HomePage } from '../features/home/HomePage'
import { TemplatesPage } from '../features/templates/TemplatesPage'
import { CreatorPage } from '../features/creator/CreatorPage'
import { PreviewPage } from '../features/receiver/PreviewPage'
import { ProjectsPage } from '../features/projects/ProjectsPage'
import { EditorToolbar } from '../features/projects/EditorToolbar'
import { useCreatorDraft } from '../features/creator/hooks/useCreatorDraft'

const ReceiverRoutes = lazy(
  () => import('../features/receiver/PublishedCardPage'),
)
export default function App() {
  const { pathname } = useLocation()
  if (pathname === '/r' || pathname.startsWith('/r/'))
    return (
      <Suspense
        fallback={
          <main id="main-content" className="empty-page" role="status">
            ကတ်လေးကို ဖွင့်နေပါတယ်…
          </main>
        }
      >
        <ReceiverRoutes />
      </Suspense>
    )
  return <EditorApp />
}
function EditorApp() {
  const workspace = useCreatorDraft()
  const { card, onChange, saveStatus, retrySave } = workspace
  const location = useLocation()
  const isReceiver = location.pathname === '/preview'

  return (
    <>
      <a className="skip-link" href="#main-content">
        အကြောင်းအရာသို့ သွားရန်
      </a>
      {!isReceiver &&
        (workspace.hasActiveProject ? (
          <EditorToolbar key={workspace.project.id} workspace={workspace} />
        ) : (
          <header className="atelier-bar">
            <Link to="/">အမှတ်တရ</Link>
            <Link to="/templates" className="button primary">
              ကတ်အသစ်
            </Link>
            <Link to="/projects" className="button secondary">
              ကတ်များ
            </Link>
          </header>
        ))}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/create"
          element={
            !workspace.hasActiveProject ? (
              <Navigate to="/projects" replace />
            ) : (
              <CreatorPage
                key={workspace.project.id}
                workspace={workspace}
                card={card}
                onChange={onChange}
                saveStatus={saveStatus}
                onRetrySave={retrySave}
              />
            )
          }
        />
        <Route
          path="/templates"
          element={<TemplatesPage workspace={workspace} />}
        />
        <Route
          path="/projects"
          element={<ProjectsPage workspace={workspace} />}
        />
        <Route
          path="/preview"
          element={
            workspace.hasActiveProject ? (
              <PreviewPage card={card} />
            ) : (
              <Navigate to="/projects" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            <main id="main-content" className="empty-page">
              <h1>စာမျက်နှာ မတွေ့ပါ</h1>
              <Link className="button primary" to="/">
                ပြန်သွားမယ်
              </Link>
            </main>
          }
        />
      </Routes>
    </>
  )
}
