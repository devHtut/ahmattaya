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
        {permanent ? 'ကိုယ့် Account' : 'Account နဲ့ ဆက်သိမ်းမယ်'}
      </h3>
      {permanent ? (
        <>
          <p className="account-email">{user?.email}</p>
          <p className="field-hint">
            ဒီ email နဲ့ ဖုန်း/ကွန်ပျူတာ တခြားစက်မှာ ဝင်ပြီး Cloud ကတ်တွေကို
            ပြန်ယူနိုင်ပါတယ်။ ဒီ browser ထဲက ကတ်တွေကို Cloud မှာ သိမ်းထားမှ
            တခြားစက်မှာ ရပါမယ်။
          </p>
          {!signOutReady ? (
            <button
              className="button secondary"
              disabled={disabled || busy}
              onClick={() => setSignOutReady(true)}
            >
              Account ထွက်မယ်
            </button>
          ) : (
            <div className="account-signout">
              <p>
                Cloud မသိမ်းရသေးတဲ့ ကတ်တွေက ဒီ browser ထဲမှာပဲ ကျန်ပါမယ်။
                အခြားသူသုံးတဲ့စက်ဖြစ်ရင် browser ထဲက မိတ္တူတွေကိုလည်း
                သီးခြားရှင်းပေးဖို့ လိုပါတယ်။
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
            {user
              ? 'ဒီ Guest ရဲ့ Cloud ကတ်တွေ၊ ပုံ/သီချင်းနဲ့ Share links တွေကို ဒီ email Account နဲ့ ဆက်ထိန်းထားပါမယ်။ မသုံးရသေးတဲ့ email နဲ့ ချိတ်ပေးပါ။'
              : 'Email ထဲက code နဲ့ Account ဝင်မယ်။ Account မရှိသေးရင် အသစ်ဖန်တီးပေးပါမယ်။ Password မလိုပါ။'}
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void act(attempt ? 'verify' : 'send')
            }}
          >
            <label>
              Email
              <input
                type="email"
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
                Email ထဲက code
                <input
                  type="text"
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
                ? 'ချိတ်ဆက်နေပါတယ်…'
                : attempt
                  ? 'Code အတည်ပြုမယ်'
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
