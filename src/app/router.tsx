import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AuthGuard } from './AuthGuard'
import { LoginPage } from '../pages/Login/LoginPage'
import { HojePage } from '../pages/Hoje/HojePage'
import { FichasPage } from '../pages/Fichas/FichasPage'
import { EditorFichaPage } from '../pages/Fichas/EditorFichaPage'
import { IniciarTreinoPage } from '../pages/Treino/IniciarTreinoPage'
import { TreinoEmAndamentoPage } from '../pages/Treino/TreinoEmAndamentoPage'
import { HistoricoPage } from '../pages/Historico/HistoricoPage'
import { RelatorioPage } from '../pages/Relatorio/RelatorioPage'
import { ConfiguracoesPage } from '../pages/Configuracoes/ConfiguracoesPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <HojePage /> },
      { path: 'fichas', element: <FichasPage /> },
      { path: 'fichas/:id/editar', element: <EditorFichaPage /> },
      { path: 'treino/iniciar', element: <IniciarTreinoPage /> },
      { path: 'treino/ativo', element: <TreinoEmAndamentoPage /> },
      { path: 'historico', element: <HistoricoPage /> },
      { path: 'relatorio', element: <RelatorioPage /> },
      { path: 'configuracoes', element: <ConfiguracoesPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
