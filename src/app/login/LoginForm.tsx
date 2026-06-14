'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Step = 'email' | 'otp'

export default function LoginForm() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
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
    if (!otp.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">6-digit OTP</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-bold"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Sign In'}
              </Button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp('') }}
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
