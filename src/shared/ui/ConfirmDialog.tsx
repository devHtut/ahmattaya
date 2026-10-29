import { useEffect, useRef, type ReactNode } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  icon?: 'trash' | 'warning'
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  icon = 'trash',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (isOpen) {
      if (!el.open) {
        if (typeof el.showModal === 'function') {
          el.showModal()
        } else {
          el.setAttribute('open', '')
        }
      }
    } else {
      if (el.open) {
        if (typeof el.close === 'function') {
          el.close()
        } else {
          el.removeAttribute('open')
        }
      }
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      onClose={() => {
        if (!dialogRef.current?.open) {
          onClose()
        }
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose()
        }
      }}
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? 'confirm-dialog-desc' : undefined}
    >
      <div className="confirm-dialog-body">
        <div className="confirm-dialog-top">
          <div className={`confirm-dialog-icon ${variant}`} aria-hidden="true">
            {icon === 'trash' ? (
              <Trash2 size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
          </div>
          <div className="confirm-dialog-text">
            <h3 id="confirm-dialog-title" className="confirm-dialog-title">
              {title}
            </h3>
            {description && (
              <div id="confirm-dialog-desc" className="confirm-dialog-desc">
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="ပိတ်မယ်"
            style={{
              marginLeft: 'auto',
              flexShrink: 0,
              width: '28px',
              height: '28px',
              padding: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="confirm-dialog-actions">
        <button
          type="button"
          className="button secondary"
          autoFocus
          onClick={onClose}
        >
          {cancelText}
        </button>
        <button
          type="button"
          className={`button ${variant === 'danger' ? 'danger' : 'primary'}`}
          onClick={() => {
            onConfirm()
          }}
        >
          {confirmText}
        </button>
      </div>
    </dialog>
  )
}

