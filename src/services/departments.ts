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
import type { Departamento, EntradaDepartamento } from '../types/department'

const COLECAO_DEPARTAMENTOS = 'departments'

export const listarDepartamentos = (
  aoReceber: (departamentos: Departamento[]) => void,
  aoFalhar: (erro: Error) => void,
) => {
  const consultaDepartamentos = query(
    collection(db, COLECAO_DEPARTAMENTOS),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(
    consultaDepartamentos,
    (snapshot) => {
      const departamentos = snapshot.docs.map((documento) => {
        const data = documento.data() as Partial<Omit<Departamento, 'id' | 'createdAt'>> & {
          createdAt?: Timestamp
        }

        return {
          id: documento.id,
          name: data.name ?? '',
          managerId: data.managerId ?? '',
          createdAt: data.createdAt?.toMillis(),
        }
      })

      aoReceber(departamentos)
    },
    (erroFirestore) => {
      aoFalhar(new Error(erroFirestore.message))
    },
  )
}

export const criarDepartamento = async (departamento: EntradaDepartamento) => {
  await addDoc(collection(db, COLECAO_DEPARTAMENTOS), {
    ...departamento,
    createdAt: serverTimestamp(),
  })
}

export const atualizarDepartamento = async (
  idDepartamento: string,
  departamento: EntradaDepartamento,
) => {
  const referenciaDepartamento = doc(db, COLECAO_DEPARTAMENTOS, idDepartamento)
  await updateDoc(referenciaDepartamento, departamento)
}

export const excluirDepartamento = async (idDepartamento: string) => {
  const referenciaDepartamento = doc(db, COLECAO_DEPARTAMENTOS, idDepartamento)
  await deleteDoc(referenciaDepartamento)
}
