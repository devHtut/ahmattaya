const MYANMAR_DIGITS = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉']

export function toMyanmarDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => MYANMAR_DIGITS[Number(d)] ?? d)
}

export const MYANMAR_MONTHS = [
  'ဇန်နဝါရီလ',
  'ဖေဖော်ဝါရီလ',
  'မတ်လ',
  'ဧပြီလ',
  'မေလ',
  'ဇွန်လ',
  'ဇူလိုင်လ',
  'ဩဂုတ်လ',
  'စက်တင်ဘာလ',
  'အောက်တိုဘာလ',
  'နိုဝင်ဘာလ',
  'ဒီဇင်ဘာလ',
]

export const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function parseMyanmarDateToEnglish(str: string): string {
  if (!str) return ''
  const myanmarToAscii = (s: string) =>
    s.replace(/[၀-၉]/g, (d) => String('၀၁၂၃၄၅၆၇၈၉'.indexOf(d)))
  const match = str.match(/^([၀-၉\d]+)\s*ခုနှစ်[၊,\s]+(.+?)\s+([၀-၉\d]+)\s*ရက်$/)
  if (match) {
    const year = myanmarToAscii(match[1])
    const monthText = match[2].trim()
    const day = myanmarToAscii(match[3])
    const monthIdx = MYANMAR_MONTHS.findIndex(
      (m) => monthText.includes(m.replace('လ', '')) || m.includes(monthText),
    )
    if (monthIdx !== -1) {
      return `${parseInt(day, 10)} ${ENGLISH_MONTHS[monthIdx]} ${year}`
    }
  }
  return str
}

export function formatEnglishDate(dateStr: string): string {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [yearStr, monthStr, dayStr] = dateStr.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)
    const day = parseInt(dayStr, 10)
    const monthName = ENGLISH_MONTHS[month - 1] ?? ''
    return `${day} ${monthName} ${year}`
  }
  return parseMyanmarDateToEnglish(dateStr)
}

export function formatMyanmarDate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate
  const [yearStr, monthStr, dayStr] = isoDate.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  const monthName = MYANMAR_MONTHS[month - 1] ?? `${month} လ`
  return `${toMyanmarDigits(year)} ခုနှစ်၊ ${monthName} ${toMyanmarDigits(day)} ရက်`
}

export function calcAnniversaryDuration(startDateStr: string, endDate = new Date()) {
  const start = new Date(startDateStr)
  if (isNaN(start.getTime())) {
    return {
      years: 1,
      months: 0,
      days: 365,
      totalDays: 365,
      formattedYearsMonths: '၁ နှစ်ပြည့်',
      formattedDays: '၃၆၅ ရက်မြောက်နေ့',
      durationTextYearsMonths: '၁ နှစ်ပြည့်',
      durationTextDays: '၃၆၅ ရက်မြောက်နေ့',
    }
  }

  const diffTime = endDate.getTime() - start.getTime()
  const totalDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))

  let years = endDate.getFullYear() - start.getFullYear()
  let months = endDate.getMonth() - start.getMonth()
  if (endDate.getDate() < start.getDate()) {
    months -= 1
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (years < 0) {
    years = 0
    months = 0
  }

  let formattedYearsMonths: string
  if (years > 0 && months > 0) {
    formattedYearsMonths = `${toMyanmarDigits(years)} နှစ် ${toMyanmarDigits(months)} လ`
  } else if (years > 0 && months === 0) {
    formattedYearsMonths = `${toMyanmarDigits(years)} နှစ်ပြည့်`
  } else if (years === 0 && months > 0) {
    formattedYearsMonths = `${toMyanmarDigits(months)} လပြည့်`
  } else {
    formattedYearsMonths = `${toMyanmarDigits(totalDays)} ရက်မြောက်နေ့`
  }

  const formattedDays = `${toMyanmarDigits(totalDays)} ရက်မြောက်နေ့`

  return {
    years,
    months,
    days: totalDays,
    totalDays,
    formattedYearsMonths,
    formattedDays,
    durationTextYearsMonths: formattedYearsMonths,
    durationTextDays: formattedDays,
  }
}

