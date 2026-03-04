# Desafio Frontend - Cadastro de Colaboradores

## Tecnologias usadas

- React 19
- TypeScript
- Vite
- Material UI
- React Hook Form
- Zod
- Firebase Firestore

## Como executar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo de ambiente local a partir do exemplo:

```bash
cp .env.example .env.local
```

3. Preencha o `.env.local` com as variaveis do seu projeto Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

4. Rode o projeto:

```bash
npm run dev
```

5. Acesse no navegador:

- http://localhost:5173
