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
import type { Colaborador, EntradaColaborador } from '../types/employee'

const COLECAO_COLABORADORES = 'employees'

export const listarColaboradores = (
  aoReceber: (colaboradores: Colaborador[]) => void,
  aoFalhar: (erro: Error) => void,
) => {
  const consultaColaboradores = query(
    collection(db, COLECAO_COLABORADORES),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(
    consultaColaboradores,
    (snapshot) => {
      const colaboradores = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Colaborador, 'id' | 'createdAt'> & {
          createdAt?: Timestamp
        }

        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis(),
        }
      })

      aoReceber(colaboradores)
    },
    (erroFirestore) => {
      aoFalhar(new Error(erroFirestore.message))
    },
  )
}

export const criarColaborador = async (colaborador: EntradaColaborador) => {
  await addDoc(collection(db, COLECAO_COLABORADORES), {
    ...colaborador,
    createdAt: serverTimestamp(),
  })
}

export const atualizarColaborador = async (idColaborador: string, colaborador: EntradaColaborador) => {
  const referenciaColaborador = doc(db, COLECAO_COLABORADORES, idColaborador)
  await updateDoc(referenciaColaborador, colaborador)
}

export const excluirColaborador = async (idColaborador: string) => {
  const referenciaColaborador = doc(db, COLECAO_COLABORADORES, idColaborador)
  await deleteDoc(referenciaColaborador)
}

export const excluirColaboradores = async (idsColaboradores: string[]) => {
  await Promise.all(idsColaboradores.map((idColaborador) => excluirColaborador(idColaborador)))
}
