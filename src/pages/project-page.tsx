import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProject } from '@/hooks/use-projects'
import { useProjectMembers } from '@/hooks/use-members'
import { useAuth } from '@/contexts/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/tickets/kanban-board'
import { TicketListView } from '@/components/tickets/ticket-list-view'
import { TicketDialog } from '@/components/tickets/ticket-dialog'
import { MemberList } from '@/components/projects/member-list'
import type { ProjectRole } from '@/types/database'

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const { t } = useTranslation()
  const { data: project, isLoading: projectLoading } = useProject(projectId!)
  const { data: members = [] } = useProjectMembers(projectId!)
  const [ticketOpen, setTicketOpen] = useState(false)

  const currentUserRole = members.find((m) => m.user_id === user?.id)?.role as ProjectRole | null
  const canCreate = currentUserRole === 'admin' || currentUserRole === 'editor'

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
        <p className="text-muted-foreground">{t('projects.notFound')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Back link */}
      <Link
        to="/dashboard"
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" />
        {t('nav.dashboard')}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">{project.name}</h1>
          {project.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setTicketOpen(true)}>
            <Plus className="size-4" />
            {t('tickets.new')}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board" className="flex-1">
        <TabsList>
          <TabsTrigger value="board">{t('tabs.board')}</TabsTrigger>
          <TabsTrigger value="list">{t('tabs.list')}</TabsTrigger>
          <TabsTrigger value="members">{t('tabs.members')}</TabsTrigger>
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

      <TicketDialog
        open={ticketOpen}
        onOpenChange={setTicketOpen}
        projectId={projectId!}
        members={members}
      />
    </div>
  )
}
