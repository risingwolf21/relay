import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { MobileNav } from './mobile-nav'

export function AppShell() {
  return (
    <div className="flex h-svh overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Mobile top bar + slide-over rendered inside MobileNav */}
        <MobileNav />
        <main className="flex flex-1 flex-col overflow-y-auto pb-14 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
