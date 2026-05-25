import { useEffect, useState } from 'react'
import { useHistory } from '../hooks/useHistory'

function HistorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading history" className="divide-y divide-[var(--border)]">
      {[0, 1, 2].map(i => (
        <div key={i} className="py-4 space-y-2.5">
          <div className="shimmer h-4 rounded w-full" />
          <div className="shimmer h-4 rounded w-3/4" />
          <div className="flex items-center justify-between pt-0.5">
            <div className="shimmer h-3 w-16 rounded-full" />
            <div className="shimmer h-3 w-10 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

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

  if (status === 'loading') return <HistorySkeleton />

  if (status === 'error') {
    return (
      <p role="alert" className="text-sm text-[var(--error)]">
        {errorMsg}
      </p>
    )
  }

  return (
    <section aria-label="Learning history">
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">
          No questions yet. Ask something on the home page to start your history.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {entries.map(entry => (
            <li key={entry.id} className="py-4 flex flex-col gap-2">
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
