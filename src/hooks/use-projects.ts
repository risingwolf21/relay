import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type { Project, ProjectRow } from '@/types/database'

export function useEditableProjects() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['editable-projects', user?.id],
    queryFn: async (): Promise<ProjectRow[]> => {
      const { data: memberships, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user!.id)
        .in('role', ['admin', 'editor'])
      if (memberError) throw memberError
      if (!memberships?.length) return []

      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .in('id', memberships.map((m) => m.project_id))
        .order('name')
      if (projectError) throw projectError
      return projects ?? []
    },
    enabled: !!user,
  })
}

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
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (input: CreateProjectInput): Promise<Project> => {
      const { data, error } = await supabase.rpc('create_project', {
        p_name: input.name,
        p_description: input.description ?? null,
        p_slug: input.slug,
      })
      if (error) throw error
      return data as Project
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
