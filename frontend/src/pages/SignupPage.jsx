import { useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const { user, loading, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const emailRef = useRef(null)

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: authError } = await signUp(email.trim(), password)

    if (authError) {
      setError(authError.message ?? 'Sign up failed. Please try again.')
      setSubmitting(false)
      emailRef.current?.focus()
      return
    }

    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <main className="max-w-[680px] mx-auto px-6 py-16 sm:py-20 flex justify-center">
        <div className="w-full max-w-[400px] bg-[var(--surface)] border border-[var(--border)] rounded-lg p-8">
          <h1 className="text-2xl font-bold tracking-tight mb-4 text-[var(--text-primary)]">
            Check your email
          </h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            We sent a confirmation link to <strong className="text-[var(--text-primary)]">{email}</strong>.
            Click it to activate your account, then{' '}
            <Link to="/login" className="text-[var(--accent)] hover:underline">
              sign in
            </Link>
            .
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-[680px] mx-auto px-6 py-16 sm:py-20 flex justify-center">
      <div className="w-full max-w-[400px] bg-[var(--surface)] border border-[var(--border)] rounded-lg p-8">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-[var(--text-primary)]">
          Sign up
        </h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-xs tracking-widest uppercase font-medium mb-2 text-[var(--text-muted)]"
            >
              Email
            </label>
            <input
              ref={emailRef}
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={submitting}
              required
              className="w-full rounded-lg px-4 py-3 text-sm leading-[1.625] input-field focus-ring disabled:opacity-50"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-xs tracking-widest uppercase font-medium mb-2 text-[var(--text-muted)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={submitting}
              required
              className="w-full rounded-lg px-4 py-3 text-sm leading-[1.625] input-field focus-ring disabled:opacity-50"
            />
          </div>

          {error && (
            <p role="alert" className="mb-4 text-sm text-[var(--error)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full py-3 px-6 text-sm font-medium rounded-lg text-white btn-accent focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-sm text-[var(--text-muted)] text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
