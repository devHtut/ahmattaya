import { z } from 'zod'
import type { SupabaseClient, User } from '@supabase/supabase-js'
export class AccountError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}
export function accountEmail(input: string) {
  const parsed = z.email().max(254).safeParse(input.trim())
  if (!parsed.success) throw new AccountError('invalid-email')
  return parsed.data
}
export function accountCode(input: string) {
  const code = input.replace(/\s/g, '')
  if (!/^\d{6,10}$/.test(code)) throw new AccountError('invalid-code')
  return code
}
export function accountPassword(input: string) {
  const password = input.trim()
  if (password.length < 6) throw new AccountError('invalid-password')
  return password
}
export function isPermanentAccount(user: User | null) {
  return Boolean(
    user && !user.is_anonymous && user.email && user.email_confirmed_at,
  )
}
export async function verifiedIdentity(client: SupabaseClient) {
  const { data: session, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw sessionError
  if (!session.session) return null
  const { data, error } = await client.auth.getUser()
  if (error) throw error
  if (!data.user || data.user.id !== session.session.user.id)
    throw new AccountError('identity-changed')
  return data.user
}
export type AccountAttempt = {
  email: string
  mode: 'link' | 'login'
  ownerId?: string
}
export async function requestAccountCode(
  client: SupabaseClient,
  input: string,
): Promise<AccountAttempt> {
  const email = accountEmail(input),
    user = await verifiedIdentity(client)
  if (isPermanentAccount(user)) throw new AccountError('already-signed-in')
  if (user) {
    // Upgrade in place: never sign a guest into a different identity implicitly.
    const { data, error } = await client.auth.updateUser({ email })
    if (error) throw error
    if (data.user?.id !== user.id) throw new AccountError('identity-changed')
    return { email, mode: 'link', ownerId: user.id }
  }
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })
  if (error) throw error
  return { email, mode: 'login' }
}
export async function confirmAccountCode(
  client: SupabaseClient,
  attempt: AccountAttempt,
  input: string,
) {
  const token = accountCode(input)
  const current = await verifiedIdentity(client)
  if (
    attempt.mode === 'link' &&
    (!current || isPermanentAccount(current) || current.id !== attempt.ownerId)
  )
    throw new AccountError('identity-changed')
  if (attempt.mode === 'login' && current)
    throw new AccountError('identity-changed')
  const { data, error } = await client.auth.verifyOtp({
    email: accountEmail(attempt.email),
    token,
    type: attempt.mode === 'link' ? 'email_change' : 'email',
  })
  if (error) throw error
  if (
    !data.session ||
    !isPermanentAccount(data.user) ||
    (attempt.mode === 'link' && data.user?.id !== attempt.ownerId)
  )
    throw new AccountError('not-confirmed')
  // Always use the server's identity, not an editable email or decoded JWT.
  const verified = await verifiedIdentity(client)
  if (!isPermanentAccount(verified) || verified?.id !== data.user?.id)
    throw new AccountError('not-confirmed')
  return verified!
}
export async function signOutAccount(client: SupabaseClient) {
  const user = await verifiedIdentity(client)
  if (!isPermanentAccount(user)) throw new AccountError('guest-signout')
  const { error } = await client.auth.signOut({ scope: 'local' })
  if (error) throw error
}

export async function signInWithEmailPassword(
  client: SupabaseClient,
  inputEmail: string,
  inputPassword: string,
) {
  const email = accountEmail(inputEmail)
  const password = accountPassword(inputPassword)
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  if (!data.user || !isPermanentAccount(data.user)) {
    throw new AccountError('not-confirmed')
  }
  return data.user
}

export type SignUpAttempt = {
  email: string
  mode: 'link' | 'signup'
  ownerId?: string
}

export async function signUpWithEmailPassword(
  client: SupabaseClient,
  inputEmail: string,
  inputPassword: string,
): Promise<SignUpAttempt> {
  const email = accountEmail(inputEmail)
  const password = accountPassword(inputPassword)
  const user = await verifiedIdentity(client)
  if (isPermanentAccount(user)) throw new AccountError('already-signed-in')

  if (user) {
    const { data, error } = await client.auth.updateUser({ email, password })
    if (error) throw error
    if (data.user?.id !== user.id) throw new AccountError('identity-changed')
    return { email, mode: 'link', ownerId: user.id }
  }

  const { error } = await client.auth.signUp({ email, password })
  if (error) throw error
  return { email, mode: 'signup' }
}

