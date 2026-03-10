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
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import {
  atualizarColaborador,
  criarColaborador,
  excluirColaborador,
  excluirColaboradores,
  listarColaboradores,
} from '../services/employees'
import type { Colaborador } from '../types/employee'
import { usarAutenticacao } from '../contextos/autenticacao'

const esquemaFormulario = z.object({
  name: z.string().min(3, 'Informe o nome completo.'),
  email: z.string().email('Informe um e-mail valido.'),
  phone: z
    .string()
    .min(10, 'Telefone deve ter pelo menos 10 digitos.')
    .max(15, 'Telefone invalido.'),
  birthDate: z.string().min(1, 'Informe a data de nascimento.'),
  status: z.enum(['Ativo', 'Inativo']),
  department: z.string().min(2, 'Selecione um departamento.'),
  role: z.string().min(2, 'Informe o cargo.'),
  manager: z.string().min(2, 'Informe o gestor imediato.'),
  workModel: z.enum(['Presencial', 'Hibrido', 'Remoto']),
  salaryRange: z.string().min(1, 'Selecione uma faixa salarial.'),
  startDate: z.string().min(1, 'Informe a data de admissao.'),
})

type ValoresFormulario = z.infer<typeof esquemaFormulario>

const etapasFormulario = ['Infos Basicas', 'Infos Profissionais']

const camposPorEtapa: Array<Array<keyof ValoresFormulario>> = [
  ['name', 'email', 'phone', 'birthDate', 'status'],
  ['department', 'role', 'manager', 'workModel', 'salaryRange', 'startDate'],
]

const departamentos = ['Design', 'TI', 'Marketing', 'Produto', 'Financeiro', 'RH']
const modelosTrabalho: ValoresFormulario['workModel'][] = ['Presencial', 'Hibrido', 'Remoto']
const faixasSalariais = ['R$ 2.000 - R$ 4.000', 'R$ 4.000 - R$ 7.000', 'R$ 7.000 - R$ 12.000', 'R$ 12.000+']

const valoresIniciais: ValoresFormulario = {
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  status: 'Ativo',
  department: '',
  role: '',
  manager: '',
  workModel: 'Hibrido',
  salaryRange: '',
  startDate: '',
}

const normalizarTexto = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

