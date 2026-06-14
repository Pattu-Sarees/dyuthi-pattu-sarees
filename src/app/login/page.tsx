import { Suspense } from 'react'
import LoginForm from './LoginForm'

export const metadata = { title: 'Sign In | Vibha Handloom Sarees' }

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="animate-pulse h-96 w-80 bg-gray-100 rounded-2xl" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
