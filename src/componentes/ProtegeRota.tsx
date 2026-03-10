import { Box, CircularProgress, Typography } from '@mui/material'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { usarAutenticacao } from '../contextos/autenticacao'

export function ProtegeRota() {
  const location = useLocation()
  const { usuario, estaCarregandoAutenticacao } = usarAutenticacao()

  if (estaCarregandoAutenticacao) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress color="primary" />
        <Typography color="text.secondary">Carregando...</Typography>
      </Box>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: location.pathname }} />
  }

  return <Outlet />
}
