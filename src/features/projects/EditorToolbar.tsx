import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Eye,
  HardDrive,
  Redo2,
  Share2,
  Undo2,
} from 'lucide-react'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
export function EditorToolbar({
  workspace: w,
}: {
  workspace: ProjectWorkspace
}) {
  const navigate = useNavigate()
  const [name, setName] = useState(w.project.name)
  const shareDialog = useRef<HTMLDialogElement>(null)
  return (
    <header className="editor-toolbar">
      <Link
        to="/projects"
        className="icon-button"
        aria-label="Project များသို့"
      >
        <ArrowLeft size={19} />
      </Link>
      <details className="file-menu">
        <summary>File</summary>
        <div className="file-menu-items">
          <button
            onClick={() => {
              w.create()
              navigate('/create')
            }}
          >
            Project အသစ်
          </button>
          <button onClick={() => w.duplicate()}>မိတ္တူပွားမယ်</button>
          <Link to="/projects">Project များ ကြည့်မယ်</Link>
        </div>
      </details>
      <input
        className="project-name-input"
        aria-label="Project နာမည်"
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
      <span className={`toolbar-save ${w.saveStatus}`} role="status">
        <HardDrive size={16} />
        {w.saveStatus === 'saved' ? (
          <>
            <Check size={13} /> ဒီစက်မှာ သိမ်းပြီး
          </>
        ) : w.saveStatus === 'idle' ? (
          'ဒီစက်မှာ သိမ်းပါမယ်'
        ) : (
          'မသိမ်းရသေးပါ'
        )}
      </span>
      <div className="toolbar-history">
        <button
          className="icon-button"
          aria-label="Undo"
          disabled={!w.canUndo}
          onClick={w.undo}
        >
          <Undo2 size={18} />
        </button>
        <button
          className="icon-button"
          aria-label="Redo"
          disabled={!w.canRedo}
          onClick={w.redo}
        >
          <Redo2 size={18} />
        </button>
      </div>
      <Link className="button secondary" to="/preview">
        <Eye size={16} />
        <span>Preview</span>
      </Link>
      <button
        className="button primary"
        onClick={() => shareDialog.current?.showModal()}
      >
        <Share2 size={16} /> Share
      </button>
      <dialog
        ref={shareDialog}
        className="share-dialog"
        aria-labelledby="share-heading"
      >
        <h2 id="share-heading">မကြာမီ မျှဝေနိုင်ပါမယ်</h2>
        <p>
          ဒီ Project ကို လောလောဆယ် ဒီ browser ထဲမှာပဲ သိမ်းထားပါတယ်။
          တခြားသူဖွင့်နိုင်တဲ့ link ကို cloud သိမ်းဆည်းမှု ထည့်ပြီးမှ
          ရနိုင်ပါမယ်။
        </p>
        <button
          autoFocus
          className="button primary"
          onClick={() => shareDialog.current?.close()}
        >
          နားလည်ပါပြီ
        </button>
      </dialog>
    </header>
  )
}
