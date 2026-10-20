import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  Eye,
  FolderKanban,
  HardDrive,
  LayoutTemplate,
  Pencil,
  Redo2,
  Share2,
  Sparkles,
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

  if (prevProjectName !== w.project.name) {
    setPrevProjectName(w.project.name)
    setName(w.project.name)
  }

  const [copied, setCopied] = useState(false)
  const shareDialog = useRef<HTMLDialogElement>(null)

  // Keyboard shortcuts for Undo and Redo
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

  const handleCopyLink = () => {
    const previewUrl = `${window.location.origin}/preview`
    navigator.clipboard?.writeText(previewUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <header className="editor-toolbar">
      <Link to="/" className="toolbar-brand" aria-label="AhMatTaYa Studio">
        <span className="toolbar-brand-icon">
          <Sparkles size={18} />
        </span>
        <span className="toolbar-brand-text">
          အမှတ်တရ <small>Studio</small>
        </span>
      </Link>

      <details className="file-menu">
        <summary>File</summary>
        <div className="file-menu-items">
          <button
            onClick={(e) => {
              w.create('birthday')
              ;(e.target as HTMLElement)
                .closest('details')
                ?.removeAttribute('open')
            }}
          >
            + New Project (Blank)
          </button>
          <Link to="/templates">Template Gallery</Link>
          <button
            onClick={(e) => {
              w.duplicate()
              ;(e.target as HTMLElement)
                .closest('details')
                ?.removeAttribute('open')
            }}
          >
            Duplicate Project
          </button>
          <Link to="/projects">All Projects</Link>
        </div>
      </details>

      <div className="project-name-wrapper">
        <input
          className="project-name-input"
          aria-label="Project Name"
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
        <Pencil size={12} className="edit-indicator" aria-hidden="true" />
      </div>

      <span className={`toolbar-save ${w.saveStatus}`} role="status">
        <HardDrive size={15} />
        {w.saveStatus === 'saved' ? (
          <>
            <Check size={13} /> <span>Saved to device</span>
          </>
        ) : w.saveStatus === 'idle' ? (
          <span>Local draft</span>
        ) : (
          <span>Unsaved changes</span>
        )}
      </span>

      <div className="toolbar-history">
        <button
          className="icon-button"
          aria-label="Undo"
          title="Undo (Ctrl+Z / Cmd+Z)"
          disabled={!w.canUndo}
          onClick={w.undo}
        >
          <Undo2 size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="Redo"
          title="Redo (Ctrl+Y / Cmd+Shift+Z)"
          disabled={!w.canRedo}
          onClick={w.redo}
        >
          <Redo2 size={17} />
        </button>
      </div>

      <div className="toolbar-actions">
        <Link
          to="/templates"
          className="toolbar-nav-link"
          title="Template Gallery"
        >
          <LayoutTemplate size={16} />
          <span>Templates</span>
        </Link>
        <Link to="/projects" className="toolbar-nav-link" title="My Projects">
          <FolderKanban size={16} />
          <span>Projects</span>
        </Link>
        <Link
          className="button secondary toolbar-preview-btn"
          to="/preview"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Eye size={16} />
          <span>Preview</span>
        </Link>
        <button
          className="button primary toolbar-share-btn"
          onClick={() => shareDialog.current?.showModal()}
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>

      <dialog
        ref={shareDialog}
        className="share-dialog"
        aria-labelledby="share-heading"
      >
        <div className="share-dialog-header">
          <h2 id="share-heading">Share Project Link</h2>
          <button
            className="icon-button"
            aria-label="Close"
            onClick={() => shareDialog.current?.close()}
          >
            <X size={16} />
          </button>
        </div>
        <p className="share-dialog-desc">
          ဒီကတ်လေးကို လက်ခံမည့်သူ မြင်တွေ့ရမည့် Recipient Preview Link
          ဖြစ်ပါသည်။ လောလောဆယ် browser local data အနေဖြင့် သိမ်းဆည်းထားပြီး
          တိုက်ရိုက် စမ်းသပ်ကြည့်ရှုနိုင်ပါသည်။
        </p>

        <div className="share-link-box">
          <input
            readOnly
            value={
              typeof window !== 'undefined'
                ? `${window.location.origin}/preview`
                : ''
            }
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            className="button secondary"
            onClick={handleCopyLink}
            type="button"
          >
            {copied ? (
              <>
                <Check size={14} /> Copied!
              </>
            ) : (
              'Copy Link'
            )}
          </button>
        </div>

        <div className="share-dialog-actions">
          <Link
            className="button primary"
            to="/preview"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => shareDialog.current?.close()}
          >
            <Eye size={16} /> Open Recipient Preview
          </Link>
        </div>
      </dialog>
    </header>
  )
}
