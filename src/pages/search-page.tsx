import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit2, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useSavedSearch, useDeleteSavedSearch } from '@/hooks/use-saved-searches'
import { useProjectMembers } from '@/hooks/use-members'
import { SavedSearchDialog } from '@/components/search/saved-search-dialog'
import { TicketDetailSheet } from '@/components/tickets/ticket-detail-sheet'
import { priorityConfig, statusConfig, formatDate } from '@/lib/ticket-utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/ticket-utils'
import type { Ticket, SearchFilters, ProjectRole } from '@/types/database'

function useSearchResults(filters: SearchFilters | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['search-results', filters, userId],
    queryFn: async (): Promise<Ticket[]> => {
      if (!filters) return []
      let query = supabase
        .from('tickets')
        .select('*, assignee:profiles!tickets_assignee_id_fkey(*)')
        .order('created_at', { ascending: false })
      if (filters.project_ids.length > 0) query = query.in('project_id', filters.project_ids)
      if (filters.statuses.length > 0) query = query.in('status', filters.statuses)
      if (filters.priorities.length > 0) query = query.in('priority', filters.priorities)
      if (filters.assignee_me && userId) query = query.eq('assignee_id', userId)
      if (filters.text) query = query.ilike('title', `%${filters.text}%`)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as unknown as Ticket[]
    },
    enabled: !!filters,
  })
}

export function SearchPage() {
  const { searchId } = useParams<{ searchId: string }>()
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: search, isLoading: searchLoading } = useSavedSearch(searchId!)
  const { data: tickets = [], isLoading: resultsLoading } = useSearchResults(search?.filters, user?.id)
  const deleteSearch = useDeleteSavedSearch()

  const [editOpen, setEditOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: members = [] } = useProjectMembers(selectedTicket?.project_id ?? '')
  const userRole = members.find((m) => m.user_id === user?.id)?.role as ProjectRole | null

  async function handleDelete() {
    await deleteSearch.mutateAsync(searchId!)
    navigate('/dashboard')
  }

  if (searchLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  if (!search) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-12">
        <p className="text-muted-foreground">{t('search.notFound')}</p>
      </div>
    )
  }

  const isLoading = resultsLoading

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">{search.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isLoading
              ? t('search.searching')
              : t('tickets.count', { count: tickets.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Edit2 className="size-4" />
            {t('common.edit')}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteSearch.isPending}
          >
            <Trash2 className="size-4" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* Active filter chips */}
      <div className="flex flex-wrap gap-2">
        {search.filters.statuses.map((s) => (
          <span key={s} className={`rounded-full px-2.5 py-0.5 text-xs ${statusConfig[s].className}`}>
            {t(`status.${s}`)}
          </span>
        ))}
        {search.filters.priorities.map((p) => (
          <span key={p} className={`rounded-full px-2.5 py-0.5 text-xs ${priorityConfig[p].className}`}>
            {t(`priority.${p}`)}
          </span>
        ))}
        {search.filters.assignee_me && (
          <span className="rounded-full border px-2.5 py-0.5 text-xs">{t('search.assignedToMeChip')}</span>
        )}
        {search.filters.text && (
          <span className="rounded-full border px-2.5 py-0.5 text-xs">
            {t('search.titleFilter', { text: search.filters.text })}
          </span>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-muted-foreground">{t('search.noResults')}</p>
          <button
            onClick={() => setEditOpen(true)}
            className="text-sm underline text-muted-foreground hover:text-foreground"
          >
            {t('search.adjustFilters')}
          </button>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {tickets.map((ticket) => {
            const PriorityIcon = priorityConfig[ticket.priority].icon
            return (
              <div
                key={ticket.id}
                className="flex cursor-pointer items-center gap-3 p-3 hover:bg-accent/50 transition-colors"
                onClick={() => { setSelectedTicket(ticket); setSheetOpen(true) }}
              >
                <PriorityIcon className={`size-4 shrink-0 ${priorityConfig[ticket.priority].className}`} />
                <span className="flex-1 truncate text-sm font-medium">{ticket.title}</span>
                <Badge className={`shrink-0 text-xs ${statusConfig[ticket.status].className}`}>
                  {t(`status.${ticket.status}`)}
                </Badge>
                {ticket.assignee && (
                  <Avatar className="size-6 shrink-0">
                    <AvatarImage src={ticket.assignee.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(ticket.assignee.full_name, ticket.assignee.email ?? '')}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(ticket.created_at)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <SavedSearchDialog open={editOpen} onOpenChange={setEditOpen} existing={search} />
      <TicketDetailSheet
        ticket={selectedTicket}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        members={members}
        userRole={userRole}
      />
    </div>
  )
}
