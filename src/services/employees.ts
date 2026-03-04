import {
  Timestamp,
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
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
