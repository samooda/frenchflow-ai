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
      <>
        {/* // design-pass */}
        <p>Loading history...</p>
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
      <section aria-label="Learning history">
        {/* // design-pass */}
        <h2>History</h2>
        {entries.length === 0 ? (
          <>
            {/* // design-pass */}
            <p>No history yet.</p>
          </>
        ) : (
          <>
            {/* // design-pass */}
            <ul>
              {entries.map(entry => (
                /* // design-pass */
                <li key={entry.id}>
                  {/* // design-pass */}
                  <p>{entry.question}</p>
                  {/* // design-pass */}
                  <p>{entry.level}</p>
                  {/* // design-pass */}
                  <time dateTime={entry.created_at}>{entry.created_at}</time>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  )
}
