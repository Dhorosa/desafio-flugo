export type EmployeeStatus = 'Ativo' | 'Inativo'

export type Employee = {
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
  status: EmployeeStatus
  createdAt?: number
}

export type EmployeeInput = Omit<Employee, 'id' | 'createdAt'>
