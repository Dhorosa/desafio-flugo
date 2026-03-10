import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { autenticacao } from '../lib/firebase'

type ContextoAutenticacaoType = {
  usuario: User | null
  estaCarregandoAutenticacao: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

const ContextoAutenticacao = createContext<ContextoAutenticacaoType | undefined>(undefined)

type ProvedorAutenticacaoProps = {
  children: ReactNode
}

export function ProvedorAutenticacao({ children }: ProvedorAutenticacaoProps) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [estaCarregandoAutenticacao, setEstaCarregandoAutenticacao] = useState(true)

  useEffect(() => {
    const cancelarInscricao = onAuthStateChanged(autenticacao, (proximoUsuario) => {
      setUsuario(proximoUsuario)
      setEstaCarregandoAutenticacao(false)
    })

    return () => cancelarInscricao()
  }, [])

  const entrar = async (email: string, senha: string) => {
    await signInWithEmailAndPassword(autenticacao, email, senha)
  }

  const sair = async () => {
    await signOut(autenticacao)
  }

  return (
    <ContextoAutenticacao.Provider
      value={{
        usuario,
        estaCarregandoAutenticacao,
        entrar,
        sair,
      }}
    >
      {children}
    </ContextoAutenticacao.Provider>
  )
}

export function usarAutenticacao() {
  const contexto = useContext(ContextoAutenticacao)

  if (!contexto) {
    throw new Error('usarAutenticacao precisa ser usado dentro do ProvedorAutenticacao.')
  }

  return contexto
}
