import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'

export function AppShell() {
  return (
    <div className="flex h-svh overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
