import ApartmentIcon from '@mui/icons-material/Apartment'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { z } from 'zod'
import { usarAutenticacao } from '../contextos/autenticacao'
import {
  atualizarDepartamento,
  criarDepartamento,
  excluirDepartamento,
  listarDepartamentos,
} from '../services/departments'
import {
  atualizarDepartamentoDosColaboradores,
  listarColaboradores,
  renomearDepartamentoDosColaboradores,
} from '../services/employees'
import type { Departamento } from '../types/department'
import type { Colaborador } from '../types/employee'

const esquemaFormulario = z.object({
  name: z.string().min(2, 'Informe o nome do departamento.'),
  managerId: z.string(),
  collaboratorIds: z.array(z.string()),
})

type ValoresFormulario = z.infer<typeof esquemaFormulario>

const valoresIniciais: ValoresFormulario = {
  name: '',
  managerId: '',
  collaboratorIds: [],
}

function PaginaDepartamentos() {
  const { usuario, sair } = usarAutenticacao()
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [estaCarregandoDepartamentos, setEstaCarregandoDepartamentos] = useState(true)
  const [estaSalvandoDepartamento, setEstaSalvandoDepartamento] = useState(false)
  const [estaExcluindoDepartamento, setEstaExcluindoDepartamento] = useState(false)
  const [erroDepartamento, setErroDepartamento] = useState<string | null>(null)
  const [modoVisualizacao, setModoVisualizacao] = useState<'list' | 'form'>('list')
  const [departamentoEmEdicao, setDepartamentoEmEdicao] = useState<Departamento | null>(null)
  const [departamentoParaExcluir, setDepartamentoParaExcluir] = useState<Departamento | null>(null)
  const [idsDepartamentosSelecionados, setIdsDepartamentosSelecionados] = useState<string[]>([])
  const [exibirConfirmacaoExclusaoEmMassa, setExibirConfirmacaoExclusaoEmMassa] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ValoresFormulario>({
    resolver: zodResolver(esquemaFormulario),
    mode: 'onTouched',
    defaultValues: valoresIniciais,
  })

  useEffect(() => {
    const unsubscribeDepartamentos = listarDepartamentos(
      (proximosDepartamentos) => {
        setDepartamentos(proximosDepartamentos)
        setErroDepartamento(null)
        setEstaCarregandoDepartamentos(false)
      },
      (error) => {
        setErroDepartamento(error.message)
        setEstaCarregandoDepartamentos(false)
      },
    )

    const unsubscribeColaboradores = listarColaboradores(
      (proximosColaboradores) => {
        setColaboradores(proximosColaboradores)
      },
      (error) => {
        setErroDepartamento(error.message)
      },
    )

    return () => {
      unsubscribeDepartamentos()
      unsubscribeColaboradores()
    }
  }, [])

  const mapaColaboradores = useMemo(
    () =>
      new Map(
        colaboradores.map((colaborador) => [colaborador.id, colaborador]),
      ),
    [colaboradores],
  )

  const gestoresDisponiveis = useMemo(
    () => colaboradores.filter((colaborador) => colaborador.hierarchyLevel === 'Gestor'),
    [colaboradores],
  )

  const abrirFormularioCriacao = () => {
    setDepartamentoEmEdicao(null)
    setErroDepartamento(null)
    reset(valoresIniciais)
    setModoVisualizacao('form')
  }

  const abrirFormularioEdicao = (departamento: Departamento) => {
    setDepartamentoEmEdicao(departamento)
    setErroDepartamento(null)
    reset({
      name: departamento.name,
      managerId: departamento.managerId,
      collaboratorIds: [],
    })
    setModoVisualizacao('form')
  }

  const voltarParaLista = () => {
    setModoVisualizacao('list')
    setDepartamentoEmEdicao(null)
    reset(valoresIniciais)
  }

  const obterNomeGestor = (idGestor: string) => mapaColaboradores.get(idGestor)?.name ?? '-'

  const obterColaboradoresDoDepartamento = (nomeDepartamento: string) =>
    colaboradores.filter((colaborador) => colaborador.department === nomeDepartamento)

  const enviarFormulario = handleSubmit(async (data) => {
    try {
      setEstaSalvandoDepartamento(true)
      setErroDepartamento(null)

      if (gestoresDisponiveis.length > 0 && data.managerId.trim().length === 0) {
        setError('managerId', {
          type: 'manual',
          message: 'Selecione o gestor responsavel.',
        })
        return
      }

      if (departamentoEmEdicao) {
        const nomeAnterior = departamentoEmEdicao.name

        await atualizarDepartamento(departamentoEmEdicao.id, {
          name: data.name,
          managerId: data.managerId,
        })

        if (nomeAnterior !== data.name) {
          await renomearDepartamentoDosColaboradores(colaboradores, nomeAnterior, data.name)
        }

        await atualizarDepartamentoDosColaboradores(data.collaboratorIds, data.name)
      } else {
        await criarDepartamento({
          name: data.name,
          managerId: data.managerId,
        })

        await atualizarDepartamentoDosColaboradores(data.collaboratorIds, data.name)
      }

      voltarParaLista()
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Falha ao salvar departamento.'
      setErroDepartamento(mensagem)
    } finally {
      setEstaSalvandoDepartamento(false)
    }
  })

  const confirmarExclusaoDepartamento = async () => {
    if (!departamentoParaExcluir) {
      return
    }

    const colaboradoresVinculados = obterColaboradoresDoDepartamento(departamentoParaExcluir.name)

    if (colaboradoresVinculados.length > 0) {
      setErroDepartamento(
        'Nao e possivel excluir um departamento com colaboradores vinculados. Transfira os colaboradores antes.',
      )
      setDepartamentoParaExcluir(null)
      return
    }

    try {
      setEstaExcluindoDepartamento(true)
      setErroDepartamento(null)
      await excluirDepartamento(departamentoParaExcluir.id)
      setIdsDepartamentosSelecionados((idsAtuais) =>
        idsAtuais.filter((idDepartamento) => idDepartamento !== departamentoParaExcluir.id),
      )
      setDepartamentoParaExcluir(null)
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Falha ao excluir departamento.'
      setErroDepartamento(mensagem)
    } finally {
      setEstaExcluindoDepartamento(false)
    }
  }

  const confirmarExclusaoEmMassa = async () => {
    if (idsDepartamentosSelecionados.length === 0) {
      return
    }

    const departamentosSelecionados = departamentos.filter((departamento) =>
      idsDepartamentosSelecionados.includes(departamento.id),
    )

    const departamentosComColaboradores = departamentosSelecionados.filter(
      (departamento) => obterColaboradoresDoDepartamento(departamento.name).length > 0,
    )

    if (departamentosComColaboradores.length > 0) {
      setErroDepartamento(
        'Nao e possivel excluir departamentos com colaboradores vinculados. Transfira os colaboradores antes.',
      )
      setExibirConfirmacaoExclusaoEmMassa(false)
      return
    }

    try {
      setEstaExcluindoDepartamento(true)
      setErroDepartamento(null)
      await Promise.all(
        departamentosSelecionados.map((departamento) => excluirDepartamento(departamento.id)),
      )
      setIdsDepartamentosSelecionados([])
      setExibirConfirmacaoExclusaoEmMassa(false)
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Falha ao excluir departamentos.'
      setErroDepartamento(mensagem)
    } finally {
      setEstaExcluindoDepartamento(false)
    }
  }

  const alternarSelecaoDepartamento = (idDepartamento: string) => {
    setIdsDepartamentosSelecionados((idsAtuais) =>
      idsAtuais.includes(idDepartamento)
        ? idsAtuais.filter((idAtual) => idAtual !== idDepartamento)
        : [...idsAtuais, idDepartamento],
    )
  }

  const alternarSelecaoTodosDepartamentos = () => {
    if (
      departamentos.length > 0 &&
      departamentos.every((departamento) => idsDepartamentosSelecionados.includes(departamento.id))
    ) {
      setIdsDepartamentosSelecionados([])
      return
    }

    setIdsDepartamentosSelecionados(departamentos.map((departamento) => departamento.id))
  }

  const colaboradoresDoDepartamentoAtual = departamentoEmEdicao
    ? obterColaboradoresDoDepartamento(departamentoEmEdicao.name)
    : []

  const colaboradoresDisponiveisParaVinculo = departamentoEmEdicao
    ? colaboradores.filter((colaborador) => colaborador.department !== departamentoEmEdicao.name)
    : colaboradores

  const todosSelecionados =
    departamentos.length > 0 &&
    departamentos.every((departamento) => idsDepartamentosSelecionados.includes(departamento.id))

  const algunsSelecionados =
    departamentos.some((departamento) => idsDepartamentosSelecionados.includes(departamento.id)) &&
    !todosSelecionados

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
            <Button
              component={RouterLink}
              to="/colaboradores"
              variant="text"
              sx={{ justifyContent: 'flex-start', color: 'text.secondary', gap: 1 }}
              startIcon={<PeopleOutlineIcon fontSize="small" />}
            >
              Colaboradores
            </Button>
            <Button
              component={RouterLink}
              to="/departamentos"
              variant="text"
              sx={{ justifyContent: 'flex-start', color: 'text.primary', gap: 1, fontWeight: 700 }}
              startIcon={<ApartmentIcon fontSize="small" />}
            >
              Departamentos
            </Button>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }} sx={{ p: { xs: 2, md: 5 } }}>
          <Stack spacing={3}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
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
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 'auto' }}>
                <Stack
                  spacing={0.2}
                  sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'flex-end' }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {usuario?.email ?? 'Usuario autenticado'}
                  </Typography>
                  <Button variant="text" size="small" onClick={() => void sair()}>
                    Sair
                  </Button>
                </Stack>
                <Avatar alt="Recruiter" src="https://i.pravatar.cc/100?img=12" />
              </Stack>
            </Box>

            {modoVisualizacao === 'list' ? (
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Typography variant="h4" sx={{ fontSize: { xs: 30, md: 44 }, fontWeight: 700 }}>
                    Departamentos
                  </Typography>
                  <Button variant="contained" onClick={abrirFormularioCriacao} sx={{ px: 3, py: 1.2 }}>
                    Novo Departamento
                  </Button>
                </Stack>

                {idsDepartamentosSelecionados.length > 0 && (
                  <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {idsDepartamentosSelecionados.length} departamento(s) selecionado(s)
                      </Typography>

                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setExibirConfirmacaoExclusaoEmMassa(true)}
                        disabled={estaExcluindoDepartamento}
                      >
                        Excluir selecionados ({idsDepartamentosSelecionados.length})
                      </Button>
                    </Stack>
                  </Paper>
                )}

                <Paper sx={{ overflow: 'hidden', borderRadius: 3 }}>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f3f5f7' }}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={todosSelecionados}
                              indeterminate={algunsSelecionados}
                              onChange={alternarSelecaoTodosDepartamentos}
                              disabled={departamentos.length === 0}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Gestor responsavel</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Colaboradores</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">
                            Acoes
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {estaCarregandoDepartamentos && (
                          <TableRow>
                            <TableCell colSpan={5}>Carregando departamentos...</TableCell>
                          </TableRow>
                        )}
                        {!estaCarregandoDepartamentos && departamentos.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5}>Nenhum departamento cadastrado.</TableCell>
                          </TableRow>
                        )}
                        {!estaCarregandoDepartamentos &&
                          departamentos.map((departamento) => {
                            const colaboradoresDoDepartamento = obterColaboradoresDoDepartamento(
                              departamento.name,
                            )

                            return (
                              <TableRow key={departamento.id} hover>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={idsDepartamentosSelecionados.includes(departamento.id)}
                                    onChange={() => alternarSelecaoDepartamento(departamento.id)}
                                  />
                                </TableCell>
                                <TableCell>{departamento.name}</TableCell>
                                <TableCell>{obterNomeGestor(departamento.managerId)}</TableCell>
                                <TableCell>{colaboradoresDoDepartamento.length}</TableCell>
                                <TableCell align="right">
                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button size="small" onClick={() => abrirFormularioEdicao(departamento)}>
                                      Alterar
                                    </Button>
                                    <Button
                                      size="small"
                                      color="error"
                                      onClick={() => setDepartamentoParaExcluir(departamento)}
                                    >
                                      Excluir
                                    </Button>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
              </Stack>
            ) : (
              <Stack spacing={3}>
                <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                  <Typography variant="body1" sx={{ color: '#1f2937', fontWeight: 600 }}>
                    Departamentos
                  </Typography>
                  <Typography>•</Typography>
                  <Typography variant="body1">
                    {departamentoEmEdicao ? 'Alterar Departamento' : 'Cadastrar Departamento'}
                  </Typography>
                </Stack>

                <Box sx={{ width: '100%', maxWidth: 920 }}>
                  <Typography variant="h4" sx={{ mb: 3, color: '#64748b', fontWeight: 700 }}>
                    {departamentoEmEdicao ? 'Dados do Departamento' : 'Novo Departamento'}
                  </Typography>

                  <Box component="form" onSubmit={enviarFormulario} noValidate>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12 }}>
                        <Controller
                          name="name"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Nome do departamento"
                              fullWidth
                              error={Boolean(errors.name)}
                              helperText={errors.name?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth error={Boolean(errors.managerId)}>
                          <InputLabel id="manager-department-label">Gestor responsavel</InputLabel>
                          <Controller
                            name="managerId"
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                labelId="manager-department-label"
                                label="Gestor responsavel"
                              >
                                <MenuItem value="">
                                  {gestoresDisponiveis.length === 0
                                    ? 'Nenhum gestor cadastrado'
                                    : 'Selecione um gestor'}
                                </MenuItem>
                                {gestoresDisponiveis.map((colaborador) => (
                                  <MenuItem key={colaborador.id} value={colaborador.id}>
                                    {colaborador.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                          <Typography variant="caption" color="error" sx={{ pl: 1.8, pt: 0.5 }}>
                            {errors.managerId?.message}
                          </Typography>
                          {gestoresDisponiveis.length === 0 && (
                            <Typography variant="caption" sx={{ pl: 1.8, pt: 0.5, color: '#64748b' }}>
                              Cadastre pelo menos um colaborador com nivel Gestor para definir o responsavel.
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel id="collaborators-department-label">
                            {departamentoEmEdicao ? 'Adicionar colaboradores' : 'Colaboradores'}
                          </InputLabel>
                          <Controller
                            name="collaboratorIds"
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                multiple
                                labelId="collaborators-department-label"
                                label={departamentoEmEdicao ? 'Adicionar colaboradores' : 'Colaboradores'}
                                renderValue={(idsSelecionados) => {
                                  const nomes = idsSelecionados
                                    .map((idColaborador) => mapaColaboradores.get(idColaborador)?.name)
                                    .filter(Boolean)
                                  return nomes.length > 0 ? nomes.join(', ') : 'Nenhum selecionado'
                                }}
                              >
                                {colaboradoresDisponiveisParaVinculo.map((colaborador) => (
                                  <MenuItem key={colaborador.id} value={colaborador.id}>
                                    {colaborador.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                        </FormControl>
                      </Grid>

                      {departamentoEmEdicao && (
                        <Grid size={{ xs: 12 }}>
                          <Paper
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 3, borderColor: '#d5d8dd', bgcolor: '#fafafa' }}
                          >
                            <Stack spacing={1.5}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                Colaboradores atuais
                              </Typography>
                              {colaboradoresDoDepartamentoAtual.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                  Nenhum colaborador vinculado a este departamento.
                                </Typography>
                              ) : (
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                  {colaboradoresDoDepartamentoAtual.map((colaborador) => (
                                    <Chip key={colaborador.id} label={colaborador.name} />
                                  ))}
                                </Stack>
                              )}
                            </Stack>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                      spacing={2}
                      sx={{ mt: 4 }}
                    >
                      <Stack direction="row" spacing={2}>
                        <Button type="button" variant="text" onClick={voltarParaLista} sx={{ fontWeight: 700 }}>
                          Voltar
                        </Button>

                        {departamentoEmEdicao && (
                          <Button
                            type="button"
                            variant="text"
                            color="error"
                            onClick={() => setDepartamentoParaExcluir(departamentoEmEdicao)}
                            disabled={estaExcluindoDepartamento}
                            sx={{ fontWeight: 700 }}
                          >
                            Excluir
                          </Button>
                        )}
                      </Stack>

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={estaSalvandoDepartamento}
                        sx={{ px: 3, py: 1.2, width: { xs: '100%', sm: 'auto' } }}
                      >
                        Concluir
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            )}

            {erroDepartamento && (
              <Typography color="error" variant="body2">
                Erro de persistencia: {erroDepartamento}
              </Typography>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={Boolean(departamentoParaExcluir)}
        onClose={() => setDepartamentoParaExcluir(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Excluir departamento</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Tem certeza que deseja excluir <strong>{departamentoParaExcluir?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDepartamentoParaExcluir(null)} disabled={estaExcluindoDepartamento}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmarExclusaoDepartamento}
            disabled={estaExcluindoDepartamento}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={exibirConfirmacaoExclusaoEmMassa}
        onClose={() => setExibirConfirmacaoExclusaoEmMassa(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Excluir departamentos</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Tem certeza que deseja excluir {idsDepartamentosSelecionados.length} departamento(s) de uma
            vez?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setExibirConfirmacaoExclusaoEmMassa(false)}
            disabled={estaExcluindoDepartamento}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmarExclusaoEmMassa}
            disabled={estaExcluindoDepartamento}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PaginaDepartamentos
