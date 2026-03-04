# Guia de Entrevista Tecnica - Desafio Flugo

## Objetivo do projeto
Este projeto implementa um cadastro de colaboradores em formato multi-step usando React + TypeScript + Material UI, com persistencia em Firebase Firestore e deploy na Vercel.

Este guia foi feito para voce conseguir explicar o projeto em entrevista com foco no que normalmente eh perguntado: arquitetura, escolhas tecnicas, fluxo de dados, validacao, UX, persistencia e deploy.

## Resumo executivo (fala de 1 minuto)
- Construi uma SPA com React e TypeScript usando Vite.
- A interface usa Material UI e reproduz o layout pedido (lista de colaboradores + modal de cadastro).
- O formulario eh multi-step (3 etapas) com validacao por etapa usando React Hook Form + Zod.
- Os dados sao persistidos no Firestore.
- A listagem eh em tempo real com `onSnapshot`, entao local e ambiente online mostram o mesmo dado quando apontam para o mesmo projeto Firebase.
- O deploy foi feito na Vercel com variaveis de ambiente `VITE_FIREBASE_*`.

## Arquitetura da solucao
### Camadas
1. UI/Container: `src/App.tsx`
2. Infra de app (bootstrap + tema): `src/main.tsx`, `src/theme.ts`, `src/index.css`
3. Infra Firebase: `src/lib/firebase.ts`
4. Camada de dados (servico): `src/services/employees.ts`
5. Tipos de dominio: `src/types/employee.ts`
6. Build/deploy/config: `package.json`, `vite.config.ts`, `vercel.json`, `tsconfig*`, `.env.example`

### Fluxo de dados (cadastro)
1. Usuario abre modal e preenche etapas.
2. `react-hook-form` controla estado do formulario.
3. `zodResolver(formSchema)` valida dados.
4. Ao enviar, `createEmployee` grava no Firestore com `serverTimestamp()`.
5. Listener `subscribeEmployees` captura alteracao em tempo real.
6. `setEmployees` atualiza tabela automaticamente.

### Fluxo de dados (listagem)
1. `useEffect` no `App` chama `subscribeEmployees` ao montar.
2. Firestore retorna documentos ordenados por `createdAt` desc.
3. Map para tipo `Employee` e renderizacao da tabela.
4. Cleanup com `unsubscribe` no unmount.

## Explicacao arquivo por arquivo

## `src/App.tsx` (arquivo principal)
### Responsabilidade
Concentra a tela principal, tabela de colaboradores, modal multi-step e integracao com servico de persistencia.

### Tipos e constantes principais
- `formSchema`: schema Zod de validacao.
- `FormValues`: tipo inferido do schema (garante que validacao e tipagem nao divergem).
- `steps`: nomes das etapas.
- `stepFields`: mapeia quais campos validar em cada passo.
- `departments`: opcoes do select.
- `defaultValues`: estado inicial do formulario.

### Estados React
- `employees`: lista exibida na tabela.
- `dialogOpen`: controla modal aberto/fechado.
- `activeStep`: etapa atual do Stepper.
- `isLoadingEmployees`: loading inicial da tabela.
- `isSavingEmployee`: loading durante submit.
- `employeeError`: mensagem de erro de persistencia/listagem.

### Hooks de formulario
`useForm<FormValues>` com:
- `resolver: zodResolver(formSchema)`
- `mode: 'onTouched'`
- `defaultValues`

Metodos usados:
- `register`: campos simples (`TextField`).
- `Controller`: campos controlados (`Select`, `RadioGroup`).
- `trigger`: valida etapa atual antes de avancar.
- `handleSubmit`: submit final.
- `watch`: mostra resumo na etapa de revisao.
- `reset`: limpa formulario ao fechar.

### Funcoes principais
#### `closeDialog()`
- Fecha modal.
- Reseta etapa para 0.
- Reseta formulario para defaults.

Pergunta comum: "por que resetar no close?"
Resposta: para evitar estado sujo de uma tentativa anterior e manter UX previsivel.

#### `useEffect(... subscribeEmployees ... )`
- Inscreve listener realtime no Firestore.
- Sucesso: atualiza `employees`, limpa erro e loading.
- Erro: seta mensagem e encerra loading.
- Retorna `unsubscribe` para evitar memory leak.

Pergunta comum: "por que onSnapshot em vez de fetch unico?"
Resposta: requisito de sincronizacao em tempo real e experiencia mais fluida sem refresh.

#### `goNextStep()`
- Pega campos da etapa atual via `stepFields[activeStep]`.
- Roda `trigger(fields)` para validar so a etapa atual.
- Se valido, avanca para proximo passo.

