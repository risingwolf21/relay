import { useNavigate } from 'react-router-dom'
import type { Project } from '@/types/database'
import { formatDate } from '@/lib/ticket-utils'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/projects/${project.id}`)}
      className="group flex w-full flex-col gap-3 rounded-xl border bg-card p-5 text-left shadow-xs transition-shadow hover:shadow-sm focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium leading-tight group-hover:text-primary transition-colors">
          {project.name}
        </h3>
      </div>
      {project.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
      )}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>Created {formatDate(project.created_at)}</span>
      </div>
    </button>
  )
}
