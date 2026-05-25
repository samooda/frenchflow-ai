import { useEffect, useState } from 'react'
import { useHistory } from '../hooks/useHistory'

export default function HistoryList() {
  const { fetchHistory } = useHistory()
  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      setStatus('loading')
      const { data, error } = await fetchHistory()

      if (!isMounted) return
      if (error) {
        setErrorMsg(error.message)
        setStatus('error')
        return
      }

      setEntries(data ?? [])
      setStatus('success')
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [fetchHistory])

  if (status === 'loading') {
    return (
      <div aria-busy="true" aria-label="Loading history" className="mb-8 space-y-2.5">
        <div className="shimmer h-3 w-16 rounded" />
        <div className="shimmer h-4 rounded" />
        <div className="shimmer h-4 w-3/4 rounded" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <p role="alert" className="mb-8 text-sm text-[var(--error)]">
        {errorMsg}
      </p>
    )
  }

  return (
    <section aria-label="Learning history" className="mb-8">
      <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)] mb-4">
        History
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-6">
          No questions asked yet.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {entries.map(entry => (
            <li key={entry.id} className="py-4 flex flex-col gap-1.5">
              <p className="font-serif text-sm leading-relaxed text-[var(--text-primary)]">
                {entry.question}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.7rem] font-medium px-2.5 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] capitalize">
                  {entry.level}
                </span>
                <time
                  dateTime={entry.created_at}
                  className="text-xs text-[var(--text-muted)]"
                >
                  {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
