import { useAuth } from '../context/AuthContext'

export default function UserMenu() {
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">
        {user.email}
      </span>
      <button
        type="button"
        onClick={signOut}
        className="btn-ghost focus-ring shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg"
      >
        Sign out
      </button>
    </div>
  )
}
