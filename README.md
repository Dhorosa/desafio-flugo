# Desafio Frontend - Cadastro de Colaboradores

## Tecnologias usadas

- React 19
- TypeScript
- Vite
- Material UI
- React Hook Form
- Zod

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

3. Abra o arquivo `.env.local` e preencha com os valores do ambiente local:

```env
# copie exatamente as chaves que já existem no .env.example
# exemplo:
VITE_CHAVE_EXEMPLO=...
```

4. Rode o projeto:

```bash
npm run dev
```

5. Abra no navegador:

- http://localhost:5173

## Se der erro ao iniciar

- Verifique se o arquivo se chama exatamente `.env.local`
- Verifique se todas as linhas do `.env.local` foram preenchidas
- Reinicie o `npm run dev` depois de alterar o `.env.local`
