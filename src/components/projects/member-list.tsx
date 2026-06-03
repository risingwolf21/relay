import { useState } from 'react'
import { UserPlus, UserMinus } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import {
  useProjectMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/hooks/use-members'
import type { ProjectRole } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/ticket-utils'

const ROLES: ProjectRole[] = ['admin', 'editor', 'viewer']

const roleBadgeVariant: Record<ProjectRole, 'default' | 'secondary' | 'muted'> = {
  admin: 'default',
  editor: 'secondary',
  viewer: 'muted',
}

interface MemberListProps {
  projectId: string
  currentUserRole: ProjectRole | null
}

export function MemberList({ projectId, currentUserRole }: MemberListProps) {
  const { user } = useAuth()
  const { data: members = [], isLoading } = useProjectMembers(projectId)
  const inviteMember = useInviteMember(projectId)
  const updateRole = useUpdateMemberRole(projectId)
  const removeMember = useRemoveMember(projectId)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<ProjectRole>('viewer')

  const isAdmin = currentUserRole === 'admin'

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole })
    setInviteEmail('')
    setInviteRole('viewer')
  }

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading members…</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Members ({members.length})</h2>
      </div>

      <div className="divide-y rounded-xl border">
        {members.map((member) => {
          const isSelf = member.user_id === user?.id
          return (
            <div key={member.user_id} className="flex items-center gap-3 p-3">
              <Avatar className="size-8">
                <AvatarImage src={member.profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(member.profile?.full_name, member.profile?.email ?? '')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.profile?.full_name || member.profile?.email}
                  {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{member.profile?.email}</p>
              </div>
              {isAdmin && !isSelf ? (
                <Select
                  value={member.role}
                  onValueChange={(role) =>
                    updateRole.mutate({ userId: member.user_id, role: role as ProjectRole })
                  }
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={roleBadgeVariant[member.role]}>
                  {member.role}
                </Badge>
              )}
              {isAdmin && !isSelf && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent">
                    <UserMinus className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => removeMember.mutate(member.user_id)}
                    >
                      <UserMinus className="size-4" />
                      Remove member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        })}
      </div>

      {isAdmin && (
        <div className="rounded-xl border p-4">
          <h3 className="mb-3 text-sm font-medium">Invite a member</h3>
          <div className="flex gap-2">
            <Input
              placeholder="user@example.com"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              className="flex-1"
            />
            <Select value={inviteRole} onValueChange={(r) => setInviteRole(r as ProjectRole)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviteMember.isPending}>
              <UserPlus className="size-4" />
              Invite
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
