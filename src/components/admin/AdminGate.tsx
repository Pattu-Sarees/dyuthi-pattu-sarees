'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Mail, ArrowLeft, Loader2, ShieldX, Lock, Eye, EyeOff, Check, Info } from 'lucide-react'
import { isValidPassword, PASSWORD_RULES_MSG } from '@/lib/password'

const OTP_LENGTH = 6
type Step = 'email' | 'create' | 'enter' | 'otp' | 'denied'

export default function AdminGate() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')     // enter step
  const [newPw, setNewPw] = useState('')           // create step
  const [confirmPw, setConfirmPw] = useState('')   // create step
  const [showPw, setShowPw] = useState(false)
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const supabase = createClient()

  const reset = () => { setStep('email'); setPassword(''); setNewPw(''); setConfirmPw(''); setOtp(Array(OTP_LENGTH).fill('')) }

  // Step 1: check the email is an admin and whether a password already exists.
  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/password-status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setLoading(false)
      if (!data.isAdmin) { setStep('denied'); return }
      setStep(data.hasPassword ? 'enter' : 'create')
    } catch { setLoading(false); toast.error('Something went wrong. Please try again.') }
  }

  // Send the email OTP (second factor) after the password step succeeds.
  const sendOtp = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('OTP sent!', { description: `Check your inbox at ${email}` })
    setStep('otp')
  }

  // Create-password step (first time).
  const createPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidPassword(newPw)) return toast.error(PASSWORD_RULES_MSG)
    if (newPw !== confirmPw) return toast.error('Passwords do not match')
    setLoading(true)
    const res = await fetch('/api/admin/verify-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: newPw }),
    })
    const data = await res.json()
    if (!data.ok) { setLoading(false); toast.error(data.error || 'Failed'); return }
    toast.success('Password created')
    await sendOtp()
  }

  // Enter-password step (returning admin).
  const enterPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    const res = await fetch('/api/admin/verify-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!data.ok) { setLoading(false); toast.error(data.error || 'Incorrect password'); return }
    await sendOtp()
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < OTP_LENGTH) return
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    setLoading(false)
    if (error) { toast.error('Invalid or expired OTP. Please try again.'); return }
    toast.success('Welcome, admin!')
    router.refresh()
  }

  const onOtpChange = (i: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setOtp((prev) => { const next = [...prev]; next[i] = digit; return next })
    if (digit && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus()
  }
  const onOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputsRef.current[i - 1]?.focus()
      setOtp((prev) => { const next = [...prev]; next[i - 1] = ''; return next })
    }
  }
  const onOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH).split('')
    if (!digits.length) return
    const next = Array(OTP_LENGTH).fill('')
    digits.forEach((d, idx) => { next[idx] = d })
    setOtp(next)
    inputsRef.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus()
  }

  if (step === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <ShieldX className="h-8 w-8 text-[#C2185B]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You cannot access this page</h1>
          <p className="text-gray-500 mb-6">This area is restricted. You don&apos;t have permission to view it.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { reset(); setEmail('') }} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors">
              Try another email
            </button>
            <Link href="/" className="px-5 py-2.5 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold transition-colors">
              Go to Store
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const subtitle = step === 'email' ? 'Enter your admin email to continue'
    : step === 'create' ? 'Create a password for your account'
    : step === 'enter' ? 'Enter your password to continue'
    : `Enter the code sent to ${email}`

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#3a0d22]">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          {step === 'email' && (
            <form onSubmit={checkEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com"
                    className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" required autoFocus />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
              </button>
            </form>
          )}

          {step === 'create' && (
            <form onSubmit={createPassword} className="space-y-4">
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" /> Password Not Created — set a password for {email} to continue.
              </div>
              <PwInput label="New password" value={newPw} onChange={setNewPw} show={showPw} setShow={setShowPw} autoFocus />
              <PwInput label="Re-type password" value={confirmPw} onChange={setConfirmPw} show={showPw} setShow={setShowPw} />
              <ul className="text-[11px] space-y-1 bg-gray-50 rounded-lg p-2.5">
                <Rule ok={newPw.length >= 8 && newPw.length <= 20}>8–20 characters</Rule>
                <Rule ok={/[A-Z]/.test(newPw)}>One uppercase letter</Rule>
                <Rule ok={/[a-z]/.test(newPw)}>One lowercase letter</Rule>
                <Rule ok={/[0-9]/.test(newPw)}>One number</Rule>
                <Rule ok={/[!@#$%^&*()_+\-=\[\]{};:,.?]/.test(newPw)}>One special character</Rule>
                <Rule ok={confirmPw.length > 0 && newPw === confirmPw}>Passwords match</Rule>
              </ul>
              <button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
              </button>
              <BackBtn onClick={() => { reset() }} />
            </form>
          )}

          {step === 'enter' && (
            <form onSubmit={enterPassword} className="space-y-4">
              <PwInput label="Password" value={password} onChange={setPassword} show={showPw} setShow={setShowPw} autoFocus />
              <button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
              </button>
              <BackBtn onClick={() => { reset() }} />
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verify} className="space-y-4">
              <div className="flex gap-2 justify-center" onPaste={onOtpPaste}>
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <input key={i} ref={(el) => { inputsRef.current[i] = el }} type="text" inputMode="numeric" maxLength={1}
                    value={otp[i]} onChange={(e) => onOtpChange(i, e.target.value)} onKeyDown={(e) => onOtpKey(i, e)} autoFocus={i === 0}
                    className="w-11 h-14 text-center text-2xl font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2185B]" />
                ))}
              </div>
              <button type="submit" disabled={loading || otp.join('').length < OTP_LENGTH} className="w-full h-11 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Enter'}
              </button>
              <BackBtn label="Change email" onClick={() => { reset() }} />
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function PwInput({ label, value, onChange, show, setShow, autoFocus }: { label: string; value: string; onChange: (v: string) => void; show: boolean; setShow: (v: boolean) => void; autoFocus?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoFocus={autoFocus} maxLength={40}
          className="w-full h-11 pl-10 pr-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" required />
        <button type="button" onClick={() => setShow(!show)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <li className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-gray-400'}`}><Check className={`h-3 w-3 ${ok ? '' : 'opacity-40'}`} /> {children}</li>
}

function BackBtn({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-[#C2185B]">
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  )
}
