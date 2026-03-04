export type StatusColaborador = 'Ativo' | 'Inativo'

export type Colaborador = {
  id: string
  name: string
  email: string
  phone: string
  birthDate: string
  department: string
  role: string
  manager: string
  workModel: 'Presencial' | 'Hibrido' | 'Remoto'
  salaryRange: string
  startDate: string
  status: StatusColaborador
  createdAt?: number
}

export type EntradaColaborador = Omit<Colaborador, 'id' | 'createdAt'>
