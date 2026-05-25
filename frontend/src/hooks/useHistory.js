import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function useHistory() {
  const { user } = useAuth()

  const recordHistory = useCallback(async (entry) => {
    if (!user) return { data: null, error: null }

    return supabase
      .from('learning_history')
      .insert({
        user_id: user.id,
        question: entry.question,
        level: entry.level,
        answer: entry.answer,
        practice_question: entry.practice_question ?? null,
        source_snippet: entry.source_snippet ?? null,
      })
  }, [user])

  const fetchHistory = useCallback(async () => {
    if (!user) return { data: [], error: null }

    return supabase
      .from('learning_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  }, [user])

  return { recordHistory, fetchHistory }
}
