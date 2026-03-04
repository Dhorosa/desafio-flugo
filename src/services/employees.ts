import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Employee, EmployeeInput } from '../types/employee'

const EMPLOYEE_COLLECTION = 'employees'

export const subscribeEmployees = (
  onNext: (employees: Employee[]) => void,
  onError: (error: Error) => void,
) => {
  const employeesQuery = query(
    collection(db, EMPLOYEE_COLLECTION),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(
    employeesQuery,
    (snapshot) => {
      const employees = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Employee, 'id' | 'createdAt'> & {
          createdAt?: Timestamp
        }

        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis(),
        }
      })

      onNext(employees)
    },
    (firestoreError) => {
      onError(new Error(firestoreError.message))
    },
  )
}

export const createEmployee = async (employee: EmployeeInput) => {
  await addDoc(collection(db, EMPLOYEE_COLLECTION), {
    ...employee,
    createdAt: serverTimestamp(),
  })
}

export const updateEmployee = async (employeeId: string, employee: EmployeeInput) => {
  const employeeRef = doc(db, EMPLOYEE_COLLECTION, employeeId)
  await updateDoc(employeeRef, employee)
}

export const deleteEmployee = async (employeeId: string) => {
  const employeeRef = doc(db, EMPLOYEE_COLLECTION, employeeId)
  await deleteDoc(employeeRef)
}
