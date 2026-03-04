import {
  Avatar,
  Box,
  Button,
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
  createEmployee,
  deleteEmployee,
  subscribeEmployees,
  updateEmployee,
} from './services/employees'
import type { Employee } from './types/employee'

const formSchema = z.object({
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

type FormValues = z.infer<typeof formSchema>

const formSteps = ['Infos Basicas', 'Infos Profissionais']

const stepFields: Array<Array<keyof FormValues>> = [
  ['name', 'email', 'phone', 'birthDate', 'status'],
  ['department', 'role', 'manager', 'workModel', 'salaryRange', 'startDate'],
]

const departments = ['Design', 'TI', 'Marketing', 'Produto', 'Financeiro', 'RH']
const workModels: FormValues['workModel'][] = ['Presencial', 'Hibrido', 'Remoto']
const salaryRanges = ['R$ 2.000 - R$ 4.000', 'R$ 4.000 - R$ 7.000', 'R$ 7.000 - R$ 12.000', 'R$ 12.000+']

const defaultValues: FormValues = {
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

function App() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [activeStep, setActiveStep] = useState(0)
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  const [isSavingEmployee, setIsSavingEmployee] = useState(false)
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false)
  const [employeeError, setEmployeeError] = useState<string | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  const {
    control,
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues,
  })

  const initialsColor = useMemo(
    () => ['#ffe7e7', '#eaf2ff', '#fff4d8', '#dcfce7', '#fae8ff', '#e0f2fe'],
    [],
  )

  useEffect(() => {
    const unsubscribe = subscribeEmployees(
      (nextEmployees) => {
        setEmployees(nextEmployees)
        setEmployeeError(null)
        setIsLoadingEmployees(false)
      },
      (error) => {
        setEmployeeError(error.message)
        setIsLoadingEmployees(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const openCreateForm = () => {
    setEditingEmployee(null)
    setActiveStep(0)
    setEmployeeError(null)
    reset(defaultValues)
    setViewMode('form')
  }

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee)
    setActiveStep(0)
    setEmployeeError(null)
    reset({
      name: employee.name,
      email: employee.email,
      phone: employee.phone ?? '',
      birthDate: employee.birthDate ?? '',
      status: employee.status,
      department: employee.department ?? '',
      role: employee.role ?? '',
      manager: employee.manager ?? '',
      workModel: employee.workModel ?? 'Hibrido',
      salaryRange: employee.salaryRange ?? '',
      startDate: employee.startDate ?? '',
    })
    setViewMode('form')
  }

  const goToList = () => {
    setViewMode('list')
    setActiveStep(0)
    setEditingEmployee(null)
    reset(defaultValues)
  }

  const goNextStep = async () => {
    const fields = stepFields[activeStep]
    const isStepValid = await trigger(fields)

    if (!isStepValid) {
      return
    }

    if (activeStep < formSteps.length - 1) {
      setActiveStep((current) => current + 1)
    }
  }

  const goBackStep = () => {
    if (activeStep === 0) {
      goToList()
      return
    }

    setActiveStep((current) => Math.max(current - 1, 0))
  }

  const submitForm = handleSubmit(async (data) => {
    try {
      setIsSavingEmployee(true)
      setEmployeeError(null)

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, data)
      } else {
        await createEmployee(data)
      }

      goToList()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar colaborador.'
      setEmployeeError(message)
    } finally {
      setIsSavingEmployee(false)
    }
  })

  const confirmDeleteEmployee = async () => {
    if (!deleteTarget) {
      return
    }

    try {
      setIsDeletingEmployee(true)
      setEmployeeError(null)
      await deleteEmployee(deleteTarget.id)
      setDeleteTarget(null)
      goToList()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao excluir colaborador.'
      setEmployeeError(message)
    } finally {
      setIsDeletingEmployee(false)
    }
  }

  const progress = activeStep === 0 ? 0 : 50

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
            bgcolor: '#f9fbfc',
          }}
        >
          <Typography variant="h5" sx={{ color: '#1f2937', fontWeight: 800 }}>
            Flugo
          </Typography>
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Avatar alt="Recruiter" src="https://i.pravatar.cc/100?img=12" />
            </Box>

            {viewMode === 'list' ? (
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
                  <Button variant="contained" onClick={openCreateForm} sx={{ px: 3, py: 1.2 }}>
                    Novo Colaborador
                  </Button>
                </Stack>

                <Paper sx={{ overflow: 'hidden', borderRadius: 3 }}>
                  <Box sx={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f3f5f7' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>E-mail</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Departamento</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Ações
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isLoadingEmployees && (
                        <TableRow>
                          <TableCell colSpan={5}>Carregando colaboradores...</TableCell>
                        </TableRow>
                      )}
                      {!isLoadingEmployees && employees.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5}>Nenhum colaborador cadastrado.</TableCell>
                        </TableRow>
                      )}
                      {employees.map((employee, index) => (
                        <TableRow key={employee.id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar
                                sx={{
                                  width: 34,
                                  height: 34,
                                  bgcolor: initialsColor[index % initialsColor.length],
                                  color: '#111827',
                                  fontSize: 14,
                                  fontWeight: 700,
                                }}
                              >
                                {employee.name
                                  .split(' ')
                                  .slice(0, 2)
                                  .map((part) => part[0])
                                  .join('')}
                              </Avatar>
                              <Typography>{employee.name}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>
                            <Chip
                              label={employee.status}
                              color={employee.status === 'Ativo' ? 'success' : 'error'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" onClick={() => openEditForm(employee)}>
                                Alterar
                              </Button>
                              <Button size="small" color="error" onClick={() => setDeleteTarget(employee)}>
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
                  <Typography variant="body1">Cadastrar Colaborador</Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ flex: 1, height: 6, borderRadius: 999, bgcolor: '#d4f5e2' }}
                  />
                  <Typography color="text.secondary">{progress}%</Typography>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start">
                  <Stack sx={{ minWidth: { xs: 0, md: 190 }, width: { xs: '100%', md: 'auto' } }} spacing={2.5}>
                    {formSteps.map((label, index) => {
                      const completed = activeStep > index
                      const active = activeStep === index

                      return (
                        <Stack key={label} direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              bgcolor: completed || active ? '#22c55e' : '#e5e7eb',
                              color: completed || active ? '#fff' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                            }}
                          >
                            {completed ? '?' : index + 1}
                          </Box>
                          <Typography sx={{ fontWeight: active || completed ? 700 : 600, color: '#334155' }}>
                            {label}
                          </Typography>
                        </Stack>
                      )
                    })}
                  </Stack>

                  <Box sx={{ flex: 1, width: '100%', minWidth: { xs: 0, md: 320 } }}>
                    <Typography variant="h4" sx={{ mb: 3, color: '#64748b', fontWeight: 700 }}>
                      {activeStep === 0 ? 'Informacoes Basicas' : 'Informacoes Profissionais'}
                    </Typography>

                    <Box component="form" onSubmit={submitForm} noValidate>
                      {activeStep === 0 && (
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

                      {activeStep === 1 && (
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth error={Boolean(errors.department)}>
                              <InputLabel id="department-label">Departamento</InputLabel>
                              <Controller
                                name="department"
                                control={control}
                                render={({ field }) => (
                                  <Select labelId="department-label" label="Departamento" {...field}>
                                    {departments.map((department) => (
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
                                    {workModels.map((workModel) => (
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
                                    {salaryRanges.map((salaryRange) => (
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
                          <Button variant="text" onClick={goBackStep} sx={{ fontWeight: 700 }}>
                            Voltar
                          </Button>

                          {editingEmployee && activeStep === 1 && (
                            <Button
                              variant="text"
                              color="error"
                              onClick={() => setDeleteTarget(editingEmployee)}
                              disabled={isDeletingEmployee}
                              sx={{ fontWeight: 700 }}
                            >
                              Excluir
                            </Button>
                          )}
                        </Stack>

                        {activeStep === 0 ? (
                          <Button
                            variant="contained"
                            onClick={goNextStep}
                            sx={{ px: 3, py: 1.2, width: { xs: '100%', sm: 'auto' } }}
                          >
                            Proximo
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isSavingEmployee}
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

            {employeeError && (
              <Typography color="error" variant="body2">
                Erro de persistencia: {employeeError}
              </Typography>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Excluir colaborador</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta acao nao pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeletingEmployee}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={confirmDeleteEmployee} disabled={isDeletingEmployee}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default App
