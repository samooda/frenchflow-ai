import { useEffect, useState } from 'react'
import { useVocabulary } from '../hooks/useVocabulary'

function VocabSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading vocabulary" className="divide-y divide-[var(--border)]">
      {[0, 1, 2].map(i => (
        <div key={i} className="py-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="shimmer h-4 w-24 rounded" />
            <div className="shimmer h-3 w-10 rounded" />
          </div>
          <div className="shimmer h-3 rounded w-full" />
          <div className="shimmer h-3 rounded w-4/5" />
          <div className="shimmer h-4 rounded w-full mt-1" />
        </div>
      ))}
    </div>
  )
}

export default function VocabularyList() {
  const { fetchVocabulary, deleteWord } = useVocabulary()
  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadVocabulary() {
      setStatus('loading')
      const { data, error } = await fetchVocabulary()

      if (!isMounted) return
      if (error) {
        setErrorMsg(error.message)
        setStatus('error')
        return
      }

      setEntries(data ?? [])
      setStatus('success')
    }

    loadVocabulary()

    return () => {
      isMounted = false
    }
  }, [fetchVocabulary])

  async function handleDelete(id) {
    const { error } = await deleteWord(id)
    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
      return
    }

    setEntries(current => current.filter(entry => entry.id !== id))
  }

  if (status === 'loading') return <VocabSkeleton />

  if (status === 'error') {
    return (
      <p role="alert" className="text-sm text-[var(--error)]">
        {errorMsg}
      </p>
    )
  }

  return (
    <section aria-label="Saved vocabulary">
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">
          No saved words yet. Hit Save on any example sentence to add it here.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {entries.map(entry => (
            <li key={entry.id} className="py-4 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {entry.word}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="focus-ring shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--error)] transition-colors duration-150"
                >
                  Remove
                </button>
              </div>
              {entry.definition && (
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {entry.definition}
                </p>
              )}
              {entry.example && entry.example !== entry.word && (
                <p className="font-serif text-sm leading-relaxed text-[var(--text-primary)] mt-0.5">
                  {entry.example}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
