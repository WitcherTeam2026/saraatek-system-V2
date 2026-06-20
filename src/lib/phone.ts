/**
 * Sri Lankan phone number helpers.
 *
 * Canonical storage format: "+94 7X XXX XXXX" (or "+94 XX XXX XXXX" for
 * landlines). We always normalize on the way in, so every screen that reads
 * `customer.phone` from the database already gets a nicely formatted value
 * and never has to re-format it.
 */

const COUNTRY_CODE = '94'

/** Strip everything except digits. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Normalize any Sri Lankan phone number input into "+94 7X XXX XXXX" form.
 * Accepts local format (0771234567), already-international (+94771234567,
 * 94771234567), or loosely spaced/punctuated variants.
 *
 * Returns null if the input doesn't contain a plausible SL number (after
 * normalization the national number isn't exactly 9 digits).
 */
export function formatSriLankanPhone(raw: string): string | null {
  let digits = digitsOnly(raw)
  if (!digits) return null

  if (digits.startsWith(COUNTRY_CODE)) {
    digits = digits.slice(COUNTRY_CODE.length)
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  // National significant number for SL mobiles/landlines is 9 digits, e.g. 771234567
  if (digits.length !== 9) return null

  const part1 = digits.slice(0, 2)
  const part2 = digits.slice(2, 5)
  const part3 = digits.slice(5, 9)
  return `+94 ${part1} ${part2} ${part3}`
}

/**
 * Best-effort formatter for display purposes. Falls back to the raw
 * value (trimmed) if it doesn't look like a valid SL number, so we never
 * hide or corrupt data the technician already saved.
 */
export function displayPhone(raw: string | null | undefined): string {
  if (!raw) return '-'
  return formatSriLankanPhone(raw) || raw
}

/** True if the input normalizes to a valid Sri Lankan number. */
export function isValidSriLankanPhone(raw: string): boolean {
  return formatSriLankanPhone(raw) !== null
}
