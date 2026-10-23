import { useEffect, useId, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getCloudClient } from '../../shared/cloud/client'
import {
  accountMessage,
  confirmAccountCode,
  isPermanentAccount,
  requestAccountCode,
  signOutAccount,
  type AccountAttempt,
} from '../../shared/cloud/account'
export function AccountPanel({
  user,
  disabled,
  onBusy,
}: {
  user: User | null
  disabled: boolean
  onBusy: (busy: boolean) => void
}) {
  const headingId = useId()
  const [email, setEmail] = useState(user?.new_email ?? '')
  const [code, setCode] = useState('')
  const [attempt, setAttempt] = useState<AccountAttempt | null>(
    user && !isPermanentAccount(user) && user.new_email
      ? { email: user.new_email, mode: 'link', ownerId: user.id }
      : null,
  )
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [feedback, setFeedback] = useState(''),
    [cooldown, setCooldown] = useState(0),
    [signOutReady, setSignOutReady] = useState(false)
  const running = useRef(false),
    alive = useRef(false)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])
  async function act(action: 'send' | 'verify' | 'out') {
    if (running.current || disabled || (action === 'send' && cooldown > 0))
      return
    running.current = true
    setBusy(true)
    onBusy(true)
    setError('')
    setFeedback('')
    try {
      const client = await getCloudClient()
      if (action === 'send') {
        const next = await requestAccountCode(client, email)
        if (alive.current) {
          setAttempt(next)
          setCooldown(60)
          setCode('')
          setFeedback(
            'Email ထဲက code ကို ဒီနေရာမှာ ဖြည့်ပေးပါ။ Inbox နဲ့ Spam ကို စစ်ကြည့်ပါ။',
          )
        }
      } else if (action === 'verify' && attempt) {
        await confirmAccountCode(client, attempt, code)
        if (alive.current) {
          setCode('')
          setAttempt(null)
          setFeedback(
            '✓ Account ချိတ်ပြီးပါပြီ။ Cloud ကတ်တွေကို တခြားစက်ကနေ ပြန်ဝင်ပြီး ဆက်ပြင်နိုင်ပါပြီ။',
          )
        }
      } else if (action === 'out') {
        await signOutAccount(client)
        if (alive.current) {
          setSignOutReady(false)
          setAttempt(null)
          setEmail('')
          setCode('')
          setFeedback('ဒီစက်မှာ Account ထွက်ပြီးပါပြီ။')
        }
      }
    } catch (err) {
      if (alive.current) setError(accountMessage(err))
    } finally {
      running.current = false
      onBusy(false)
      if (alive.current) setBusy(false)
    }
  }
  const permanent = isPermanentAccount(user)
  return (
    <section className="account-panel" aria-labelledby={headingId}>
      <h3 id={headingId}>
        {permanent ? 'ကိုယ့် Account' : 'အကောင့်ဝင်ရန် / အသစ်ဖွင့်ရန် (Sign In / Sign Up)'}
      </h3>
      {permanent ? (
        <>
          <p className="account-email">✉ {user?.email}</p>
          <p className="field-hint">
            ဒီ email ဖြင့် အခြား ဖုန်း/ကွန်ပျူတာများမှလည်း Cloud ကတ်များကို
            ပြန်လည်ဖွင့်ပြီး ဆက်လက်ပြင်ဆင်နိုင်ပါသည်။
          </p>
          {!signOutReady ? (
            <button
              className="button secondary"
              disabled={disabled || busy}
              onClick={() => setSignOutReady(true)}
            >
              Account ထွက်မယ် (Sign Out)
            </button>
          ) : (
            <div className="account-signout">
              <p>
                အကောင့်ထွက်လိုက်ပါက Cloud ပေါ်က ကတ်များ မပျောက်သွားပါ။
                နောက်တစ်ကြိမ် email ဖြင့် ပြန်လည်ဝင်ရောက်နိုင်ပါသည်။
              </p>
              <button
                className="button secondary"
                disabled={disabled || busy}
                onClick={() => void act('out')}
              >
                ဒီစက်မှာ Account ထွက်မယ်
              </button>
              <button
                className="button ghost"
                disabled={busy}
                onClick={() => setSignOutReady(false)}
              >
                မထွက်တော့ပါ
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="field-hint">
            {attempt
              ? 'သင့် Email ထဲသို့ ပို့ထားသော 6-digit code ကို ဖြည့်သွင်းပေးပါ။'
              : 'သင့် Email ထဲသို့ ပို့ပေးမည့် code ဖြင့် အလွယ်တကူ ဝင်ရောက်နိုင်ပါသည် (အကောင့်မရှိသေးပါက အလိုအလျောက် ဖွင့်ပေးပါမည်၊ Password မလိုပါ)။'}
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void act(attempt ? 'verify' : 'send')
            }}
          >
            <label>
              Email လိပ်စာ
              <input
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                value={attempt?.email ?? email}
                disabled={disabled || busy || Boolean(attempt)}
                required
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            {attempt && (
              <label>
                Email ထဲက 6-digit code
                <input
                  type="text"
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  required
                  minLength={6}
                  maxLength={10}
                  disabled={disabled || busy}
                />
              </label>
            )}
            <button
              className="button primary"
              type="submit"
              disabled={disabled || busy || (!attempt && cooldown > 0)}
            >
              {busy
                ? 'လုပ်ဆောင်နေပါတယ်…'
                : attempt
                  ? 'အတည်ပြုပြီး အကောင့်ဝင်မယ်'
                  : cooldown > 0
                    ? `${cooldown} စက္ကန့် စောင့်ပေးပါ`
                    : 'Email code ပို့မယ်'}
            </button>
            {attempt && (
              <div className="publish-actions">
                <button
                  className="button secondary"
                  type="button"
                  disabled={disabled || busy || cooldown > 0}
                  onClick={() => void act('send')}
                >
                  {cooldown > 0
                    ? `ထပ်ပို့ရန် ${cooldown} စက္ကန့်`
                    : 'Code ပြန်ပို့မယ်'}
                </button>
                <button
                  className="button ghost"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEmail(attempt.email)
                    setAttempt(null)
                    setCode('')
                    setError('')
                    setFeedback('')
                  }}
                >
                  Email ပြန်ပြင်မယ်
                </button>
              </div>
            )}
          </form>
        </>
      )}
      {feedback && (
        <p className="cloud-success" role="status">
          {feedback}
        </p>
      )}
      {error && (
        <p className="music-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