export async function confirmSignUpCode(
  client: SupabaseClient,
  attempt: SignUpAttempt,
  inputCode: string,
) {
  const token = accountCode(inputCode)
  const current = await verifiedIdentity(client)
  if (
    attempt.mode === 'link' &&
    (!current || isPermanentAccount(current) || current.id !== attempt.ownerId)
  )
    throw new AccountError('identity-changed')

  const { data, error } = await client.auth.verifyOtp({
    email: accountEmail(attempt.email),
    token,
    type: attempt.mode === 'link' ? 'email_change' : 'signup',
  })
  if (error) throw error
  if (
    !data.session ||
    !isPermanentAccount(data.user) ||
    (attempt.mode === 'link' && data.user?.id !== attempt.ownerId)
  )
    throw new AccountError('not-confirmed')

  const verified = await verifiedIdentity(client)
  if (!isPermanentAccount(verified) || verified?.id !== data.user?.id)
    throw new AccountError('not-confirmed')
  return verified!
}

export async function resendSignUpCode(
  client: SupabaseClient,
  attempt: SignUpAttempt,
) {
  const email = accountEmail(attempt.email)
  if (attempt.mode === 'link') {
    const { error } = await client.auth.updateUser({ email })
    if (error) throw error
  } else {
    const { error } = await client.auth.resend({
      type: 'signup',
      email,
    })
    if (error) throw error
  }
}

export function accountMessage(error: unknown) {
  const code =
    error && typeof error === 'object' && 'code' in error ? error.code : ''
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String(error.message).toLowerCase()
      : ''
  if (code === 'invalid-email') return 'Email လိပ်စာကို မှန်အောင် ဖြည့်ပေးပါ။'
  if (code === 'invalid-password')
    return 'စကားဝှက် (Password) သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။'
  if (code === 'invalid-code') return 'Email ထဲက ဂဏန်း ၆ လုံး code ကို ဖြည့်ပေးပါ။'
  if (
    code === 'invalid_credentials' ||
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials')
  )
    return 'Email သို့မဟုတ် Password မမှန်ကန်ပါ။ ပြန်စစ်ဆေးပေးပါ။'
  if (
    code === 'email_not_confirmed' ||
    message.includes('email not confirmed')
  )
    return 'Email ကို အတည်မပြုရသေးပါ။ သင့် email သို့ ပို့ထားသော OTP code ဖြင့် အတည်ပြုပေးပါ။'
  if (code === 'weak_password')
    return 'Password အားနည်းနေပါသည်။ ပိုမိုခိုင်မာသော Password ရွေးချယ်ပေးပါ။'
  if (code === 'otp_expired' || code === 'otp_disabled')
    return 'Code မမှန်တာ သို့မဟုတ် သက်တမ်းကုန်တာ ဖြစ်နိုင်ပါတယ်။ Code အသစ်တောင်းပြီး ပြန်ကြိုးစားပါ။'
  if (
    code === 'email_exists' ||
    code === 'user_already_exists' ||
    code === 'identity_already_exists'
  )
    return 'ဒီ email မှာ Account ရှိပြီးသားပါ။ Sign In ဝင်ရောက်နိုင်ပါသည်။'
  if (code === 'email_address_not_authorized')
    return 'Email ပို့ဖို့ server မှာ SMTP ပြင်ဆင်ရန် လိုနေပါတယ်။'
  if (
    code === 'email_provider_disabled' ||
    code === 'manual_linking_disabled' ||
    code === 'signup_disabled'
  )
    return 'Email account ချိတ်ဖို့ server Authentication settings ကို ပြင်ဆင်ရန် လိုနေပါတယ်။'
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    code === 'email_send_rate_limit'
  )
    return 'Code ပို့ခြင်း များနေပါတယ်။ ခဏစောင့်ပြီး ပြန်ကြိုးစားပေးပါ။'
  if (code === 'identity-changed' || code === 'already-signed-in')
    return 'အခြား tab မှာ Account ပြောင်းထားနိုင်ပါတယ်။ ဒီနေရာကို ပိတ်ပြီး ပြန်ဖွင့်ပေးပါ။'
  if (code === 'not-confirmed')
    return 'Email အတည်ပြုမှု မပြီးသေးပါ။ Code အသစ်တောင်းပြီး ပြန်ကြိုးစားပေးပါ။'
  return 'Account ချိတ်ဆက်မှု မအောင်မြင်ပါ။ Internet ကို စစ်ပြီး ပြန်ကြိုးစားပေးပါ။'
}
