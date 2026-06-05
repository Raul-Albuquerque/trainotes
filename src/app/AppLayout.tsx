import { Outlet, NavLink } from 'react-router-dom'
import { Home, ClipboardList, History, Activity, Settings } from 'lucide-react'

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 bg-surface border-t border-border z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-14">
          <NavItem to="/" icon={<Home size={22} />} label="Treinos" end />
          <NavItem to="/fichas" icon={<ClipboardList size={22} />} label="Fichas" />
          <NavItem to="/historico" icon={<History size={22} />} label="Histórico" />
          <NavItem to="/avaliacoes" icon={<Activity size={22} />} label="Avaliações" />
          <NavItem to="/configuracoes" icon={<Settings size={22} />} label="Config" />
        </div>
      </nav>
    </div>
  )
}

function NavItem({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 min-w-[44px] min-h-[44px] justify-center rounded-lg transition-colors ${
          isActive ? 'text-accent' : 'text-ink-muted'
        }`
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}
