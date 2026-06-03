import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useProjects } from '@/hooks/use-projects'
import { useAuth } from '@/contexts/auth-context'
import { ProjectCard } from '@/components/projects/project-card'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { Button } from '@/components/ui/button'

export function DashboardPage() {
  const { data: projects = [], isLoading } = useProjects()
  const { profile } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">
            {profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground">Manage your projects and track progress</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border bg-card" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border py-20 gap-4">
          <div className="text-center">
            <h2 className="font-medium">No projects yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a project to start tracking work
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
