import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AuthGuard } from './AuthGuard'
import { LoginPage } from '../pages/Login/LoginPage'
import { CadastroPage } from '../pages/Cadastro/CadastroPage'
import { RecuperarSenhaPage } from '../pages/RecuperarSenha/RecuperarSenhaPage'
import { RedefinirSenhaPage } from '../pages/RedefinirSenha/RedefinirSenhaPage'
import { HojePage } from '../pages/Hoje/HojePage'
import { FichasPage } from '../pages/Fichas/FichasPage'
import { EditorFichaPage } from '../pages/Fichas/EditorFichaPage'
import { IniciarTreinoPage } from '../pages/Treino/IniciarTreinoPage'
import { TreinoEmAndamentoPage } from '../pages/Treino/TreinoEmAndamentoPage'
import { EditarTreinoPage } from '../pages/Treino/EditarTreinoPage'
import { HistoricoPage } from '../pages/Historico/HistoricoPage'
import { AvaliacoesPage } from '../pages/Avaliacoes/AvaliacoesPage'
import { ConfiguracoesPage } from '../pages/Configuracoes/ConfiguracoesPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <CadastroPage /> },
  { path: '/recuperar-senha', element: <RecuperarSenhaPage /> },
  { path: '/redefinir-senha', element: <RedefinirSenhaPage /> },
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
      { path: 'treino/:id/editar', element: <EditarTreinoPage /> },
      { path: 'historico', element: <HistoricoPage /> },
      { path: 'avaliacoes', element: <AvaliacoesPage /> },
      { path: 'configuracoes', element: <ConfiguracoesPage /> },
      { path: 'relatorio', element: <Navigate to="/configuracoes" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