Pergunta comum: "por que validacao por etapa?"
Resposta: reduz carga cognitiva, evita chegar ao final com muitos erros acumulados.

#### `goBackStep()`
- Volta uma etapa com limite inferior 0.

#### `submitForm`
- `handleSubmit(async (data) => {...})`
- Liga `isSavingEmployee`.
- Chama `createEmployee(data)`.
- Em sucesso: fecha modal e limpa form.
- Em erro: mostra `employeeError`.
- Sempre desliga loading no `finally`.

Pergunta comum: "como evitou duplo submit?"
Resposta: botao final fica `disabled={isSavingEmployee}` durante operacao.

### Componentes de UI relevantes
- `Grid` principal com sidebar em desktop e conteudo responsivo.
- `Table` com estados: carregando, vazio e preenchido.
- `Chip` para status ativo/inativo.
- `Dialog` com `Stepper` para multietapas.
- Etapa 1: dados pessoais (`name`, `email`, `phone`).
- Etapa 2: dados profissionais (`department`, `role`, `startDate`, `status`).
- Etapa 3: revisao dos dados (`watch`).

### Pontos fortes que valem citar
- Validacao tipada e centralizada (Zod + RHF).
- Separacao de responsabilidades entre UI e servico Firestore.
- Tratamento de estados de loading/erro.
- Cleanup de subscription.

## `src/services/employees.ts`
### Responsabilidade
Encapsular operacoes de Firestore para colaboradores.

### `EMPLOYEE_COLLECTION`
Constante `'employees'` para evitar string duplicada e erro de digitar collection.

### `subscribeEmployees(onNext, onError)`
- Cria query: `collection(db, 'employees')` + `orderBy('createdAt', 'desc')`.
- Usa `onSnapshot` para atualizacao realtime.
- Mapeia docs para tipo `Employee`.
- Converte `Timestamp` para numero (`toMillis`) para facilitar uso no front.
- Encaminha erro como `Error` padrao.
- Retorna `unsubscribe`.

Pergunta comum: "por que converter Timestamp?"
Resposta: desacopla UI do tipo nativo Firebase e simplifica serializacao/manipulacao.

### `createEmployee(employee)`
- Usa `addDoc` para inserir documento.
- Adiciona `createdAt: serverTimestamp()`.

Pergunta comum: "por que serverTimestamp e nao Date.now?"
Resposta: padroniza horario no servidor e evita divergencia de relogio entre clientes.

## `src/lib/firebase.ts`
### Responsabilidade
Inicializacao unica do Firebase App e export do Firestore (`db`).

### Logica importante
- Lista `requiredEnvVars` com todas variaveis esperadas.
- Loop de validacao: se faltar alguma variavel, lanca erro claro.
- Monta `firebaseConfig` a partir de `import.meta.env`.
- Inicializa app com `initializeApp` e Firestore com `getFirestore`.

Pergunta comum: "por que validar env no startup?"
Resposta: falhar cedo com erro explicito reduz tempo de debug e evita falhas silenciosas.

## `src/types/employee.ts`
### Responsabilidade
Modelagem tipada do dominio de colaborador.

- `EmployeeStatus`: uniao literal `'Ativo' | 'Inativo'`.
- `Employee`: modelo completo persistido/lido (inclui `id` e opcional `createdAt`).
- `EmployeeInput`: modelo de escrita (`Omit<Employee, 'id' | 'createdAt'>`).

Pergunta comum: "por que separar input do modelo completo?"
Resposta: evita enviar campos gerados pelo backend e melhora seguranca de tipo.

## `src/main.tsx`
### Responsabilidade
Bootstrap da aplicacao.

- `createRoot(...).render(...)`
- `StrictMode`
- `ThemeProvider` com `appTheme`
- `CssBaseline` para reset consistente
- render do `App`

## `src/theme.ts`
### Responsabilidade
Tema central do Material UI.

### O que esta customizado
- Paleta (primary, background, text).
- `shape.borderRadius`.
- Tipografia (peso em `h5`, `subtitle1`, `button`).
- Overrides de componentes:
  - `MuiPaper` com sombra custom.
  - `MuiButton` com borda arredondada.

Pergunta comum: "por que tema centralizado?"
Resposta: consistencia visual e escalabilidade para novas telas.

## `src/index.css`
### Responsabilidade
Reset/base global minima (box-sizing, tamanho root, margem, fonte).

## `src/vite-env.d.ts`
Referencia de tipos do Vite para `import.meta.env` no TypeScript.

