import { useEffect, useState } from 'react'
import { useVocabulary } from '../hooks/useVocabulary'

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

  if (status === 'loading') {
    return (
      <div aria-busy="true" aria-label="Loading vocabulary" className="mb-8 space-y-2.5">
        <div className="shimmer h-3 w-20 rounded" />
        <div className="shimmer h-4 rounded" />
        <div className="shimmer h-4 w-2/3 rounded" />
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
    <section aria-label="Saved vocabulary" className="mb-8">
      <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)] mb-4">
        Vocabulary
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-6">
          No saved vocabulary yet.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {entries.map(entry => (
            <li key={entry.id} className="py-4 flex flex-col gap-1">
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
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                  {entry.definition}
                </p>
              )}
              {entry.example && entry.example !== entry.word && (
                <p className="font-serif text-sm leading-relaxed text-[var(--text-primary)]">
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
