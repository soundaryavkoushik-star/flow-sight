const knownMerchants: Array<[RegExp, string]> = [
  [/\bspotify\b/i, "Spotify"],
  [/\bnetflix\b/i, "Netflix"],
  [/\bamazon(?:\.com)?\b|\bamzn\b/i, "Amazon"],
  [/\bharbor\s+view\b.*\b(?:apts?|apartments?)\b/i, "Harbor View Apartments"],
  [/\bcity\s+power\s+(?:&|and|light)\b|\bcity\s+power\s+light\b/i, "City Power & Light"],
  [/\bnorthstar\s+studio\b.*\bpayrol(?:l)?\b/i, "Northstar Studio Payroll"],
]

const bankLanguage = /\b(?:recurring|ach|pos|online|internet|card)\s+(?:payment|purchase|debit|credit)\b|\b(?:payment|purchase|debit|credit)\b/gi
const referenceNoise = /\b(?:pymt|bill|autopay|dir\s+dep)\b|\b\d{4,}\b|\b\d{3}-\d{3}-\d{4}\b|\b(?:com|net|org)\b/gi
const locationSuffix = /\s+(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$/i

export function merchantDisplayName(description: string) {
  const raw = description.trim()
  if (!raw) return "Unnamed transaction"

  const known = knownMerchants.find(([pattern]) => pattern.test(raw))
  if (known) return known[1]

  // Preserve names a person has already written naturally. Bank exports are
  // typically all caps; title-casing mixed-case manual labels would rewrite
  // the user's wording (for example, “Monthly salary”).
  if (/[a-z]/.test(raw)) return raw

  const cleaned = raw
    .replace(bankLanguage, " ")
    .replace(referenceNoise, " ")
    .replace(/[*/_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(locationSuffix, "")

  if (!cleaned) return raw
  return cleaned
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
