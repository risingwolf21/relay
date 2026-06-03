import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type { Project } from '@/types/database'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

interface CreateProjectInput {
  name: string
  description?: string
  slug: string
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (input: CreateProjectInput): Promise<Project> => {
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...input, created_by: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(`Project "${project.name}" created`)
      navigate(`/projects/${project.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