function PaginaColaboradores() {
  const { usuario, sair } = usarAutenticacao()
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [modoVisualizacao, setModoVisualizacao] = useState<'list' | 'form'>('list')
  const [etapaAtiva, setEtapaAtiva] = useState(0)
  const [estaCarregandoColaboradores, setEstaCarregandoColaboradores] = useState(true)
  const [estaSalvandoColaborador, setEstaSalvandoColaborador] = useState(false)
  const [estaExcluindoColaborador, setEstaExcluindoColaborador] = useState(false)
  const [erroColaborador, setErroColaborador] = useState<string | null>(null)
  const [colaboradorEmEdicao, setColaboradorEmEdicao] = useState<Colaborador | null>(null)
  const [colaboradorParaExcluir, setColaboradorParaExcluir] = useState<Colaborador | null>(null)
  const [filtroNome, setFiltroNome] = useState('')
  const [filtroEmail, setFiltroEmail] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('')
  const [idsColaboradoresSelecionados, setIdsColaboradoresSelecionados] = useState<string[]>([])
  const [exibirConfirmacaoExclusaoEmMassa, setExibirConfirmacaoExclusaoEmMassa] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors },
  } = useForm<ValoresFormulario>({
    resolver: zodResolver(esquemaFormulario),
    mode: 'onTouched',
    defaultValues: valoresIniciais,
  })

  const coresAvatar = useMemo(
    () => ['#ffe7e7', '#eaf2ff', '#fff4d8', '#dcfce7', '#fae8ff', '#e0f2fe'],
    [],
  )

  const colaboradoresFiltrados = useMemo(() => {
    const nomeNormalizado = normalizarTexto(filtroNome)
    const emailNormalizado = normalizarTexto(filtroEmail)
    const departamentoNormalizado = normalizarTexto(filtroDepartamento)

    return colaboradores.filter((colaborador) => {
      const nomeCorresponde =
        nomeNormalizado.length === 0 || normalizarTexto(colaborador.name).includes(nomeNormalizado)
      const emailCorresponde =
        emailNormalizado.length === 0 || normalizarTexto(colaborador.email).includes(emailNormalizado)
      const departamentoCorresponde =
        departamentoNormalizado.length === 0 ||
        normalizarTexto(colaborador.department ?? '').includes(departamentoNormalizado)

      return nomeCorresponde && emailCorresponde && departamentoCorresponde
    })
  }, [colaboradores, filtroDepartamento, filtroEmail, filtroNome])

  useEffect(() => {
    const unsubscribe = listarColaboradores(
      (proximosColaboradores) => {
        setColaboradores(proximosColaboradores)
        setErroColaborador(null)
        setEstaCarregandoColaboradores(false)
      },
      (error) => {
        setErroColaborador(error.message)
        setEstaCarregandoColaboradores(false)
      },
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    setIdsColaboradoresSelecionados((idsAtuais) =>
      idsAtuais.filter((idColaborador) =>
        colaboradores.some((colaborador) => colaborador.id === idColaborador),
      ),
    )
  }, [colaboradores])

  const abrirFormularioCriacao = () => {
    setColaboradorEmEdicao(null)
    setEtapaAtiva(0)
    setErroColaborador(null)
    reset(valoresIniciais)
    setModoVisualizacao('form')
  }

  const abrirFormularioEdicao = (colaborador: Colaborador) => {
    setColaboradorEmEdicao(colaborador)
    setEtapaAtiva(0)
    setErroColaborador(null)
    reset({
      name: colaborador.name,
      email: colaborador.email,
      phone: colaborador.phone ?? '',
      birthDate: colaborador.birthDate ?? '',
      status: colaborador.status,
      department: colaborador.department ?? '',
      role: colaborador.role ?? '',
      manager: colaborador.manager ?? '',
      workModel: colaborador.workModel ?? 'Hibrido',
      salaryRange: colaborador.salaryRange ?? '',
      startDate: colaborador.startDate ?? '',
    })
    setModoVisualizacao('form')
  }

  const voltarParaLista = () => {
    setModoVisualizacao('list')
    setEtapaAtiva(0)
    setColaboradorEmEdicao(null)
    reset(valoresIniciais)
  }

  const avancarEtapa = async () => {
    const campos = camposPorEtapa[etapaAtiva]
    const etapaValida = await trigger(campos)

    if (!etapaValida && !colaboradorEmEdicao) {
      return
    }

    if (etapaAtiva < etapasFormulario.length - 1) {
      setEtapaAtiva((atual) => atual + 1)
    }
  }

  const retornarEtapa = () => {
    if (etapaAtiva === 0) {
      voltarParaLista()
      return
    }

    setEtapaAtiva((atual) => Math.max(atual - 1, 0))
  }

  const enviarFormulario = handleSubmit(async (data) => {
    try {
      setEstaSalvandoColaborador(true)
      setErroColaborador(null)

      if (colaboradorEmEdicao) {
        await atualizarColaborador(colaboradorEmEdicao.id, data)
      } else {
        await criarColaborador(data)
      }

      voltarParaLista()
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Falha ao salvar colaborador.'
      setErroColaborador(mensagem)
    } finally {
      setEstaSalvandoColaborador(false)
    }
  }, (camposInvalidos) => {
    const existemErrosNasInfosBasicas = camposPorEtapa[0].some((campo) => camposInvalidos[campo])

    if (existemErrosNasInfosBasicas) {
      setEtapaAtiva(0)
    }
  })

  const confirmarExclusaoColaborador = async () => {
    if (!colaboradorParaExcluir) {
      return
    }

    try {
      setEstaExcluindoColaborador(true)
      setErroColaborador(null)
      await excluirColaborador(colaboradorParaExcluir.id)
      setIdsColaboradoresSelecionados((idsAtuais) =>
        idsAtuais.filter((idColaborador) => idColaborador !== colaboradorParaExcluir.id),
      )
      setColaboradorParaExcluir(null)

      if (modoVisualizacao === 'form') {
        voltarParaLista()
      }
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Falha ao excluir colaborador.'
      setErroColaborador(mensagem)
    } finally {
      setEstaExcluindoColaborador(false)
    }
  }

  const confirmarExclusaoEmMassa = async () => {
    if (idsColaboradoresSelecionados.length === 0) {
      return
    }

    try {
      setEstaExcluindoColaborador(true)
      setErroColaborador(null)
      await excluirColaboradores(idsColaboradoresSelecionados)
      setIdsColaboradoresSelecionados([])
      setExibirConfirmacaoExclusaoEmMassa(false)
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Falha ao excluir colaboradores.'
      setErroColaborador(mensagem)
    } finally {
      setEstaExcluindoColaborador(false)
    }
  }

  const alternarSelecaoColaborador = (idColaborador: string) => {
    setIdsColaboradoresSelecionados((idsAtuais) =>
      idsAtuais.includes(idColaborador)
        ? idsAtuais.filter((idAtual) => idAtual !== idColaborador)
        : [...idsAtuais, idColaborador],
    )
  }

  const alternarSelecaoTodosColaboradores = () => {
    if (
      colaboradoresFiltrados.length > 0 &&
      colaboradoresFiltrados.every((colaborador) =>
        idsColaboradoresSelecionados.includes(colaborador.id),
      )
    ) {
      setIdsColaboradoresSelecionados((idsAtuais) =>
        idsAtuais.filter(
          (idColaborador) =>
            !colaboradoresFiltrados.some((colaborador) => colaborador.id === idColaborador),
        ),
      )
      return
    }

    setIdsColaboradoresSelecionados((idsAtuais) => {
      const proximosIds = new Set(idsAtuais)
      colaboradoresFiltrados.forEach((colaborador) => {
        proximosIds.add(colaborador.id)
      })
      return Array.from(proximosIds)
    })
  }

  const todosSelecionados =
    colaboradoresFiltrados.length > 0 &&
    colaboradoresFiltrados.every((colaborador) =>
      idsColaboradoresSelecionados.includes(colaborador.id),
    )

  const algunsSelecionados =
    colaboradoresFiltrados.some((colaborador) =>
      idsColaboradoresSelecionados.includes(colaborador.id),
    ) && !todosSelecionados

  const estaEmEdicao = Boolean(colaboradorEmEdicao)
  const progresso = etapaAtiva === 0 ? 0 : 50

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <PeopleOutlineIcon fontSize="small" />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Colaboradores
              </Typography>
            </Box>
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
                    Colaboradores
                  </Typography>
                  <Button variant="contained" onClick={abrirFormularioCriacao} sx={{ px: 3, py: 1.2 }}>
                    Novo Colaborador
                  </Button>
                </Stack>

                <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                  <Stack spacing={2.5}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          label="Buscar por nome"
                          value={filtroNome}
                          onChange={(event) => setFiltroNome(event.target.value)}
                          fullWidth
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          label="Buscar por e-mail"
                          value={filtroEmail}
                          onChange={(event) => setFiltroEmail(event.target.value)}
                          fullWidth
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth>
                          <InputLabel id="filtro-departamento-label">Departamento</InputLabel>
                          <Select
                            labelId="filtro-departamento-label"
                            label="Departamento"
                            value={filtroDepartamento}
                            onChange={(event) => setFiltroDepartamento(event.target.value)}
                          >
                            <MenuItem value="">Todos</MenuItem>
                            {departamentos.map((departamento) => (
                              <MenuItem key={departamento} value={departamento}>
                                {departamento}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {colaboradoresFiltrados.length} colaborador(es) encontrado(s)
                      </Typography>

                      {idsColaboradoresSelecionados.length > 0 && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => setExibirConfirmacaoExclusaoEmMassa(true)}
                          disabled={estaExcluindoColaborador}
                        >
                          Excluir selecionados ({idsColaboradoresSelecionados.length})
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>

                <Paper sx={{ overflow: 'hidden', borderRadius: 3 }}>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f3f5f7' }}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={todosSelecionados}
                              indeterminate={algunsSelecionados}
                              onChange={alternarSelecaoTodosColaboradores}
                              disabled={colaboradoresFiltrados.length === 0}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>E-mail</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Departamento</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">
                            Acoes
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {estaCarregandoColaboradores && (
                          <TableRow>
                            <TableCell colSpan={6}>Carregando colaboradores...</TableCell>
                          </TableRow>
                        )}
                        {!estaCarregandoColaboradores && colaboradores.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6}>Nenhum colaborador cadastrado.</TableCell>
                          </TableRow>
                        )}
                        {!estaCarregandoColaboradores &&
                          colaboradores.length > 0 &&
                          colaboradoresFiltrados.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6}>
                                Nenhum colaborador encontrado com os filtros aplicados.
                              </TableCell>
                            </TableRow>
                          )}
                        {colaboradoresFiltrados.map((colaborador, index) => (
                          <TableRow key={colaborador.id} hover>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={idsColaboradoresSelecionados.includes(colaborador.id)}
                                onChange={() => alternarSelecaoColaborador(colaborador.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    bgcolor: coresAvatar[index % coresAvatar.length],
                                    color: '#111827',
                                    fontSize: 14,
                                    fontWeight: 700,
                                  }}
                                >
                                  {colaborador.name
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join('')}
                                </Avatar>
                                <Typography>{colaborador.name}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>{colaborador.email}</TableCell>
                            <TableCell>{colaborador.department}</TableCell>
                            <TableCell>
                              <Chip
                                label={colaborador.status}
                                color={colaborador.status === 'Ativo' ? 'success' : 'error'}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button size="small" onClick={() => abrirFormularioEdicao(colaborador)}>
                                  Alterar
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => setColaboradorParaExcluir(colaborador)}
                                >
                                  Excluir
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
              </Stack>
            ) : (
              <Stack spacing={3}>
                <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                  <Typography variant="body1" sx={{ color: '#1f2937', fontWeight: 600 }}>
                    Colaboradores
                  </Typography>
                  <Typography>•</Typography>
                  <Typography variant="body1">{estaEmEdicao ? 'Alterar Colaborador' : 'Cadastrar Colaborador'}</Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <LinearProgress
                    variant="determinate"
                    value={progresso}
                    sx={{ flex: 1, height: 6, borderRadius: 999, bgcolor: '#d4f5e2' }}
                  />
                  <Typography color="text.secondary">{progresso}%</Typography>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start">
                  <Stack
                    sx={{ minWidth: { xs: 0, md: 190 }, width: { xs: '100%', md: 'auto' } }}
                    spacing={2.5}
                  >
                    {etapasFormulario.map((label, index) => {
                      const etapaAtual = etapaAtiva === index

                      return (
                        <Stack
                          key={label}
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          onClick={() => {
                            if (estaEmEdicao) {
                              setEtapaAtiva(index)
                            }
                          }}
                          sx={{ cursor: estaEmEdicao ? 'pointer' : 'default' }}
                        >
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              bgcolor: etapaAtual ? '#22c55e' : '#e5e7eb',
                              color: etapaAtual ? '#fff' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography sx={{ fontWeight: etapaAtual ? 700 : 600, color: '#334155' }}>
                            {label}
                          </Typography>
                        </Stack>
                      )
                    })}
                  </Stack>

                  <Box sx={{ flex: 1, width: '100%', minWidth: { xs: 0, md: 320 } }}>
                    <Typography variant="h4" sx={{ mb: 3, color: '#64748b', fontWeight: 700 }}>
                      {etapaAtiva === 0 ? 'Informacoes Basicas' : 'Informacoes Profissionais'}
                    </Typography>


                    <Box component="form" onSubmit={enviarFormulario} noValidate>
                      {etapaAtiva === 0 && (
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              label="Nome completo"
                              fullWidth
                              {...register('name')}
                              error={Boolean(errors.name)}
                              helperText={errors.name?.message}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              label="E-mail"
                              type="email"
                              fullWidth
                              {...register('email')}
                              error={Boolean(errors.email)}
                              helperText={errors.email?.message}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              label="Telefone"
                              fullWidth
                              {...register('phone')}
                              error={Boolean(errors.phone)}
                              helperText={errors.phone?.message}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              label="Data de nascimento"
                              type="date"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              {...register('birthDate')}
                              error={Boolean(errors.birthDate)}
                              helperText={errors.birthDate?.message}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                              control={control}
                              name="status"
                              render={({ field }) => (
                                <FormControlLabel
                                  sx={{ mt: 1 }}
                                  control={
                                    <Switch
                                      checked={field.value === 'Ativo'}
                                      onChange={(_, checked) =>
                                        field.onChange(checked ? 'Ativo' : 'Inativo')
                                      }
                                    />
                                  }
                                  label="Ativar ao criar"
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                      )}

                      {etapaAtiva === 1 && (
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth error={Boolean(errors.department)}>
                              <InputLabel id="department-label">Departamento</InputLabel>
                              <Controller
                                name="department"
                                control={control}
                                render={({ field }) => (
                                  <Select labelId="department-label" label="Departamento" {...field}>
                                    {departamentos.map((department) => (
                                      <MenuItem key={department} value={department}>
                                        {department}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                )}
                              />
                              <Typography variant="caption" color="error" sx={{ pl: 1.8, pt: 0.5 }}>
                                {errors.department?.message}
                              </Typography>
                            </FormControl>
                          </Grid>

                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              label="Cargo"
                              fullWidth
                              {...register('role')}
                              error={Boolean(errors.role)}
                              helperText={errors.role?.message}
                            />
                          </Grid>

                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              label="Gestor imediato"
                              fullWidth
                              {...register('manager')}
                              error={Boolean(errors.manager)}
                              helperText={errors.manager?.message}
                            />
                          </Grid>

                          <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth error={Boolean(errors.workModel)}>
                              <InputLabel id="work-model-label">Modelo de trabalho</InputLabel>
                              <Controller
                                name="workModel"
                                control={control}
                                render={({ field }) => (
                                  <Select labelId="work-model-label" label="Modelo de trabalho" {...field}>
                                    {modelosTrabalho.map((workModel) => (
                                      <MenuItem key={workModel} value={workModel}>
                                        {workModel}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                )}
                              />
                            </FormControl>
                          </Grid>

                          <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth error={Boolean(errors.salaryRange)}>
                              <InputLabel id="salary-range-label">Faixa salarial</InputLabel>
                              <Controller
                                name="salaryRange"
                                control={control}
                                render={({ field }) => (
                                  <Select labelId="salary-range-label" label="Faixa salarial" {...field}>
                                    {faixasSalariais.map((salaryRange) => (
                                      <MenuItem key={salaryRange} value={salaryRange}>
                                        {salaryRange}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                )}
                              />
                              <Typography variant="caption" color="error" sx={{ pl: 1.8, pt: 0.5 }}>
                                {errors.salaryRange?.message}
                              </Typography>
                            </FormControl>
                          </Grid>

                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              label="Data de admissao"
                              type="date"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              {...register('startDate')}
                              error={Boolean(errors.startDate)}
                              helperText={errors.startDate?.message}
                            />
                          </Grid>
                        </Grid>
                      )}

                      <Divider sx={{ my: 4 }} />

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        spacing={2}
                      >
                        <Stack direction="row" spacing={2}>
                          <Button type="button" variant="text" onClick={retornarEtapa} sx={{ fontWeight: 700 }}>
                            Voltar
                          </Button>

                          {colaboradorEmEdicao && etapaAtiva === 1 && (
                            <Button
                              type="button"
                              variant="text"
                              color="error"
                              onClick={() => setColaboradorParaExcluir(colaboradorEmEdicao)}
                              disabled={estaExcluindoColaborador}
                              sx={{ fontWeight: 700 }}
                            >
                              Excluir
                            </Button>
                          )}
                        </Stack>

                        {etapaAtiva === 0 && !colaboradorEmEdicao ? (
                          <Button
                            type="button"
                            variant="contained"
                            onClick={avancarEtapa}
                            sx={{ px: 3, py: 1.2, width: { xs: '100%', sm: 'auto' } }}
                          >
                            Proximo
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={estaSalvandoColaborador}
                            sx={{ px: 3, py: 1.2, width: { xs: '100%', sm: 'auto' } }}
                          >
                            Concluir
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                </Stack>
              </Stack>
            )}

            {erroColaborador && (
              <Typography color="error" variant="body2">
                Erro de persistencia: {erroColaborador}
              </Typography>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={Boolean(colaboradorParaExcluir)}
        onClose={() => setColaboradorParaExcluir(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Excluir colaborador</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Tem certeza que deseja excluir <strong>{colaboradorParaExcluir?.name}</strong>? Esta acao
            nao pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setColaboradorParaExcluir(null)} disabled={estaExcluindoColaborador}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmarExclusaoColaborador}
            disabled={estaExcluindoColaborador}
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
        <DialogTitle>Excluir colaboradores</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Tem certeza que deseja excluir {idsColaboradoresSelecionados.length} colaborador(es) de uma
            vez? Esta acao nao pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setExibirConfirmacaoExclusaoEmMassa(false)}
            disabled={estaExcluindoColaborador}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmarExclusaoEmMassa}
            disabled={estaExcluindoColaborador}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PaginaColaboradores



