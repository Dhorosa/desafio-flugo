# Desafio Frontend - Cadastro de Colaboradores

## Tecnologias usadas

- React 19
- TypeScript
- Vite
- Material UI
- React Hook Form
- Zod
- Firebase Firestore

## Como executar localmente (passo a passo)

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env.local` a partir do `.env.example`:

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env.local
```

No Mac/Linux:

```bash
cp .env.example .env.local
```

3. Abra o arquivo `.env.local` e preencha com os dados do seu Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

4. Onde pegar essas variaveis no Firebase:

- Firebase Console > Project Settings (engrenagem) > Your apps > App Web
- Copie do objeto `firebaseConfig` e cole no `.env.local`

5. Rode o projeto:

```bash
npm run dev
```

6. Abra no navegador:

- http://localhost:5173

## Se der erro ao iniciar

- Verifique se o arquivo se chama exatamente `.env.local`
- Verifique se todas as variaveis `VITE_FIREBASE_*` foram preenchidas
- Reinicie o `npm run dev` depois de alterar o `.env.local`
