/**
 * @prostream/shared — phone normalisation utilities
 *
 * Handles Sri Lankan and international mobile number formats.
 * Used by SMS sending, OTP storage and profile validation.
 */

/**
 * Normalise a mobile number to E.164 international format.
 *
 * Accepts:
 *   077...       → +9477...
 *   0094 77...   → +9477...
 *   94 77...     → +9477...
 *   +94 77...    → +9477...   (strips spaces/dashes/parens)
 *
 * Non-Sri-Lankan numbers with a leading + are passed through unchanged
 * (spaces/dashes stripped).
 */
export function normalizeMobile(raw: string): string {
  const digits = raw.replace(/[\s\-().]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('0094')) return '+' + digits.slice(2)
  if (digits.startsWith('94') && digits.length >= 11) return '+' + digits
  if (digits.startsWith('0') && digits.length === 10) return '+94' + digits.slice(1)
  return digits
}

/**
 * Returns true if the value looks like a valid E.164 number.
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,19}$/.test(phone)
}

/**
 * Returns a masked version of a phone number for display.
 * e.g. +94771234567 → +9477****567
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-3)
}
