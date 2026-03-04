import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Select,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { createEmployee, subscribeEmployees } from './services/employees'
import type { Employee } from './types/employee'

const formSchema = z.object({
  name: z.string().min(3, 'Informe o nome completo.'),
  email: z.string().email('Informe um e-mail valido.'),
  phone: z
    .string()
    .min(10, 'Telefone deve ter pelo menos 10 digitos.')
    .max(15, 'Telefone invalido.'),
  department: z.string().min(2, 'Selecione um departamento.'),
  role: z.string().min(2, 'Informe o cargo.'),
  startDate: z.string().min(1, 'Informe a data de admissao.'),
  status: z.enum(['Ativo', 'Inativo']),
})

type FormValues = z.infer<typeof formSchema>

const steps = ['Dados pessoais', 'Dados profissionais', 'Revisao']

const stepFields: Array<Array<keyof FormValues>> = [
  ['name', 'email', 'phone'],
  ['department', 'role', 'startDate', 'status'],
  [],
]

const departments = ['Design', 'TI', 'Marketing', 'Produto', 'Financeiro', 'RH']

const defaultValues: FormValues = {
  name: '',
  email: '',
  phone: '',
  department: '',
  role: '',
  startDate: '',
  status: 'Ativo',
}

function App() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  const [isSavingEmployee, setIsSavingEmployee] = useState(false)
  const [employeeError, setEmployeeError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    trigger,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues,
  })

  const values = watch()

  const initialsColor = useMemo(
    () => ['#ffe7e7', '#eaf2ff', '#fff4d8', '#dcfce7', '#fae8ff', '#e0f2fe'],
    [],
  )

  const closeDialog = () => {
    setDialogOpen(false)
    setActiveStep(0)
    reset(defaultValues)
  }

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

  const goNextStep = async () => {
    const fields = stepFields[activeStep]
    const isStepValid = fields.length > 0 ? await trigger(fields) : true

    if (!isStepValid) {
      return
    }

    if (activeStep < steps.length - 1) {
      setActiveStep((current) => current + 1)
    }
  }

  const goBackStep = () => {
    setActiveStep((current) => Math.max(current - 1, 0))
  }

  const submitForm = handleSubmit(async (data) => {
    try {
      setIsSavingEmployee(true)
      setEmployeeError(null)
      await createEmployee(data)
      closeDialog()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar colaborador.'
      setEmployeeError(message)
    } finally {
      setIsSavingEmployee(false)
    }
  })

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Grid container sx={{ minHeight: '100vh' }}>
        <Grid
          size={{ xs: 0, md: 3 }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            borderRight: '1px solid #e5e7eb',
            p: 4,
            flexDirection: 'column',
            gap: 4,
            bgcolor: '#f8fafc',
          }}
        >
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 800 }}>
            Flugo
          </Typography>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <PeopleOutlineIcon fontSize="small" />
              <Typography variant="body2">Colaboradores</Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'primary.dark',
                fontWeight: 700,
              }}
            >
              <GroupOutlinedIcon fontSize="small" />
              <Typography variant="body2">Novo colaborador</Typography>
            </Box>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }} sx={{ p: { xs: 2, md: 5 } }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Avatar alt="Recruiter" src="https://i.pravatar.cc/100?img=12" />
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Typography variant="h5">Colaboradores</Typography>
              <Button variant="contained" onClick={() => setDialogOpen(true)}>
                Novo Colaborador
              </Button>
            </Stack>

            <Paper sx={{ overflow: 'hidden', borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell>Nome</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Departamento</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingEmployees && (
                    <TableRow>
                      <TableCell colSpan={4}>Carregando colaboradores...</TableCell>
                    </TableRow>
                  )}
                  {!isLoadingEmployees && employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>Nenhum colaborador cadastrado.</TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            {employeeError && (
              <Typography color="error" variant="body2">
                Erro de persistencia: {employeeError}
              </Typography>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 6 }}>
          Cadastro de colaborador
          <IconButton
            aria-label="fechar"
            onClick={closeDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pb: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

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
                    label="Data de admissao"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    {...register('startDate')}
                    error={Boolean(errors.startDate)}
                    helperText={errors.startDate?.message}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <RadioGroup row {...field}>
                          <FormControlLabel value="Ativo" control={<Radio />} label="Ativo" />
                          <FormControlLabel value="Inativo" control={<Radio />} label="Inativo" />
                        </RadioGroup>
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Revise os dados antes de salvar
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Nome
                    </Typography>
                    <Typography>{values.name || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      E-mail
                    </Typography>
                    <Typography>{values.email || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Telefone
                    </Typography>
                    <Typography>{values.phone || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Departamento
                    </Typography>
                    <Typography>{values.department || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Cargo
                    </Typography>
                    <Typography>{values.role || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Data de admissao
                    </Typography>
                    <Typography>{values.startDate || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Typography>{values.status || '-'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
              <Button variant="text" onClick={goBackStep} disabled={activeStep === 0}>
                Voltar
              </Button>

              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={goNextStep}>
                  Proximo
                </Button>
              ) : (
                <Button type="submit" variant="contained" disabled={isSavingEmployee}>
                  Salvar colaborador
                </Button>
              )}
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default App
