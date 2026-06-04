import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FolderKanban, Plus, TicketPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjects } from '@/hooks/use-projects'
import { UserNav } from './user-nav'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { TicketDialog } from '@/components/tickets/ticket-dialog'

export function Sidebar() {
  const { data: projects = [], isLoading } = useProjects()
  const [createOpen, setCreateOpen] = useState(false)
  const [ticketOpen, setTicketOpen] = useState(false)

  return (
    <aside className="flex h-svh w-56 shrink-0 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <FolderKanban className="size-5 text-sidebar-primary" />
        <span className="font-heading text-sm font-semibold">Relay</span>
      </div>

      {/* Projects nav */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setTicketOpen(true)}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              title="New ticket"
            >
              <TicketPlus className="size-3.5" />
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              title="New project"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-1 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 animate-pulse rounded-md bg-sidebar-accent" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No projects yet.
            <br />
            Create your first one!
          </p>
        ) : (
          projects.map((project) => (
            <NavLink
              key={project.id}
              to={`/projects/${project.id}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                )
              }
            >
              <span className="truncate">{project.name}</span>
            </NavLink>
          ))
        )}
      </div>

      {/* User nav */}
      <div className="shrink-0 border-t p-2">
        <UserNav />
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      <TicketDialog open={ticketOpen} onOpenChange={setTicketOpen} />
    </aside>
  )
}
