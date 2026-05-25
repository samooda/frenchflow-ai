import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const emailRef = useRef(null)

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: authError } = await signIn(email.trim(), password)

    if (authError) {
      setError(authError.message ?? 'Sign in failed. Please try again.')
      setSubmitting(false)
      emailRef.current?.focus()
      return
    }

    navigate('/')
  }

  return (
    <main className="max-w-[680px] mx-auto px-6 py-16 sm:py-20 flex justify-center">
      <div className="w-full max-w-[400px] bg-[var(--surface)] border border-[var(--border)] rounded-lg p-8">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-[var(--text-primary)]">
          Sign in
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
              autoComplete="current-password"
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
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-sm text-[var(--text-muted)] text-center">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[var(--accent)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
