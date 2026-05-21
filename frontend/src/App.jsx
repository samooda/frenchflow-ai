import { useState, useRef } from 'react'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const API_URL = 'http://localhost:8000/ask'

// ─── Level pill-tab selector with roving tabindex ──────────────────

function LevelSelector({ selected, onChange }) {
  const tabRefs = useRef([])

  function handleKeyDown(e, i) {
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % LEVELS.length
    if (e.key === 'ArrowLeft')  next = (i - 1 + LEVELS.length) % LEVELS.length
    if (next !== -1) {
      e.preventDefault()
      onChange(LEVELS[next])
      tabRefs.current[next]?.focus()
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span id="level-label" className="text-xs tracking-widest uppercase font-medium text-[var(--text-muted)]">
        Level
      </span>
      <div role="tablist" aria-labelledby="level-label" className="flex gap-1.5">
        {LEVELS.map((lvl, i) => (
          <button
            key={lvl}
            type="button"
            role="tab"
            aria-selected={selected === lvl}
            tabIndex={selected === lvl ? 0 : -1}
            ref={el => (tabRefs.current[i] = el)}
            onKeyDown={e => handleKeyDown(e, i)}
            onClick={() => onChange(lvl)}
            className="level-tab px-3.5 py-1.5 text-xs font-medium rounded-full focus-ring"
          >
            {lvl}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Shared primitives ─────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-xs tracking-widest uppercase font-medium mb-3 text-[var(--text-muted)]">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="my-8 border-t border-[var(--border)]" />
}

// ─── Loading skeleton ──────────────────────────────────────────────

function LoadingResult() {
  return (
    <div aria-busy="true" aria-label="Loading answer">
      <div className="mt-10 border-t border-[var(--border)] mb-8" />
      <div className="space-y-2.5 mb-8">
        <div className="shimmer h-3 w-12 rounded" />
        <div className="shimmer h-4 rounded" />
        <div className="shimmer h-4 rounded" />
        <div className="shimmer h-4 w-4/5 rounded" />
      </div>
      <div className="space-y-2.5">
        <div className="shimmer h-3 w-16 rounded" />
        <div className="shimmer h-4 w-3/4 rounded" />
        <div className="shimmer h-4 w-2/3 rounded" />
      </div>
    </div>
  )
}

// ─── Example item normalizer ───────────────────────────────────────

function exampleText(ex) {
  if (typeof ex === 'string') return ex
  if (ex && typeof ex === 'object') return Object.values(ex).join(' — ')
  return String(ex)
}

// ─── Success result ────────────────────────────────────────────────

function AnswerResult({ result }) {
  const examples = Array.isArray(result.examples) ? result.examples : []

  return (
    <div className="fade-in">
      <div className="mt-10 border-t border-[var(--border)] mb-8" />

      {/* Answer */}
      <section aria-label="Answer">
        <SectionLabel>Answer</SectionLabel>
        <p className="font-serif text-base leading-[1.8] text-[var(--text-primary)] text-pretty">
          {result.answer}
        </p>
      </section>

      {/* Examples */}
      {examples.length > 0 && (
        <>
          <Divider />
          <section aria-label="Examples">
            <SectionLabel>Examples</SectionLabel>
            <ul className="space-y-2.5 list-none">
              {examples.map((ex, i) => (
                <li key={i} className="flex gap-3 font-serif text-sm leading-relaxed text-[var(--text-primary)]">
                  <span className="text-[var(--text-muted)] select-none shrink-0" aria-hidden="true">—</span>
                  <span>{exampleText(ex)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* Practice question */}
      {result.practice_question && (
        <>
          <Divider />
          <section aria-label="Practice question">
            <SectionLabel>Practice</SectionLabel>
            <div className="bg-[var(--accent-subtle)] rounded-lg px-5 py-4">
              <p className="font-serif text-base leading-[1.8] text-[var(--text-primary)]">
                {result.practice_question}
              </p>
            </div>
          </section>
        </>
      )}

      {/* Source snippet */}
      {result.source_snippet && (
        <>
          <Divider />
          <section aria-label="Source">
            <SectionLabel>Source</SectionLabel>
            <p className="text-sm italic leading-relaxed text-[var(--text-muted)]">
              {result.source_snippet}
            </p>
          </section>
        </>
      )}
    </div>
  )
}

// ─── Main app ──────────────────────────────────────────────────────

export default function App() {
  const [question, setQuestion] = useState('')
  const [level, setLevel]       = useState('Beginner')
  const [status, setStatus]     = useState('idle')
  const [result, setResult]     = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const isLoading = status === 'loading'
  const canSubmit = question.trim().length > 0 && !isLoading

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setStatus('loading')
    setResult(null)
    setErrorMsg('')

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), level: level.toLowerCase() }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult(data)
      setStatus('success')
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <main className="max-w-[680px] mx-auto px-6 py-16 sm:py-24">

        {/* Header */}
        <header className="mb-14">
          <h1 className="text-2xl font-bold tracking-tight mb-1.5 text-[var(--text-primary)]">
            FrenchFlow AI
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Ask a grammar or vocabulary question. Get a structured, sourced answer.
          </p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Question textarea */}
          <div className="mb-5">
            <label
              htmlFor="question"
              className="block text-xs tracking-widest uppercase font-medium mb-2 text-[var(--text-muted)]"
            >
              Your question
            </label>
            <textarea
              id="question"
              name="question"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. When do I use imparfait vs. passé composé?"
              rows={4}
              disabled={isLoading}
              className="w-full rounded-lg px-4 py-3 text-sm leading-relaxed resize-none input-field focus-ring disabled:opacity-50"
            />
          </div>

          {/* Level selector */}
          <div className="mb-6">
            <LevelSelector selected={level} onChange={setLevel} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 px-6 text-sm font-medium rounded-lg text-white btn-accent focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Asking…' : 'Ask FrenchFlow'}
          </button>

          {/* Inline error */}
          {status === 'error' && (
            <p role="alert" className="mt-3 text-sm text-center text-[var(--error)]">
              {errorMsg}
            </p>
          )}

        </form>

        {/* Results — always in DOM for aria-live to work correctly */}
        <section aria-live="polite" aria-atomic="false" aria-label="Answer">
          {isLoading && <LoadingResult />}
          {status === 'success' && result && <AnswerResult result={result} />}
        </section>

      </main>
    </div>
  )
}
