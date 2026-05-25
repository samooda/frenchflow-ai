import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function useVocabulary() {
  const { user } = useAuth()

  const saveWord = useCallback(async ({ word, definition, example }) => {
    if (!user) return { data: null, error: null }

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.access_token) return { data: null, error: null }

    return supabase
      .from('saved_vocabulary')
      .insert({
        user_id: user.id,
        word,
        definition,
        example,
      })
  }, [user])

  const fetchVocabulary = useCallback(async () => {
    if (!user) return { data: [], error: null }

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.access_token) return { data: [], error: null }

    return supabase
      .from('saved_vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  }, [user])

  const deleteWord = useCallback(async (id) => {
    if (!user) return { data: null, error: null }

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.access_token) return { data: null, error: null }

    return supabase
      .from('saved_vocabulary')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
  }, [user])

  return { saveWord, fetchVocabulary, deleteWord }
}
