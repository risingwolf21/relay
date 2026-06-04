import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useTicketComments, useCreateComment, useDeleteComment } from '@/hooks/use-ticket-comments'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getInitials, formatDate } from '@/lib/ticket-utils'

interface TicketCommentsProps {
  ticketId: string
}

export function TicketComments({ ticketId }: TicketCommentsProps) {
  const { user } = useAuth()
  const { data: comments = [], isLoading } = useTicketComments(ticketId)
  const createComment = useCreateComment(ticketId)
  const deleteComment = useDeleteComment(ticketId)
  const [draft, setDraft] = useState('')

  async function handleSubmit() {
    const content = draft.trim()
    if (!content) return
    await createComment.mutateAsync(content)
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium">Comments ({comments.length})</h3>

      {/* New comment */}
      <div className="flex gap-3">
        <Avatar className="mt-0.5 size-7 shrink-0">
          <AvatarFallback className="text-xs">
            {getInitials(undefined, user?.email ?? '')}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-2">
          <Textarea
            placeholder="Add a comment…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
            className="min-h-[80px] resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">⌘ + Enter to submit</p>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!draft.trim() || createComment.isPending}
            >
              {createComment.isPending ? 'Posting…' : 'Comment'}
            </Button>
          </div>
        </div>
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="size-7 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-12 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="mt-0.5 size-7 shrink-0">
                <AvatarImage src={comment.author?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(comment.author?.full_name, comment.author?.email ?? '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">
                      {comment.author?.full_name || comment.author?.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  {comment.user_id === user?.id && (
                    <button
                      onClick={() => deleteComment.mutate(comment.id)}
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                      title="Delete comment"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
