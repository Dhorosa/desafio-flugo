# Desafio Frontend - Cadastro de Colaboradores

Aplicacao React + TypeScript + Material UI com formulario multi-step e persistencia no Firebase Firestore.

## Stack

- React 19 + TypeScript
- Vite
- Material UI
- React Hook Form + Zod
- Firebase Firestore

## 1) Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 2) Configurar Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e crie um projeto.
2. Em **Build > Firestore Database**, crie um banco no modo Production ou Test.
3. Em **Project settings > Your apps**, crie um app Web e copie as chaves.
4. Preencha o arquivo `.env.local` com:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Crie os indices sugeridos pelo Firestore (se ele pedir) para a collection `employees` ordenada por `createdAt`.

### Regras basicas de Firestore (exemplo para desafio)

Use em **Firestore Database > Rules**:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /employees/{document=**} {
      allow read, write: if true;
    }
  }
}
```

Importante: para producao real, substitua por regras com autenticacao.

## 3) Scripts

```bash
npm run dev
npm run build
npm run preview
```

## 4) Subir no GitHub

No terminal da pasta do projeto:

```bash
git init
git add .
git commit -m "feat: desafio frontend com firebase"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/desafio-flugo.git
git push -u origin main
```

## 5) Deploy na Vercel

1. Acesse [Vercel](https://vercel.com/) e clique em **Add New > Project**.
2. Importe o repositorio do GitHub.
3. Em **Environment Variables**, adicione todas as variaveis `VITE_FIREBASE_*`.
4. Deploy.

O projeto ja inclui `vercel.json` para rewrite SPA.

## Estrutura principal

- `src/App.tsx`: tela, tabela e formulario multi-step
- `src/lib/firebase.ts`: inicializacao do Firebase
- `src/services/employees.ts`: leitura/gravação no Firestore
- `src/types/employee.ts`: tipos do dominio
