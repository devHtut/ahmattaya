import { lazy, Suspense } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { FolderKanban, LayoutTemplate, Pencil, Plus } from 'lucide-react'
import { HomePage } from '../features/home/HomePage'
import { TemplatesPage } from '../features/templates/TemplatesPage'
import { CreatorPage } from '../features/creator/CreatorPage'
import { PreviewPage } from '../features/receiver/PreviewPage'
import { ProjectsPage } from '../features/projects/ProjectsPage'
import { EditorToolbar } from '../features/projects/EditorToolbar'
import { useCreatorDraft } from '../features/creator/hooks/useCreatorDraft'
import { CloudSyncButton } from '../features/publishing/CloudSyncButton'

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
  const isEditor = location.pathname === '/create'

  return (
    <>
      <a className="skip-link" href="#main-content">
        အကြောင်းအရာသို့ သွားရန်
      </a>
      {!isReceiver &&
        (isEditor && workspace.hasActiveProject ? (
          <EditorToolbar key={workspace.project.id} workspace={workspace} />
        ) : (
          <header className="atelier-bar">
            <Link to="/" className="atelier-brand" aria-label="အမှတ်တရ - AhMatTaYa">
              <img
                src="/logo.png"
                alt="အမှတ်တရ"
                className="atelier-logo-img"
              />
            </Link>

            <div className="bar-actions" style={{ marginLeft: 'auto' }}>
              <Link
                to="/templates"
                className={`bar-link ${location.pathname === '/templates' ? 'active' : ''}`}
                title="Templates"
              >
                <LayoutTemplate size={16} />
                <span>နမူနာ</span>
              </Link>
              <Link
                to="/projects"
                className={`bar-link ${location.pathname === '/projects' ? 'active' : ''}`}
                title="ကတ်များ"
              >
                <FolderKanban size={16} />
                <span>ကတ်များ</span>
              </Link>
              <CloudSyncButton workspace={workspace} />
              {workspace.hasActiveProject ? (
                <Link
                  to="/create"
                  className="button primary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="လက်ရှိ ပြင်ဆင်နေသော ကတ်သို့ သွားရန်"
                >
                  <Pencil size={13} />
                  <span>ကတ် ဆက်ပြင်မယ်</span>
                </Link>
              ) : (
                <Link
                  to="/templates"
                  className="button primary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={14} />
                  <span>ကတ်အသစ် ဖန်တီးမယ်</span>
                </Link>
              )}
            </div>
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
              <PreviewPage card={card} cardId={workspace.project.id} />
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
