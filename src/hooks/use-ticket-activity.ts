import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TicketActivity } from '@/types/database'

export function useTicketActivity(ticketId: string) {
  return useQuery({
    queryKey: ['activity', ticketId],
    queryFn: async (): Promise<TicketActivity[]> => {
      const { data, error } = await supabase
        .from('ticket_activity')
        .select('*, actor:profiles!ticket_activity_user_id_fkey(*)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as TicketActivity[]
    },
    enabled: !!ticketId,
  })
}
