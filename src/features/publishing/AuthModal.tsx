import { useEffect, useRef, useState } from 'react'
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  RotateCcw,
} from 'lucide-react'
import { getCloudClient } from '../../shared/cloud/client'
import {
  accountMessage,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  confirmSignUpCode,
  resendSignUpCode,
  type SignUpAttempt,
} from '../../shared/cloud/account'

export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
  onSuccess?: () => void
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess,
}: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<'signin' | 'signup' | 'otp'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [attempt, setAttempt] = useState<SignUpAttempt | null>(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [cooldown, setCooldown] = useState(0)

  function handleClose() {
    setMode(initialMode)
    setError('')
    setFeedback('')
    setPassword('')
    setCode('')
    setAttempt(null)
    onClose()
  }

  // Dialog element open/close synchronization
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [isOpen])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  function resetForm() {
    setError('')
    setFeedback('')
    setPassword('')
    setCode('')
    setAttempt(null)
  }

  function switchMode(newMode: 'signin' | 'signup') {
    resetForm()
    setMode(newMode)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setFeedback('')

    try {
      const client = await getCloudClient()
      await signInWithEmailPassword(client, email, password)
      setFeedback('✓ အကောင့်ဝင်ရောက်ခြင်း အောင်မြင်ပါသည်။')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 500)
    } catch (err: unknown) {
      setError(accountMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setFeedback('')

    try {
      const client = await getCloudClient()
      const newAttempt = await signUpWithEmailPassword(client, email, password)
      setAttempt(newAttempt)
      setMode('otp')
      setCooldown(60)
      setFeedback('သင့် Email သို့ 6-digit OTP code ပို့ပေးထားပါသည်။')
    } catch (err: unknown) {
      setError(accountMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !attempt) return
    setBusy(true)
    setError('')
    setFeedback('')

    try {
      const client = await getCloudClient()
      await confirmSignUpCode(client, attempt, code)
      setFeedback('✓ အကောင့်ဖွင့်ပြီး ဝင်ရောက်ခြင်း အောင်မြင်ပါသည်။')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 500)
    } catch (err: unknown) {
      setError(accountMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleResendCode() {
    if (busy || !attempt || cooldown > 0) return
    setBusy(true)
    setError('')
    setFeedback('')

    try {
      const client = await getCloudClient()
      await resendSignUpCode(client, attempt)
      setCooldown(60)
      setFeedback('Code အသစ် ထပ်မံပို့ပေးပြီးပါပြီ။ Inbox နှင့် Spam ကို စစ်ကြည့်ပါ။')
    } catch (err: unknown) {
      setError(accountMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="auth-modal share-dialog"
      onClose={handleClose}
      aria-labelledby="auth-modal-title"
    >
      <div className="share-dialog-header">
        <h2 id="auth-modal-title" className="auth-modal-title">
          {mode === 'signin' && (
            <>
              <LogIn size={20} className="auth-title-icon" />
              <span>အကောင့်ဝင်ရန် (Sign In)</span>
            </>
          )}
          {mode === 'signup' && (
            <>
              <UserPlus size={20} className="auth-title-icon" />
              <span>အကောင့်သစ်ဖွင့်ရန် (Sign Up)</span>
            </>
          )}
          {mode === 'otp' && (
            <>
              <KeyRound size={20} className="auth-title-icon" />
              <span>Email OTP အတည်ပြုရန်</span>
            </>
          )}
        </h2>
        <button
          type="button"
          className="icon-button"
          aria-label="ပိတ်မယ်"
          onClick={handleClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="auth-modal-body">
        {mode === 'signin' && (
          <form className="auth-form" onSubmit={handleSignIn}>
            <p className="share-dialog-desc">
              သင်၏ Email နှင့် စကားဝှက် (Password) ရိုက်ထည့်၍ အကောင့်ဝင်ရောက်ပါ။
            </p>

            <label className="auth-field">
              <span className="auth-field-label">
                <Mail size={14} /> Email လိပ်စာ
              </span>
              <input
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </label>

            <label className="auth-field">
              <span className="auth-field-label">
                <Lock size={14} /> စကားဝှက် (Password)
              </span>
              <div className="auth-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Password ဖျောက်မယ်' : 'Password ပြမယ်'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="button primary auth-submit-btn"
              disabled={busy || !email || !password}
            >
              <LogIn size={16} />
              {busy ? 'အကောင့်စစ်ဆေးနေပါသည်…' : 'Sign In'}
            </button>

            <div className="auth-switch-footer">
              <span>အကောင့်မရှိသေးဘူးလား?</span>
              <button
                type="button"
                className="link-button"
                onClick={() => switchMode('signup')}
                disabled={busy}
              >
                အသစ်ဖွင့်မယ် (Sign Up)
              </button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form className="auth-form" onSubmit={handleSignUp}>
            <p className="share-dialog-desc">
              Email နှင့် အနည်းဆုံး ၆ လုံးရှိသော Password ဖြင့် အကောင့်သစ် ဖွင့်နိုင်ပါသည်။
            </p>

            <label className="auth-field">
              <span className="auth-field-label">
                <Mail size={14} /> Email လိပ်စာ
              </span>
              <input
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </label>

            <label className="auth-field">
              <span className="auth-field-label">
                <Lock size={14} /> စကားဝှက် (အနည်းဆုံး ၆ လုံး)
              </span>
              <div className="auth-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Password ဖျောက်မယ်' : 'Password ပြမယ်'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <p className="field-hint">
              Sign Up ခလုတ်နှိပ်ပြီးပါက သင့် Email သို့ 6-digit OTP code ပို့ပေးမည် ဖြစ်ပါသည်။
            </p>

            <button
              type="submit"
              className="button primary auth-submit-btn"
              disabled={busy || !email || password.length < 6}
            >
              <UserPlus size={16} />
              {busy ? 'အကောင့်ဖွင့်နေပါသည်…' : 'Sign Up (အကောင့်ဖွင့်မယ်)'}
            </button>

            <div className="auth-switch-footer">
              <span>အကောင့်ရှိပြီးသားလား?</span>
              <button
                type="button"
                className="link-button"
                onClick={() => switchMode('signin')}
                disabled={busy}
              >
                Sign In ဝင်မယ်
              </button>
            </div>
          </form>
        )}

        {mode === 'otp' && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <p className="share-dialog-desc">
              <strong>{attempt?.email ?? email}</strong> ထံသို့ ပို့ထားသော 6-digit OTP
              code ကို ရိုက်ထည့်ပေးပါ။
            </p>

            <label className="auth-field">
              <span className="auth-field-label">
                <KeyRound size={14} /> 6-digit OTP Code
              </span>
              <input
                type="text"
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                minLength={6}
                maxLength={10}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={busy}
                style={{
                  fontSize: '1.25rem',
                  letterSpacing: '0.25em',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              />
            </label>

            <button
              type="submit"
              className="button primary auth-submit-btn"
              disabled={busy || code.length < 6}
            >
              {busy ? 'အတည်ပြုနေပါသည်…' : 'အတည်ပြုပြီး အကောင့်ဝင်မယ်'}
            </button>

            <div className="publish-actions" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="button secondary"
                disabled={busy || cooldown > 0}
                onClick={handleResendCode}
              >
                <RotateCcw size={14} />
                {cooldown > 0
                  ? `ထပ်ပို့ရန် ${cooldown} စက္ကန့်`
                  : 'Code ပြန်ပို့မယ်'}
              </button>

              <button
                type="button"
                className="button ghost"
                disabled={busy}
                onClick={() => {
                  setError('')
                  setFeedback('')
                  setMode('signup')
                }}
              >
                Email ပြန်ပြင်မယ်
              </button>
            </div>
          </form>
        )}

        {feedback && (
          <p className="cloud-success" role="status" style={{ marginTop: '12px' }}>
            {feedback}
          </p>
        )}

        {error && (
          <p className="music-error" role="alert" style={{ marginTop: '12px' }}>
            {error}
          </p>
        )}
      </div>
    </dialog>
  )
}
