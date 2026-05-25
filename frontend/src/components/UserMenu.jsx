import { useAuth } from '../context/AuthContext'

export default function UserMenu() {
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <>
      {/* // design-pass */}
      <div>
        {/* // design-pass */}
        <span>{user.email}</span>
        {/* // design-pass */}
        <button type="button" onClick={signOut}>
          Sign out
        </button>
      </div>
    </>
  )
}
