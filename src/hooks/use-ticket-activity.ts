import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile, TicketActivity } from '@/types/database'

export type DashboardActivityItem = {
  id: string
  ticket_id: string
  user_id: string | null
  type: string
  created_at: string
  actor: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
  ticket: { id: string; title: string; project_id: string } | null
}

export function useDashboardActivity(limit = 10) {
  return useQuery({
    queryKey: ['dashboard-activity', limit],
    queryFn: async (): Promise<DashboardActivityItem[]> => {
      const { data, error } = await supabase
        .from('ticket_activity')
        .select(
          'id, ticket_id, user_id, type, created_at, actor:profiles!ticket_activity_user_id_fkey(id, full_name, email, avatar_url), ticket:tickets(id, title, project_id)',
        )
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as unknown as DashboardActivityItem[]
    },
  })
}

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
