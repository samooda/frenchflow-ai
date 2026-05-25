import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_BTN = 'focus-ring px-3 py-1.5 text-xs font-medium rounded-lg inline-flex items-center'

export default function NavBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav
      className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]"
      aria-label="Site navigation"
    >
      <div className="max-w-[680px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="nav-link text-2xl font-bold tracking-tight leading-none">
          FrenchFlow AI
        </Link>

        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <NavLink
                to="/library"
                className={({ isActive }) =>
                  isActive
                    ? `${NAV_BTN} nav-btn-active`
                    : `${NAV_BTN} btn-ghost`
                }
              >
                Library
              </NavLink>

              <div className="h-4 w-px bg-[var(--border)] mx-1 shrink-0" aria-hidden="true" />

              <span
                className="text-xs text-[var(--text-muted)] max-w-[140px] truncate"
                title={user.email}
              >
                {user.email}
              </span>

              <button
                type="button"
                onClick={handleSignOut}
                className={`${NAV_BTN} btn-ghost`}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`${NAV_BTN} btn-ghost`}>
                Sign in
              </Link>
              <Link to="/signup" className={`${NAV_BTN} btn-accent text-white`}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
