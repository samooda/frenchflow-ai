import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal({ onClose }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const emailRef = useRef(null)

  const isSignUp = mode === 'signUp'
  const isLoading = status === 'loading'

  useEffect(() => {
    emailRef.current?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const authAction = isSignUp ? signUp : signIn
    const { error } = await authAction(email.trim(), password)

    if (error) {
      setMessage(error.message)
      setStatus('error')
      return
    }

    setStatus('success')
    setMessage(isSignUp ? 'Check your email to confirm your account.' : '')
    if (!isSignUp) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,18,24,0.45)]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative w-full max-w-[400px] mx-4 bg-[var(--surface)] rounded-lg p-8 shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="focus-ring absolute top-4 right-4 text-xl leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150"
        >
          ×
        </button>

        <h2
          id="auth-title"
          className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-6"
        >
          {isSignUp ? 'Create account' : 'Sign in'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-medium uppercase tracking-widest text-[var(--text-muted)] mb-1.5"
            >
              Email
            </label>
            <input
              ref={emailRef}
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="input-field focus-ring w-full rounded-lg px-4 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-medium uppercase tracking-widest text-[var(--text-muted)] mb-1.5"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="input-field focus-ring w-full rounded-lg px-4 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 text-sm font-medium rounded-lg text-white btn-accent focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Working...' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(isSignUp ? 'signIn' : 'signUp')
            setMessage('')
            setStatus('idle')
          }}
          className="btn-ghost focus-ring w-full py-2.5 text-xs font-medium rounded-lg mt-3"
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>

        {message && (
          <p
            role={status === 'error' ? 'alert' : 'status'}
            className={`mt-3 text-sm ${status === 'error' ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'}`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
