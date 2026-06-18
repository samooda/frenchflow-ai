import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useHistory } from '../hooks/useHistory'
import { useVocabulary } from '../hooks/useVocabulary'
import { supabase } from '../lib/supabase'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const API_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/ask`

// Matches rag.py's _FALLBACK answer — the backend could not ground a response.
const FALLBACK_ANSWER = 'Sorry, I could not generate an answer. Please try again.'

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
      <div role="radiogroup" aria-labelledby="level-label" className="flex gap-1.5">
        {LEVELS.map((lvl, i) => (
          <button
            key={lvl}
            type="button"
            role="radio"
            aria-checked={selected === lvl}
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

function AnswerResult({ result, canSaveExamples, onSaveExample, savedExamples }) {
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
              {examples.map((ex, i) => {
                const saved = savedExamples?.has(exampleText(ex))
                return (
                  <li key={i} className="flex gap-3 font-serif text-sm leading-relaxed text-[var(--text-primary)]">
                    <span className="text-[var(--text-muted)] select-none shrink-0" aria-hidden="true">—</span>
                    <span>{exampleText(ex)}</span>
                    {canSaveExamples && (
                      <button
                        type="button"
                        onClick={() => onSaveExample(ex)}
                        disabled={saved}
                        aria-label={saved ? 'Saved to vocabulary' : 'Save example to vocabulary'}
                        className={`btn-save focus-ring ml-auto shrink-0 self-start px-2 py-0.5 text-xs rounded-full disabled:cursor-default ${saved ? 'text-[var(--accent)]' : ''}`}
                      >
                        {saved ? 'Saved' : 'Save'}
                      </button>
                    )}
                  </li>
                )
              })}
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

// ─── Home page ─────────────────────────────────────────────────────

export default function HomePage() {
  const [question, setQuestion] = useState('')
  const [level, setLevel]       = useState('Beginner')
  const [status, setStatus]     = useState('idle')
  const [result, setResult]     = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [savedExamples, setSavedExamples] = useState(() => new Set())
  const { user } = useAuth()
  const { recordHistory } = useHistory()
  const { saveWord } = useVocabulary()

  const isLoading = status === 'loading'
  const canSubmit = question.trim().length > 0 && !isLoading

  useEffect(() => {
    if (!user) return

    let isMounted = true

    async function loadPreferredLevel() {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) return

      const { data } = await supabase
        .from('profiles')
        .select('preferred_level')
        .eq('id', user.id)
        .maybeSingle()

      if (!isMounted) return
      if (data?.preferred_level && LEVELS.includes(data.preferred_level)) {
        setLevel(data.preferred_level)
      }
    }

    loadPreferredLevel()

    return () => {
      isMounted = false
    }
  }, [user])

  async function persistPreferredLevel(nextLevel) {
    if (!user) return

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.access_token) return

    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        preferred_level: nextLevel,
      })
  }

  function handleLevelChange(nextLevel) {
    setLevel(nextLevel)
    persistPreferredLevel(nextLevel)
  }

  async function handleSaveExample(example) {
    const text = exampleText(example)
    if (savedExamples.has(text)) return

    // Optimistically mark as saved so the button gives immediate feedback and
    // can't be double-submitted into a duplicate row.
    setSavedExamples(prev => new Set(prev).add(text))

    // Saved items are example sentences, not dictionary words: store the
    // sentence itself; leave definition empty rather than dumping the answer.
    const { error } = await saveWord({
      word: text,
      definition: '',
      example: text,
    })

    if (error) {
      setSavedExamples(prev => {
        const next = new Set(prev)
        next.delete(text)
        return next
      })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setStatus('loading')
    setResult(null)
    setErrorMsg('')
    setSavedExamples(new Set())

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10_000)

      const res = await fetch(API_URL, {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), level: level.toLowerCase() }),
      })
      clearTimeout(timeoutId)

      if (res.status === 429) throw new Error('rate_limited')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      // Backend couldn't ground an answer — show a retry hint, not a blank result,
      // and don't record an empty answer to history.
      if (!data.answer?.trim() || data.answer === FALLBACK_ANSWER) {
        setErrorMsg('No grounded answer found for that question. Try rephrasing it.')
        setStatus('error')
        return
      }

      setResult(data)
      setStatus('success')

      if (user) {
        recordHistory({
          question: question.trim(),
          level,
          answer: data.answer,
          practice_question: data.practice_question,
          source_snippet: data.source_snippet,
        })
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorMsg('Request timed out — please try again.')
      } else if (err.message === 'rate_limited') {
        setErrorMsg('Too many requests — please wait a moment and try again.')
      } else {
        setErrorMsg('Something went wrong. Please try again.')
      }
      setStatus('error')
    }
  }

  return (
    <main className="max-w-[680px] mx-auto px-6 py-16 sm:py-20">
      <h1 className="sr-only">FrenchFlow AI</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Ask a grammar or vocabulary question. Get a structured, sourced answer.
      </p>

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
          <LevelSelector selected={level} onChange={handleLevelChange} />
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
        {status === 'success' && result && (
          <AnswerResult
            result={result}
            canSaveExamples={Boolean(user)}
            onSaveExample={handleSaveExample}
            savedExamples={savedExamples}
          />
        )}
      </section>
    </main>
  )
}
