import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type { Ticket, TicketStatus, TicketPriority, RecurrenceFrequency } from '@/types/database'

export function useTickets(projectId: string) {
  return useQuery({
    queryKey: ['tickets', projectId],
    queryFn: async (): Promise<Ticket[]> => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, assignee:profiles!tickets_assignee_id_fkey(*), labels:ticket_labels(label_id, label:labels(*))')
        .eq('project_id', projectId)
        .order('status')
        .order('position')
      if (error) throw error
      return (data ?? []) as unknown as Ticket[]
    },
    enabled: !!projectId,
  })
}

interface CreateTicketInput {
  project_id: string
  title: string
  description?: string
  status: TicketStatus
  priority: TicketPriority
  assignee_id?: string | null
  due_date?: string | null
  recurrence_frequency?: RecurrenceFrequency | null
  parent_ticket_id?: string | null
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateTicketInput): Promise<Ticket> => {
      const { data: existing } = await supabase
        .from('tickets')
        .select('position')
        .eq('project_id', input.project_id)
        .eq('status', input.status)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()

      const position = existing ? (existing.position as number) + 1 : 0

      const { data, error } = await supabase
        .from('tickets')
        .insert({ ...input, created_by: user!.id, position })
        .select('*, assignee:profiles!tickets_assignee_id_fkey(*), labels:ticket_labels(label_id, label:labels(*))')
        .single()
      if (error) throw error
      return data as unknown as Ticket
    },
    onSuccess: (ticket, input) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticket.project_id] })
      if (input.parent_ticket_id) {
        queryClient.invalidateQueries({ queryKey: ['sub-tickets', input.parent_ticket_id] })
      }
      toast.success('Ticket created')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

interface UpdateTicketInput {
  id: string
  project_id: string
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  assignee_id?: string | null
  position?: number
  due_date?: string | null
  recurrence_frequency?: RecurrenceFrequency | null
  parent_ticket_id?: string | null
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, project_id, ...updates }: UpdateTicketInput): Promise<Ticket> => {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select('*, assignee:profiles!tickets_assignee_id_fkey(*), labels:ticket_labels(label_id, label:labels(*))')
        .single()
      if (error) throw error
      return data as unknown as Ticket
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticket.project_id] })
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] })
      if (ticket.parent_ticket_id) {
        queryClient.invalidateQueries({ queryKey: ['sub-tickets', ticket.parent_ticket_id] })
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from('tickets').delete().eq('id', id)
      if (error) throw error
      return project_id
    },
    onSuccess: (project_id) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', project_id] })
      toast.success('Ticket deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useAllTickets() {
  return useQuery({
    queryKey: ['all-tickets'],
    queryFn: async (): Promise<Ticket[]> => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, assignee:profiles!tickets_assignee_id_fkey(*), labels:ticket_labels(label_id, label:labels(*))')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as Ticket[]
    },
  })
}

export function useSubTickets(ticketId: string) {
  return useQuery({
    queryKey: ['sub-tickets', ticketId],
    queryFn: async (): Promise<Ticket[]> => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, assignee:profiles!tickets_assignee_id_fkey(*), labels:ticket_labels(label_id, label:labels(*))')
        .eq('parent_ticket_id', ticketId)
        .is('recurrence_frequency', null)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as unknown as Ticket[]
    },
    enabled: !!ticketId,
  })
}

export function useReorderTickets(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tickets: Array<{ id: string; status: TicketStatus; position: number }>) => {
      await Promise.all(
        tickets.map(({ id, status, position }) =>
          supabase.from('tickets').update({ status, position }).eq('id', id),
        ),
      )
    },
    onMutate: async (tickets) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', projectId] })
      const previous = queryClient.getQueryData<Ticket[]>(['tickets', projectId])
      if (previous) {
        queryClient.setQueryData<Ticket[]>(['tickets', projectId], (old) =>
          old?.map((t) => {
            const update = tickets.find((u) => u.id === t.id)
            return update ? { ...t, ...update } : t
          }) ?? [],
        )
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tickets', projectId], context.previous)
      }
      toast.error('Failed to reorder tickets')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', projectId] })
    },
  })
}
