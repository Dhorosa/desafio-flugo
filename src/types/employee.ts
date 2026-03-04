export type EmployeeStatus = 'Ativo' | 'Inativo'

export type Employee = {
  id: string
  name: string
  email: string
  department: string
  role: string
  phone: string
  startDate: string
  status: EmployeeStatus
  createdAt?: number
}

export type EmployeeInput = Omit<Employee, 'id' | 'createdAt'>
