import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { FolderKanban, Inbox, LayoutDashboard, Menu, Search, TicketPlus, User, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useProjects } from '@/hooks/use-projects'
import { useSavedSearches } from '@/hooks/use-saved-searches'
import { TicketDialog } from '@/components/tickets/ticket-dialog'
import { UserNav } from './user-nav'

export function MobileNav() {
  const { data: projects = [] } = useProjects()
  const { data: searches = [] } = useSavedSearches()
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [ticketOpen, setTicketOpen] = useState(false)

  return (
    <>
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-sidebar px-4 md:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <FolderKanban className="size-5 text-sidebar-primary" />
          <span className="font-heading text-sm font-semibold">Relay</span>
        </Link>
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Slide-over menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar">
            <div className="flex h-12 items-center justify-between border-b px-4">
              <span className="font-heading text-sm font-semibold">{t('nav.menu')}</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
              {/* Projects */}
              <div className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('projects.title')}
              </div>
              {projects.map((p) => (
                <NavLink
                  key={p.id}
                  to={`/projects/${p.id}`}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-accent font-medium text-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                    )
                  }
                >
                  {p.name}
                </NavLink>
              ))}

              {/* Saved searches */}
              {searches.length > 0 && (
                <>
                  <div className="mt-2 px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('search.searches')}
                  </div>
                  {searches.map((s) => (
                    <NavLink
                      key={s.id}
                      to={`/searches/${s.id}`}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent font-medium text-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                        )
                      }
                    >
                      <Search className="size-3.5" />
                      {s.name}
                    </NavLink>
                  ))}
                </>
              )}
            </div>

            <div className="shrink-0 border-t p-2">
              <UserNav />
            </div>
          </aside>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t bg-background px-2 md:hidden">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 rounded-md px-4 py-1.5 text-xs transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          <LayoutDashboard className="size-5" />
          {t('nav.home')}
        </NavLink>

        <button
          onClick={() => setTicketOpen(true)}
          className="flex flex-col items-center gap-0.5 rounded-md px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <TicketPlus className="size-5" />
          {t('nav.new')}
        </button>

        <NavLink
          to="/my-tickets"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 rounded-md px-4 py-1.5 text-xs transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          <User className="size-5" />
          {t('nav.myTickets')}
        </NavLink>

        <NavLink
          to="/inbox"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 rounded-md px-4 py-1.5 text-xs transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          <Inbox className="size-5" />
          {t('nav.inbox')}
        </NavLink>
      </nav>

      <TicketDialog open={ticketOpen} onOpenChange={setTicketOpen} />
    </>
  )
}
