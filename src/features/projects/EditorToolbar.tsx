import { useEffect, useRef, useState } from 'react'
import { CloudConnection } from '../publishing/CloudConnection'
import { Link, useLocation } from 'react-router-dom'
import {
  Check,
  Eye,
  FolderKanban,
  LayoutTemplate,
  Pencil,
  Redo2,
  Share2,
  Undo2,
  X,
} from 'lucide-react'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'

export function EditorToolbar({
  workspace: w,
}: {
  workspace: ProjectWorkspace
}) {
  const [prevProjectName, setPrevProjectName] = useState(w.project.name)
  const [name, setName] = useState(w.project.name)
  const location = useLocation()

  if (prevProjectName !== w.project.name) {
    setPrevProjectName(w.project.name)
    setName(w.project.name)
  }

  const shareDialog = useRef<HTMLDialogElement>(null)
  const [cloudOpened, setCloudOpened] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (w.canRedo) {
            e.preventDefault()
            w.redo()
          }
        } else {
          if (w.canUndo) {
            e.preventDefault()
            w.undo()
          }
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        if (w.canRedo) {
          e.preventDefault()
          w.redo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [w])

  const closeMenu = (e: React.SyntheticEvent) => {
    ;(e.target as HTMLElement).closest('details')?.removeAttribute('open')
  }

  return (
    <header className="atelier-bar">
      <Link to="/" className="atelier-brand" aria-label="AhMatTaYa">
        <span className="brand-seal" aria-hidden="true">
          A
        </span>
        <span className="brand-word">
          အမှတ်တရ
          <small>Atelier</small>
        </span>
      </Link>

      <details className="file-menu">
        <summary>ဖိုင်</summary>
        <div className="file-menu-items">
          <button
            onClick={(e) => {
              w.create('birthday')
              closeMenu(e)
            }}
          >
            + ကတ်အသစ်
          </button>
          <Link to="/templates">နမူနာများ</Link>
          <button
            onClick={(e) => {
              w.duplicate()
              closeMenu(e)
            }}
          >
            မော်ကွန်းထုတ်မယ်
          </button>
          <Link to="/projects">ကတ်များ အားလုံး</Link>
        </div>
      </details>

      <div
        className="name-wrap"
        style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      >
        <input
          className="atelier-name"
          aria-label="ကတ်အမည်"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            w.rename(name)
            if (!name.trim()) setName(w.project.name)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />
        <Pencil size={11} className="name-hint" aria-hidden="true" />
      </div>

      <span className={`save-state ${w.saveStatus}`} role="status">
        {w.saveStatus === 'saved' ? (
          <>
            <Check size={13} /> <span>ဒီ browser မှာ သိမ်းပြီး</span>
          </>
        ) : w.saveStatus === 'idle' ? (
          <span>ဒီ browser မှာ သိမ်းပါမယ်</span>
        ) : (
          <span>မသိမ်းရသေးပါ</span>
        )}
      </span>

      <div className="bar-history">
        <button
          className="icon-button"
          aria-label="Undo"
          title="Undo (Ctrl+Z / Cmd+Z)"
          disabled={!w.canUndo}
          onClick={w.undo}
        >
          <Undo2 size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Redo"
          title="Redo (Ctrl+Y / Cmd+Shift+Z)"
          disabled={!w.canRedo}
          onClick={w.redo}
        >
          <Redo2 size={16} />
        </button>
      </div>

      <div className="bar-actions">
        <Link
          to="/templates"
          className={`bar-link ${location.pathname === '/templates' ? 'active' : ''}`}
          title="နမူနာများ"
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
        <Link className="button ghost bar-link" to="/preview">
          <Eye size={16} />
          <span>ကြည့်မယ်</span>
        </Link>
        <button
          className="button primary"
          style={{ padding: '9px 16px', fontSize: 12 }}
          onClick={() => {
            setCloudOpened(true)
            shareDialog.current?.showModal()
          }}
        >
          <Share2 size={15} />
          <span>မျှဝေရန်</span>
        </button>
      </div>

      <dialog
        ref={shareDialog}
        onClose={() => {
          if (!shareDialog.current?.open) setCloudOpened(false)
        }}
        className="share-dialog"
        aria-labelledby="share-heading"
      >
        <div className="share-dialog-header">
          <h2 id="share-heading">ကတ်ကို မျှဝေရန်</h2>
          <button
            className="icon-button"
            aria-label="ပိတ်မယ်"
            onClick={() => shareDialog.current?.close()}
          >
            <X size={16} />
          </button>
        </div>
        <p className="share-dialog-desc">
          ဒီကတ်ကို လောလောဆယ် ဒီ browser ထဲမှာပဲ သိမ်းထားပါတယ်။ တခြားသူ သို့မဟုတ်
          တခြားစက်မှာ ဖွင့်ကြည့်နိုင်တဲ့ Share link မရသေးပါ။
        </p>
        <p className="share-dialog-desc">
          Cloud မှာ သိမ်းပြီး Publish လုပ်နိုင်တဲ့အခါ ဒီကတ်အတွက် သီးခြား link
          ရပါမယ်။ အခုတော့ ကိုယ့်ကတ်ကို ဒီနေရာမှာပဲ နမူနာကြည့်နိုင်ပါတယ်။
        </p>
        {(w.saveStatus === 'error' || w.saveStatus === 'blocked') && (
          <p role="alert" className="music-error">
            လက်ရှိပြင်ထားတာတွေ မသိမ်းရသေးပါ။ Editor မှာ သိမ်းဆည်းမှုအခြေအနေကို
            ပြန်စစ်ပေးပါ။
          </p>
        )}
        {cloudOpened && <CloudConnection />}
        <div className="share-dialog-actions">
          <Link
            className="button primary"
            to="/preview"
            onClick={() => shareDialog.current?.close()}
          >
            <Eye size={16} /> ကိုယ့်ကတ် နမူနာကြည့်မယ်
          </Link>
          <button className="button secondary" disabled>
            Share link မရသေးပါ
          </button>
        </div>
      </dialog>
    </header>
  )
}
