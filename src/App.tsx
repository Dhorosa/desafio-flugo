import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProvedorAutenticacao } from './contextos/autenticacao'
import { ProtegeRota } from './componentes/ProtegeRota'
import PaginaColaboradores from './paginas/PaginaColaboradores'
import PaginaLogin from './paginas/PaginaLogin'
import PaginaNaoEncontrada from './paginas/PaginaNaoEncontrada'

function App() {
  return (
    <ProvedorAutenticacao>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PaginaLogin />} />

          <Route element={<ProtegeRota />}>
            <Route path="/" element={<Navigate to="/colaboradores" replace />} />
            <Route path="/colaboradores" element={<PaginaColaboradores />} />
          </Route>

          <Route path="*" element={<PaginaNaoEncontrada />} />
        </Routes>
      </BrowserRouter>
    </ProvedorAutenticacao>
  )
}

export default App
