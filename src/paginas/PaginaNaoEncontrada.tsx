import { Box, Button, Grid, Stack, Typography } from '@mui/material'
import { Link as LinkRouter } from 'react-router-dom'
import { usarAutenticacao } from '../contextos/autenticacao'

export default function PaginaNaoEncontrada() {
  const { usuario } = usarAutenticacao()

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
        </Grid>

        <Grid size={{ xs: 12, md: 9 }} sx={{ p: { xs: 2, md: 5 }, display: 'flex', alignItems: 'center' }}>
          <Stack spacing={3} sx={{ width: '100%', maxWidth: 560 }}>
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

            <Typography variant="h2" sx={{ fontSize: { xs: 52, md: 72 }, fontWeight: 700 }}>
              404
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Pagina nao encontrada
            </Typography>
            <Typography color="text.secondary">
              O endereco acessado nao existe ou foi removido.
            </Typography>
            <Button
              component={LinkRouter}
              to={usuario ? '/colaboradores' : '/login'}
              variant="contained"
              sx={{ width: { xs: '100%', sm: 'auto' }, px: 3, py: 1.2 }}
            >
              {usuario ? 'Voltar para colaboradores' : 'Voltar para login'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
