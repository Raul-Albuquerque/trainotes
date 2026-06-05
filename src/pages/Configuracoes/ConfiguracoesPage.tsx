import { useState, useEffect } from 'react'
import { ChevronRight, User, BarChart2, Settings2, Database, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../app/store'
import { profilesRepo } from '../../db/repositories/profiles'

const MENU_ITEMS = [
  {
    id: 'perfil',
    icon: <User size={22} />,
    title: 'Perfil',
    subtitle: 'Nome, e-mail e altura',
    path: '/configuracoes/perfil',
  },
  {
    id: 'relatorio',
    icon: <BarChart2 size={22} />,
    title: 'Relatório',
    subtitle: 'Gerar PDF dos seus treinos',
    path: '/configuracoes/relatorio',
  },
  {
    id: 'preferencias',
    icon: <Settings2 size={22} />,
    title: 'Preferências',
    subtitle: 'Unidades de medida',
    path: '/configuracoes/preferencias',
  },
  {
    id: 'backup',
    icon: <Database size={22} />,
    title: 'Backup',
    subtitle: 'Exportar dados em JSON',
    path: '/configuracoes/backup',
  },
  {
    id: 'sair',
    icon: <LogOut size={22} />,
    title: 'Sair',
    subtitle: undefined,
    path: '/configuracoes/sair',
    danger: true,
  },
]

export function ConfiguracoesPage() {
  const { user } = useAppStore()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    profilesRepo.get(user.id).then(p => {
      setDisplayName(p?.display_name ?? user.user_metadata?.display_name ?? null)
    })
  }, [user])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-5 safe-top">
        <div className="flex items-center gap-3 mt-4">
          <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center text-ink-soft">
            <User size={28} />
          </div>
          <div>
            <p className="font-display text-xl text-ink leading-tight">
              {displayName ?? user?.email ?? '—'}
            </p>
            <p className="text-ink-muted text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Menu list */}
      <div className="flex-1 border-t border-border">
        {MENU_ITEMS.map((item, i) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={[
              'w-full flex items-center gap-4 px-4 py-4 active:bg-surface transition-colors',
              i < MENU_ITEMS.length - 1 ? 'border-b border-border' : '',
            ].join(' ')}
          >
            <span className={item.danger ? 'text-danger' : 'text-ink-soft'}>
              {item.icon}
            </span>
            <div className="flex-1 text-left min-w-0">
              <p className={['font-medium text-sm', item.danger ? 'text-danger' : 'text-ink'].join(' ')}>
                {item.title}
              </p>
              {item.subtitle && (
                <p className="text-ink-muted text-xs mt-0.5">{item.subtitle}</p>
              )}
            </div>
            <ChevronRight size={18} className="text-ink-muted flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
