'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Step = 'email' | 'otp'

export default function LoginForm() {
  const OTP_LENGTH = 6
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const redirect = searchParams.get('redirect') || '/'

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('OTP sent!', { description: `Check your inbox at ${email}` })
      setStep('otp')
    }
  }

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < OTP_LENGTH) return
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    setLoading(false)
    if (error) {
      toast.error('Invalid or expired OTP. Please try again.')
    } else {
      toast.success('Signed in successfully!')
      router.push(redirect)
      router.refresh()
    }
  }

  const handleOtpChange = (i: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setOtp((prev) => {
      const next = [...prev]
      next[i] = digit
      return next
    })
    if (digit && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputsRef.current[i - 1]?.focus()
      setOtp((prev) => {
        const next = [...prev]
        next[i - 1] = ''
        return next
      })
    }
    if (e.key === 'ArrowLeft' && i > 0) inputsRef.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH).split('')
    if (digits.length === 0) return
    const next = Array(OTP_LENGTH).fill('')
    digits.forEach((d, idx) => { next[idx] = d })
    setOtp(next)
    inputsRef.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus()
  }

  const resetOtp = () => setOtp(Array(OTP_LENGTH).fill(''))

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold text-rose-700">Dyuthi</span>
            <p className="text-xs text-gray-500 tracking-widest uppercase">Pattu Sarees</p>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'email' ? 'Sign in to your account' : 'Enter verification code'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {step === 'email'
              ? "We'll send a one-time code to your email"
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {step === 'email' ? (
            <form onSubmit={sendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Enter OTP code</label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputsRef.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[i]}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                      className="w-11 h-14 sm:w-12 text-center text-2xl font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2185B] focus:border-[#C2185B] transition-all"
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || otp.join('').length < OTP_LENGTH}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Sign In'}
              </Button>
              <button
                type="button"
                onClick={() => { setStep('email'); resetOtp() }}
                className="w-full flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-rose-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Change email
              </button>
              <button
                type="button"
                onClick={sendOTP}
                disabled={loading}
                className="w-full text-sm text-rose-600 hover:text-rose-700 transition-colors"
              >
                Resend OTP
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing in, you agree to our{' '}
          <a href="#" className="text-rose-600 hover:underline">Terms</a> and{' '}
          <a href="#" className="text-rose-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
