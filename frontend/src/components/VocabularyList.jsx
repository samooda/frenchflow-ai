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
      <>
        {/* // design-pass */}
        <p>Loading vocabulary...</p>
      </>
    )
  }

  if (status === 'error') {
    return (
      <>
        {/* // design-pass */}
        <p role="alert">{errorMsg}</p>
      </>
    )
  }

  return (
    <>
      {/* // design-pass */}
      <section aria-label="Saved vocabulary">
        {/* // design-pass */}
        <h2>Vocabulary</h2>
        {entries.length === 0 ? (
          <>
            {/* // design-pass */}
            <p>No saved vocabulary yet.</p>
          </>
        ) : (
          <>
            {/* // design-pass */}
            <ul>
              {entries.map(entry => (
                /* // design-pass */
                <li key={entry.id}>
                  {/* // design-pass */}
                  <p>{entry.word}</p>
                  {/* // design-pass */}
                  <p>{entry.definition}</p>
                  {/* // design-pass */}
                  <p>{entry.example}</p>
                  {/* // design-pass */}
                  <button type="button" onClick={() => handleDelete(entry.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  )
}