## `src/App.css`
Arquivo legado do template Vite (nao utilizado pela tela atual). Em entrevista, voce pode dizer que manteria apenas se fosse reaproveitar; caso contrario removeria para limpeza tecnica.

## `index.html`
Template HTML base da SPA; inclui `<div id="root"></div>` e script `/src/main.tsx`.

## `package.json`
### Scripts
- `dev`: sobe servidor Vite.
- `build`: typecheck (`tsc -b`) + build Vite.
- `lint`: regras ESLint.
- `preview`: preview de build.

### Dependencias-chave
- UI: `@mui/material`, `@mui/icons-material`, `@emotion/*`
- Form/validacao: `react-hook-form`, `zod`, `@hookform/resolvers`
- Backend client: `firebase`

## `vite.config.ts`
Ativa plugin React oficial do Vite.

## `vercel.json`
Rewrite SPA (`/(.*) -> /index.html`) para evitar 404 em rotas client-side.

## `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
Configuram TypeScript com modo estrito, sem emissao local (`noEmit`) e separacao entre app/browser e config/node.

## `eslint.config.js`
Conjunto de regras JS/TS + React Hooks + React Refresh.

## `.gitignore`
Evita versionar artefatos (`node_modules`, `dist`), arquivos sensiveis (`.env*`, exceto `.env.example`) e `.vercel`.

## `.env.example`
Template das variaveis obrigatorias do Firebase sem expor segredos.

## `.vercel/project.json` e `.vercel/README.txt`
Metadados locais de link com projeto Vercel (nao devem ir para o repo).

## Perguntas que realmente costumam cair na entrevista (com resposta sugerida)

## 1) "Por que React Hook Form + Zod?"
Porque RHF tem alta performance com baixo rerender e Zod oferece schema unico para validacao e tipagem, reduzindo bugs de inconsistencias.

## 2) "Como voce controla validacao no multi-step?"
Mantenho `stepFields` e uso `trigger(fieldsDaEtapaAtual)` antes de avancar. Assim valido apenas o necessario em cada passo.

## 3) "Como garantiu sincronizacao de dados entre usuarios/ambientes?"
Usei `onSnapshot` no Firestore. Qualquer escrita na collection `employees` atualiza a UI em tempo real.

## 4) "Como lidou com estados de UX?"
Implementei estados explicitos: loading de lista, lista vazia, erro de persistencia e loading no submit (com botao desabilitado).

## 5) "Quais cuidados de deploy voce tomou?"
Segredos em variaveis de ambiente (`VITE_FIREBASE_*`), `.env` fora do Git e configuracao de rewrite SPA na Vercel.

## 6) "Como modelou os dados?"
Usei tipos `Employee`, `EmployeeInput` e `EmployeeStatus`; `EmployeeInput` impede envio de `id`/`createdAt` pelo cliente.

## 7) "Quais melhorias faria com mais tempo?"
- Separar `App.tsx` em componentes menores.
- Adicionar testes (unitarios de validacao e integracao de fluxo).
- Melhorar mascaras de telefone/data.
- Implementar autenticacao e regras de seguranca fortes no Firestore.
- Paginar lista de colaboradores.

## 8) "Como voce tratou erros de configuracao?"
Validei variaveis obrigatorias na inicializacao (`firebase.ts`) para falhar cedo com erro claro.

## 9) "Quais riscos ve hoje?"
- `App.tsx` esta grande (manutencao futura).
- Regras abertas do Firestore em ambiente de desafio (nao ideal para producao).
- Bundle JS relativamente grande (warning > 500kB); da para otimizar com code-splitting.

## 10) "Como defenderia suas escolhas de arquitetura?"
A estrutura equilibra simplicidade e separacao: UI no `App`, acesso a dados em `services`, infraestrutura em `lib`, e tipos em `types`.

## Checklist para apresentar ao entrevistador
- Mostrar fluxo completo: listar, abrir modal, validar etapas, salvar, refletir na tabela.
- Explicar por que cada biblioteca foi escolhida.
- Explicar como local e producao compartilham banco (mesmo `projectId`).
- Citar limites atuais e melhorias realistas (mostra maturidade).

## Frases prontas (curtas) para entrevista
- "Escolhi React Hook Form + Zod para ter validacao performatica e tipada em um unico fluxo."
- "No multi-step, valido por etapa para melhorar UX e reduzir erro acumulado no submit final."
- "No Firestore usei `onSnapshot` para sincronizacao realtime e `serverTimestamp` para ordenacao confiavel."
- "Centralizei tema e tipografia no MUI para manter consistencia visual e escalar novas telas."
- "No deploy, tratei ambiente com variaveis e rewrite SPA para evitar 404 em navegacao client-side."
