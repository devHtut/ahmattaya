export function guestAuthMessage(error: {
  code?: string
  status?: number
}): string {
  if (error.code === 'anonymous_provider_disabled')
    return 'Supabase မှာ Anonymous sign-in မဖွင့်ရသေးပါ။ Authentication settings မှာ Allow anonymous sign-ins ကို ဖွင့်ပေးရပါမယ်။'
  if (error.code === 'signup_disabled')
    return 'ဒီ Project မှာ အသုံးပြုသူအသစ် ဖန်တီးခြင်း ပိတ်ထားပါတယ်။ Supabase Authentication settings ကို စစ်ပေးပါ။'
  if (
    error.code === 'captcha_failed' ||
    error.code === 'captcha_verification_failed'
  )
    return 'ဒီ Project က CAPTCHA စစ်ဆေးမှု လိုအပ်နေပါတယ်။ CAPTCHA ချိတ်ဆက်မှု ထည့်ဖို့ လိုပါသေးတယ်။'
  if (error.status === 429 || error.code === 'over_request_rate_limit')
    return 'ချိတ်ဆက်မှု များနေပါတယ်။ ခဏကြာမှ ပြန်ကြိုးစားပေးပါ။'
  return 'Cloud ကို ချိတ်မရသေးပါ။ Internet နဲ့ Project settings ကို စစ်ပြီး ပြန်ကြိုးစားပေးပါ။'
}
