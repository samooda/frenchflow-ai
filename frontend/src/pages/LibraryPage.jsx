import { useRef, useState } from 'react'
import HistoryList from '../components/HistoryList'
import VocabularyList from '../components/VocabularyList'

const TABS = ['History', 'Vocabulary']

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('History')
  const tabRefs = useRef([])

  function handleKeyDown(e, i) {
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length
    if (e.key === 'ArrowLeft')  next = (i - 1 + TABS.length) % TABS.length
    if (next !== -1) {
      e.preventDefault()
      setActiveTab(TABS[next])
      tabRefs.current[next]?.focus()
    }
  }

  return (
    <main className="max-w-[680px] mx-auto px-6 py-16 sm:py-20">
      <h1 className="text-xs tracking-widest uppercase font-medium mb-4 text-[var(--text-muted)]">
        Library
      </h1>

      {/* Tab bar */}
      <div role="tablist" aria-label="Library sections" className="flex gap-1.5">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`library-tab-${tab}`}
            aria-selected={activeTab === tab}
            aria-controls="library-panel"
            tabIndex={activeTab === tab ? 0 : -1}
            ref={el => (tabRefs.current[i] = el)}
            onKeyDown={e => handleKeyDown(e, i)}
            onClick={() => setActiveTab(tab)}
            className="level-tab px-3.5 py-1.5 text-xs font-medium rounded-full focus-ring"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-5 border-t border-[var(--border)]" />

      <div
        id="library-panel"
        role="tabpanel"
        aria-labelledby={`library-tab-${activeTab}`}
        className="mt-8"
      >
        {activeTab === 'History'    && <HistoryList />}
        {activeTab === 'Vocabulary' && <VocabularyList />}
      </div>
    </main>
  )
}
