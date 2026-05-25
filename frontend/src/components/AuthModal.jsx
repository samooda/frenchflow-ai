import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal({ onClose }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const isSignUp = mode === 'signUp'
  const isLoading = status === 'loading'

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
    <>
      {/* // design-pass */}
      <div role="dialog" aria-modal="true" aria-labelledby="auth-title">
        {/* // design-pass */}
        <h2 id="auth-title">{isSignUp ? 'Create account' : 'Sign in'}</h2>

        {/* // design-pass */}
        <form onSubmit={handleSubmit}>
          {/* // design-pass */}
          <label htmlFor="auth-email">Email</label>
          {/* // design-pass */}
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          {/* // design-pass */}
          <label htmlFor="auth-password">Password</label>
          {/* // design-pass */}
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          {/* // design-pass */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Working...' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        {/* // design-pass */}
        <button
          type="button"
          onClick={() => {
            setMode(isSignUp ? 'signIn' : 'signUp')
            setMessage('')
            setStatus('idle')
          }}
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>

        {/* // design-pass */}
        <button type="button" onClick={onClose}>
          Close
        </button>

        {message && (
          <>
            {/* // design-pass */}
            <p role={status === 'error' ? 'alert' : 'status'}>{message}</p>
          </>
        )}
      </div>
    </>
  )
}
