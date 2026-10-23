import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudConnection } from '../publishing/CloudConnection'
import { Link, useLocation } from 'react-router-dom'
import {
  Check,
  Cloud,
  Download,
  Eye,
  FileImage,
  FileJson,
  FolderKanban,
  LayoutTemplate,
  Pencil,
  Printer,
  Redo2,
  Save,
  Share2,
  Undo2,
  Upload,
  X,
} from 'lucide-react'
import type { ProjectWorkspace } from '../creator/hooks/useCreatorDraft'
import {
  downloadProjectJson,
  parseProjectBackup,
  downloadCardImage,
  printCard,
} from './lib/export-card'

export function EditorToolbar({
  workspace: w,
}: {
  workspace: ProjectWorkspace
}) {
  const [prevProjectName, setPrevProjectName] = useState(w.project.name)
  const [name, setName] = useState(w.project.name)
  const [savedFlash, setSavedFlash] = useState(false)
  const [exportingImage, setExportingImage] = useState(false)
  const location = useLocation()

  if (prevProjectName !== w.project.name) {
    setPrevProjectName(w.project.name)
    setName(w.project.name)
  }

  const shareDialog = useRef<HTMLDialogElement>(null)
  const exportDialog = useRef<HTMLDialogElement>(null)
  const fileMenuRef = useRef<HTMLDetailsElement>(null)
  const [cloudOpened, setCloudOpened] = useState(false)

  const handleExplicitSave = useCallback(() => {
    w.saveNow()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }, [w])

  const handleExportJson = () => {
    downloadProjectJson(w.project)
  }

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const { name: importedName, card } = parseProjectBackup(text)
      w.importBackup(importedName, card)
      exportDialog.current?.close()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Backup ဖိုင်ဖတ်မရပါ')
    } finally {
      e.target.value = ''
    }
  }

  const handleExportImage = async () => {
    try {
      setExportingImage(true)
      const coverPageId = w.project.card.pages[0]?.id
      await downloadCardImage(w.project.card, coverPageId, w.project.name)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ပုံထုတ်ယူမှု မအောင်မြင်ပါ')
    } finally {
      setExportingImage(false)
    }
  }

  const handlePrint = () => {
    printCard()
  }

  useEffect(() => {
    function handleClickOutside(event: globalThis.PointerEvent) {
      if (
        fileMenuRef.current?.open &&
        !fileMenuRef.current.contains(event.target as Node)
      ) {
        fileMenuRef.current.removeAttribute('open')
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape' && fileMenuRef.current?.open) {
        fileMenuRef.current.removeAttribute('open')
      }
    }

    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleExplicitSave()
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
  }, [w, handleExplicitSave])

  const closeMenu = (e?: React.SyntheticEvent) => {
    if (fileMenuRef.current) {
      fileMenuRef.current.removeAttribute('open')
    } else if (e) {
      ;(e.target as HTMLElement).closest('details')?.removeAttribute('open')
    }
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

      <details ref={fileMenuRef} className="file-menu">
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
          <Link to="/templates" onClick={() => closeMenu()}>
            နမူနာများ
          </Link>
          <button
            onClick={(e) => {
              w.duplicate()
              closeMenu(e)
            }}
          >
            မော်ကွန်းထုတ်မယ်
          </button>
          <button
            onClick={(e) => {
              exportDialog.current?.showModal()
              closeMenu(e)
            }}
          >
            📥 ဖိုင်ထုတ်ယူရန် / Backup
          </button>
          <Link to="/projects" onClick={() => closeMenu()}>
            ကတ်များ အားလုံး
          </Link>
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

      <div className="save-control-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          className={`button save-action-btn ${savedFlash ? 'is-saved' : 'ghost'}`}
          onClick={handleExplicitSave}
          title="လက်ရှိ ပြင်ဆင်ချက်များကို သိမ်းဆည်းမယ် (Ctrl+S / Cmd+S)"
          style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {savedFlash ? (
            <>
              <Check size={14} /> <span>သိမ်းပြီးပါပြီ ✓</span>
            </>
          ) : (
            <>
              <Save size={14} /> <span>သိမ်းမယ်</span>
            </>
          )}
        </button>

        <span className={`save-state ${w.saveStatus}`} role="status">
          {w.saveStatus === 'saved' ? (
            <>
              <Check size={13} /> <span>auto-saved</span>
            </>
          ) : w.saveStatus === 'idle' ? (
            <span>သိမ်းဆည်းထားပါသည်</span>
          ) : (
            <span>မသိမ်းရသေးပါ</span>
          )}
        </span>
      </div>

      <button
        className="icon-button"
        aria-label="Cloud ကတ်များ"
        title="Cloud သိမ်းဆည်းမှု"
        onClick={() => {
          setCloudOpened(true)
          shareDialog.current?.showModal()
        }}
      >
        <Cloud size={17} />
      </button>

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
        <button
          type="button"
          className="button ghost bar-link"
          onClick={() => exportDialog.current?.showModal()}
          title="ဖိုင်သိမ်း/ထုတ်ယူရန် (Export & Backup)"
          style={{ padding: '7px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Download size={14} />
          <span>ထုတ်ယူရန်</span>
        </button>
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
        ref={exportDialog}
        className="share-dialog export-dialog"
        aria-labelledby="export-heading"
      >
        <div className="share-dialog-header">
          <h2 id="export-heading">ကတ်ကို ထုတ်ယူရန် (Export & Backup)</h2>
          <button
            className="icon-button"
            aria-label="ပိတ်မယ်"
            onClick={() => exportDialog.current?.close()}
          >
            <X size={16} />
          </button>
        </div>
        <p className="share-dialog-desc">
          သင့်ကတ်ကို မိတ္တူအဖြစ် သိမ်းဆည်းနိုင်သလို၊ ပုံ (PNG) သို့မဟုတ် Print/PDF အဖြစ် အလွယ်တကူ ထုတ်ယူနိုင်ပါသည်။
        </p>

        <div className="export-options-grid">
          <div className="export-card-option">
            <div className="export-option-icon">
              <FileJson size={24} />
            </div>
            <div className="export-option-info">
              <h3>JSON Project Backup</h3>
              <p>ကတ်တစ်ခုလုံးရဲ့ စာ၊ ဓာတ်ပုံ၊ အစီအစဉ်အားလုံးကို ဖိုင်အဖြစ် သိမ်းပြီး နောင်တစ်ချိန် အခြား browser/စက်မှာ ပြန်ဖွင့်နိုင်ပါသည်။</p>
              <div className="export-option-actions">
                <button
                  type="button"
                  className="button primary"
                  onClick={handleExportJson}
                >
                  <Download size={14} /> JSON Backup ဒေါင်းလုဒ်ရယူမယ်
                </button>
                <label className="button ghost import-backup-label">
                  <Upload size={14} /> Backup ဖိုင်မှ ပြန်တင်မယ်
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="export-card-option">
            <div className="export-option-icon">
              <FileImage size={24} />
            </div>
            <div className="export-option-info">
              <h3>Cover ဓာတ်ပုံ (PNG) ထုတ်ယူမယ်</h3>
              <p>ကတ်၏ မျက်နှာဖုံးစာမျက်နှာကို Social Media (Facebook/Instagram/Viber) ပေါ် တင်နိုင်မည့် အရည်အသွေးမြင့် ဓာတ်ပုံအဖြစ် ထုတ်ယူမည်။</p>
              <div className="export-option-actions">
                <button
                  type="button"
                  className="button ghost"
                  disabled={exportingImage}
                  onClick={handleExportImage}
                >
                  <FileImage size={14} />
                  {exportingImage ? 'ပုံထုတ်လုပ်နေပါသည်...' : 'PNG ဓာတ်ပုံ ထုတ်ယူမယ်'}
                </button>
              </div>
            </div>
          </div>

          <div className="export-card-option">
            <div className="export-option-icon">
              <Printer size={24} />
            </div>
            <div className="export-option-info">
              <h3>Print & PDF ထုတ်ယူမယ်</h3>
              <p>ကတ်စာမျက်နှာများကို စာရွက်ပေါ် print ထုတ်ရန် သို့မဟုတ် PDF အဖြစ် Save ရန် browser print dialogue ကို ဖွင့်ပေးမည်။</p>
              <div className="export-option-actions">
                <button
                  type="button"
                  className="button ghost"
                  onClick={handlePrint}
                >
                  <Printer size={14} /> Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </dialog>

      <dialog
        ref={shareDialog}
        onClose={() => {
          if (!shareDialog.current?.open) setCloudOpened(false)
        }}
        className="share-dialog"
        aria-labelledby="share-heading"
      >
        <div className="share-dialog-header">
          <h2 id="share-heading">Cloud နဲ့ မျှဝေမှု</h2>
          <button
            className="icon-button"
            aria-label="ပိတ်မယ်"
            onClick={() => shareDialog.current?.close()}
          >
            <X size={16} />
          </button>
        </div>
        <p className="share-dialog-desc">
          ဒီ browser မှာ အလိုအလျောက် သိမ်းပေးပါတယ်။ Cloud မိတ္တူအတွက် အောက်က
          သိမ်းမယ်ကို နှိပ်ပါ။ ချစ်ရသူဆီ ပို့ဖို့ Publish နှိပ်ပြီး link
          ယူနိုင်ပါတယ်။
        </p>
        <p className="share-dialog-desc">
          Publish လုပ်ရင် ဒီကတ်အတွက် သီးခြား receiver link ရပါမယ်။ အတူပြင်ဆင်သူ
          ဖိတ်ခေါ်တဲ့ link နဲ့ သီးခြားဖြစ်ပါတယ်။
        </p>
        {(w.saveStatus === 'error' || w.saveStatus === 'blocked') && (
          <p role="alert" className="music-error">
            လက်ရှိပြင်ထားတာတွေ မသိမ်းရသေးပါ။ Editor မှာ သိမ်းဆည်းမှုအခြေအနေကို
            ပြန်စစ်ပေးပါ။
          </p>
        )}
        {cloudOpened && (
          <CloudConnection
            workspace={w}
            onRestored={() => shareDialog.current?.close()}
          />
        )}
        <div className="share-dialog-actions">
          <Link
            className="button primary"
            to="/preview"
            onClick={() => shareDialog.current?.close()}
          >
            <Eye size={16} /> ကိုယ့်ကတ် နမူနာကြည့်မယ်
          </Link>
        </div>
      </dialog>
    </header>
  )
}
