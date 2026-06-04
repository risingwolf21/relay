import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SettingsDialog } from '@/components/settings/settings-dialog'
import { getInitials } from '@/lib/ticket-utils'

export function UserNav() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [settingsOpen, setSettingsOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  if (!user) return null

  const initials = getInitials(profile?.full_name, user.email ?? '')

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition-colors hover:bg-sidebar-accent focus:outline-none">
          <Avatar className="size-7">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium leading-tight">
              {profile?.full_name || t('common.loading')}
            </p>
            <p className="truncate text-[11px] text-muted-foreground leading-tight">{user.email}</p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{t('user.myAccount')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="size-4" />
            {t('user.settings')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="size-4" />
            {t('auth.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
