import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { usarAutenticacao } from '../contextos/autenticacao'

export default function PaginaLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario, entrar } = usarAutenticacao()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erroLogin, setErroLogin] = useState('')
  const [estaEntrando, setEstaEntrando] = useState(false)

  const rotaDestino = (location.state as { de?: string } | null)?.de ?? '/colaboradores'

  if (usuario) {
    return <Navigate to={rotaDestino} replace />
  }

  const enviarFormulario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setEstaEntrando(true)
      setErroLogin('')
      await entrar(email, senha)
      navigate(rotaDestino, { replace: true })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Falha ao entrar.'
      setErroLogin('Nao foi possivel entrar. Verifique seu email e senha.')
      console.error(mensagem)
    } finally {
      setEstaEntrando(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Grid container sx={{ minHeight: '100vh' }}>
        <Grid
          size={{ xs: 0, md: 3 }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            borderRight: '1px dashed #d5d8dd',
            p: 3.5,
            flexDirection: 'column',
            gap: 4,
            bgcolor: '#ffffff',
          }}
        >
          <Box
            component="img"
            src="/flugo-logo1.svg"
            alt="Flugo"
            sx={{ width: 140, height: 'auto', objectFit: 'contain', mb: 2 }}
          />
          <Stack spacing={1.5}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937' }}>
              Acesso ao sistema
            </Typography>
            <Typography color="text.secondary">
              Entre com sua conta para acessar a area de colaboradores.
            </Typography>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }} sx={{ p: { xs: 2, md: 5 }, display: 'flex', alignItems: 'center' }}>
          <Stack spacing={3} sx={{ width: '100%' }}>
            <Box
              component="img"
              src="/flugo-logo1.svg"
              alt="Flugo"
              sx={{
                width: 120,
                height: 'auto',
                objectFit: 'contain',
                display: { xs: 'block', md: 'none' },
              }}
            />

            <Paper sx={{ borderRadius: 3, p: { xs: 3, md: 4 }, maxWidth: 520, width: '100%' }}>
              <Stack spacing={3} component="form" onSubmit={enviarFormulario} noValidate>
                <Box>
                  <Typography variant="h4" sx={{ fontSize: { xs: 30, md: 40 }, fontWeight: 700, mb: 1 }}>
                    Entrar
                  </Typography>
                  <Typography color="text.secondary">
                    Use seu email e senha para acessar o painel.
                  </Typography>
                </Box>

                {erroLogin && <Alert severity="error">{erroLogin}</Alert>}

                <TextField
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  fullWidth
                  required
                />

                <TextField
                  label="Senha"
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  fullWidth
                  required
                />

                <Button type="submit" variant="contained" disabled={estaEntrando} sx={{ py: 1.4 }}>
                  {estaEntrando ? 'Entrando...' : 'Entrar'}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
