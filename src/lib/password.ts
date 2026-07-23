export const PASSWORD_RULES_MSG =
  'Password must be 8–20 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'

// 8–20 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special char.
export function isValidPassword(pw: string): boolean {
  if (typeof pw !== 'string' || pw.length < 8 || pw.length > 20) return false
  if (!/[A-Z]/.test(pw)) return false
  if (!/[a-z]/.test(pw)) return false
  if (!/[0-9]/.test(pw)) return false
  if (!/[!@#$%^&*()_+\-=\[\]{};:,.?]/.test(pw)) return false
  return true
}
