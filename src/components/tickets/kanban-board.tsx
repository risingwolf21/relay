import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useTickets, useReorderTickets } from '@/hooks/use-tickets'
import type { MemberWithProfile } from '@/hooks/use-members'
import type { Ticket, TicketStatus, ProjectRole } from '@/types/database'
import { TICKET_STATUSES } from '@/lib/ticket-utils'
import { KanbanColumn } from './kanban-column'
import { TicketCard } from './ticket-card'

interface KanbanBoardProps {
  projectId: string
  members: MemberWithProfile[]
  userRole: ProjectRole | null
}

export function KanbanBoard({ projectId, members, userRole }: KanbanBoardProps) {
  const { data: serverTickets = [], isLoading } = useTickets(projectId)
  const reorderTickets = useReorderTickets(projectId)

  const [localTickets, setLocalTickets] = useState<Ticket[]>([])
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Sync server state when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalTickets(serverTickets)
    }
  }, [serverTickets, isDragging])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function getTicketsByStatus(status: TicketStatus): Ticket[] {
    return localTickets
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position)
  }

  function onDragStart({ active }: DragStartEvent) {
    setIsDragging(true)
    const ticket = localTickets.find((t) => t.id === active.id)
    setActiveTicket(ticket ?? null)
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTicket = localTickets.find((t) => t.id === activeId)
    if (!activeTicket) return

    // Determine target status: either the column droppable id or the ticket's column
    const targetStatus = (TICKET_STATUSES.includes(overId as TicketStatus)
      ? overId
      : localTickets.find((t) => t.id === overId)?.status) as TicketStatus | undefined

    if (!targetStatus || activeTicket.status === targetStatus) return

    setLocalTickets((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: targetStatus } : t)),
    )
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setIsDragging(false)
    setActiveTicket(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Determine final column status
    const activeTicket = localTickets.find((t) => t.id === activeId)
    if (!activeTicket) return

    const targetStatus = (TICKET_STATUSES.includes(overId as TicketStatus)
      ? overId
      : localTickets.find((t) => t.id === overId)?.status ?? activeTicket.status) as TicketStatus

    // Get final ordering within the target column
    const columnTickets = localTickets
      .filter((t) => t.status === targetStatus)
      .sort((a, b) => a.position - b.position)

    const oldIndex = columnTickets.findIndex((t) => t.id === activeId)
    const newIndex = TICKET_STATUSES.includes(overId as TicketStatus)
      ? columnTickets.length - 1
      : columnTickets.findIndex((t) => t.id === overId)

    let reordered = columnTickets
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      reordered = arrayMove(columnTickets, oldIndex, newIndex)
    }

    const withPositions = reordered.map((t, i) => ({ ...t, position: i }))

    // Update local state
    setLocalTickets((prev) => [
      ...prev.filter((t) => t.status !== targetStatus),
      ...withPositions,
    ])

    // Find tickets that changed vs server state
    const changed = withPositions.filter((t) => {
      const server = serverTickets.find((s) => s.id === t.id)
      return !server || server.status !== t.status || server.position !== t.position
    })

    // Also include the active ticket if it changed status
    const originalActive = serverTickets.find((s) => s.id === activeId)
    if (originalActive && originalActive.status !== targetStatus) {
      const inChanged = changed.find((c) => c.id === activeId)
      if (!inChanged) {
        const finalPos = withPositions.find((t) => t.id === activeId)
        if (finalPos) changed.push(finalPos)
      }
    }

    if (changed.length > 0) {
      reorderTickets.mutate(
        changed.map((t) => ({ id: t.id, status: t.status, position: t.position })),
      )
    }
  }

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading board…</div>
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TICKET_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={getTicketsByStatus(status)}
            projectId={projectId}
            members={members}
            userRole={userRole}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket && (
          <TicketCard ticket={activeTicket} onClick={() => {}} isDragOverlay />
        )}
      </DragOverlay>
    </DndContext>
  )
}
