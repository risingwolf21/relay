import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type { SavedSearch, SearchFilters } from '@/types/database'

export function useSavedSearches() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['saved-searches', user?.id],
    queryFn: async (): Promise<SavedSearch[]> => {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as SavedSearch[]
    },
    enabled: !!user,
  })
}

export function useSavedSearch(id: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['saved-search', id],
    queryFn: async (): Promise<SavedSearch> => {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single()
      if (error) throw error
      return data as unknown as SavedSearch
    },
    enabled: !!id && !!user,
  })
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ name, filters }: { name: string; filters: SearchFilters }) => {
      const { data, error } = await supabase
        .from('saved_searches')
        .insert({ user_id: user!.id, name, filters })
        .select()
        .single()
      if (error) throw error
      return data as unknown as SavedSearch
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
      toast.success('Search saved')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateSavedSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, filters }: { id: string; name: string; filters: SearchFilters }) => {
      const { data, error } = await supabase
        .from('saved_searches')
        .update({ name, filters })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as SavedSearch
    },
    onSuccess: (search) => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
      queryClient.invalidateQueries({ queryKey: ['saved-search', search.id] })
      toast.success('Search updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_searches').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
      toast.success('Search deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
