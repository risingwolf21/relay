import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type { Profile, ProjectMember, ProjectRole } from '@/types/database'

export type MemberWithProfile = ProjectMember & { profile: Profile }

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['members', projectId],
    queryFn: async (): Promise<MemberWithProfile[]> => {
      const { data: memberRows, error: memberError } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
      if (memberError) throw memberError
      if (!memberRows?.length) return []

      const userIds = memberRows.map((m) => m.user_id)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      if (profileError) throw profileError

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
      return memberRows.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) as Profile,
      }))
    },
    enabled: !!projectId,
  })
}

export function useInviteMember(projectId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: ProjectRole }) => {
      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email)
        .maybeSingle()

      if (profileError) throw profileError
      if (!targetProfile) throw new Error('No account found with that email address')

      const { error } = await supabase.from('project_members').insert({
        project_id: projectId,
        user_id: targetProfile.id,
        role,
        invited_by: user!.id,
      })
      if (error) {
        if (error.code === '23505') throw new Error('User is already a member of this project')
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      toast.success('Member added to project')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: ProjectRole }) => {
      const { error } = await supabase
        .from('project_members')
        .update({ role })
        .eq('project_id', projectId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      toast.success('Role updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      toast.success('Member removed')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
