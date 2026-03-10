export type Departamento = {
  id: string
  name: string
  managerId: string
  createdAt?: number
}

export type EntradaDepartamento = Omit<Departamento, 'id' | 'createdAt'>
