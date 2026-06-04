import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type { TicketComment } from '@/types/database'

export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: ['comments', ticketId],
    queryFn: async (): Promise<TicketComment[]> => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*, author:profiles!ticket_comments_user_id_fkey(*)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as TicketComment[]
    },
    enabled: !!ticketId,
  })
}

export function useCreateComment(ticketId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({ ticket_id: ticketId, user_id: user!.id, content })
        .select('*, author:profiles!ticket_comments_user_id_fkey(*)')
        .single()
      if (error) throw error
      return data as unknown as TicketComment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteComment(ticketId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('ticket_comments').delete().eq('id', commentId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
