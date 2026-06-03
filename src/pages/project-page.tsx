import { useParams } from 'react-router-dom'
import { useProject } from '@/hooks/use-projects'
import { useProjectMembers } from '@/hooks/use-members'
import { useAuth } from '@/contexts/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KanbanBoard } from '@/components/tickets/kanban-board'
import { TicketListView } from '@/components/tickets/ticket-list-view'
import { MemberList } from '@/components/projects/member-list'
import type { ProjectRole } from '@/types/database'

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const { data: project, isLoading: projectLoading } = useProject(projectId!)
  const { data: members = [] } = useProjectMembers(projectId!)

  const currentUserRole = members.find((m) => m.user_id === user?.id)?.role as ProjectRole | null

  if (projectLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-12">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-semibold">{project.name}</h1>
        {project.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{project.description}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board" className="flex-1">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          <KanbanBoard projectId={projectId!} members={members} userRole={currentUserRole} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <TicketListView projectId={projectId!} members={members} userRole={currentUserRole} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MemberList projectId={projectId!} currentUserRole={currentUserRole} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
