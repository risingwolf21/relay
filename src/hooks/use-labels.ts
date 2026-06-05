import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Label } from '@/types/database'

export function useLabels(projectId: string) {
  return useQuery({
    queryKey: ['labels', projectId],
    queryFn: async (): Promise<Label[]> => {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('project_id', projectId)
        .order('name')
      if (error) throw error
      return (data ?? []) as Label[]
    },
    enabled: !!projectId,
  })
}

export function useCreateLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, name, color }: { projectId: string; name: string; color: string }): Promise<Label> => {
      const { data, error } = await supabase
        .from('labels')
        .insert({ project_id: projectId, name, color })
        .select()
        .single()
      if (error) throw error
      return data as Label
    },
    onSuccess: (label) => {
      queryClient.invalidateQueries({ queryKey: ['labels', label.project_id] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('labels').delete().eq('id', id)
      if (error) throw error
      return projectId
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['labels', projectId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useAddTicketLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, labelId }: { ticketId: string; labelId: string }) => {
      const { error } = await supabase
        .from('ticket_labels')
        .insert({ ticket_id: ticketId, label_id: labelId })
      if (error) throw error
    },
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useRemoveTicketLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, labelId }: { ticketId: string; labelId: string }) => {
      const { error } = await supabase
        .from('ticket_labels')
        .delete()
        .eq('ticket_id', ticketId)
        .eq('label_id', labelId)
      if (error) throw error
    },
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
