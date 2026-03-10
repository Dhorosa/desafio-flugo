export type StatusColaborador = 'Ativo' | 'Inativo'
export type NivelHierarquico = 'Junior' | 'Pleno' | 'Senior' | 'Gestor'

export type Colaborador = {
  id: string
  name: string
  email: string
  phone: string
  birthDate: string
  department: string
  role: string
  hierarchyLevel: NivelHierarquico
  manager: string
  workModel: 'Presencial' | 'Hibrido' | 'Remoto'
  baseSalary: string
  salaryRange?: string
  startDate: string
  status: StatusColaborador
  createdAt?: number
}

export type EntradaColaborador = Omit<Colaborador, 'id' | 'createdAt'>
