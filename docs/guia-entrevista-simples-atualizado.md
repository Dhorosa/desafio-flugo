# Guia Simples e Completo para Entrevista (Codigo Atual)

## Como usar este guia
Este material foi escrito para voce explicar o projeto com seguranca em entrevista tecnica.
A ideia e: linguagem simples, explicacao profunda e foco no que entrevistador costuma perguntar.

Leia nesta ordem:
1. Visao geral
2. Arquitetura
3. Fluxo de dados
4. Arquivo por arquivo
5. Perguntas e respostas de entrevista
6. Riscos e melhorias

---

## 1) Visao geral do projeto (fala pronta de 30-60 segundos)

Este projeto e uma aplicacao web para gerenciamento de colaboradores.
Ele tem duas experiencias principais:
- Listagem de colaboradores (com status e acoes de alterar/excluir)
- Formulario de cadastro/edicao em 2 etapas (infos basicas e infos profissionais)

Stack usada:
- React + TypeScript
- Material UI para interface
- React Hook Form + Zod para formulario e validacao
- Firebase Firestore para persistencia
- Vercel para deploy

Ponto forte principal:
- A lista usa atualizacao em tempo real (`onSnapshot`), entao qualquer alteracao no banco aparece automaticamente na tela sem refresh manual.

---

## 2) Arquitetura usada (simples de explicar)

### Tipo de arquitetura
A arquitetura usada e uma combinacao de:
- Arquitetura por camadas (UI, servico, infraestrutura, tipos)
- Estrutura modular por responsabilidade

Nao e uma arquitetura enterprise pesada (tipo Clean Architecture completa com casos de uso separados), mas e organizada e suficiente para esse escopo.

### Camadas no projeto

1. Camada de UI (Tela)
- Arquivo: `src/App.tsx`
- Responsavel por: layout, tabela, navegacao entre tela de lista e formulario, estados de loading/erro.

2. Camada de servico (dados)
- Arquivo: `src/services/employees.ts`
- Responsavel por: conversar com Firestore (`create`, `update`, `delete`, `subscribe`).

3. Camada de infraestrutura
- Arquivo: `src/lib/firebase.ts`
- Responsavel por: inicializar Firebase e expor a conexao com Firestore.

4. Camada de tipos de dominio
- Arquivo: `src/types/employee.ts`
- Responsavel por: definir o formato de dados do colaborador (`Employee`, `EmployeeInput`).

5. Camada de bootstrap/tema
- Arquivos: `src/main.tsx`, `src/theme.ts`, `src/index.css`
- Responsavel por: inicializacao do app, tema global MUI e base visual.

### Por que essa arquitetura?
Porque entrega tres ganhos claros para entrevista:
- Clareza: cada arquivo tem uma responsabilidade principal.
- Manutencao: mudancas no banco ficam no servico, nao espalhadas na UI.
- Escalabilidade: e simples evoluir para componentes menores e novos modulos.

---

## 3) Fluxo de dados (CRUD) explicado passo a passo

## 3.1 Leitura de colaboradores
1. `App.tsx` monta.
2. `useEffect` chama `subscribeEmployees(...)`.
3. `employees.ts` abre um listener realtime com `onSnapshot`.
4. Sempre que muda algo na colecao `employees`, callback devolve lista atualizada.
5. `setEmployees(...)` atualiza a tabela.

Por que assim?
- Melhor UX: atualiza instantaneamente.
- Menos codigo de refresh manual.

## 3.2 Criacao de colaborador
1. Usuario abre formulario (`openCreateForm`).
2. Preenche etapa 1 e 2.
3. Clica concluir.
4. `submitForm` chama `createEmployee(data)`.
5. Firestore grava documento.
6. Listener `onSnapshot` atualiza tabela automaticamente.

Por que assim?
- Fluxo simples.
- Evita buscar lista de novo apos salvar.

## 3.3 Edicao de colaborador
1. Usuario clica `Alterar` na lista.
2. `openEditForm(employee)` preenche formulario com dados atuais (`reset(...)`).
3. Usuario altera.
4. `submitForm` detecta `editingEmployee` e chama `updateEmployee(id, data)`.
5. Lista atualiza via listener realtime.

Por que assim?
- Reuso do mesmo formulario para criar e editar.
- Menos duplicacao de codigo.

## 3.4 Exclusao de colaborador
1. Usuario clica `Excluir`.
2. Abre dialog de confirmacao (`deleteTarget`).
3. Clicando confirmar, `confirmDeleteEmployee()` chama `deleteEmployee(id)`.
4. Listener atualiza a lista automaticamente.

Por que dialog?
- Evita exclusao acidental.

---

## 4) Explicacao detalhada arquivo por arquivo

## 4.1 `src/App.tsx` (arquivo central)

### O que ele faz
- Renderiza sidebar + area principal.
- Mostra lista de colaboradores.
- Controla transicao entre modo lista e modo formulario.
- Controla etapas do formulario.
- Faz integracao com servico para criar/editar/excluir.

### Principais blocos e por que existem

### `formSchema` (Zod)
Define regras de validacao para todos os campos.

Por que criar?
- Centraliza validacao em um unico lugar.
- Evita validacao espalhada em cada input.
- Com `zodResolver`, integra direto ao RHF.

### `type FormValues = z.infer<typeof formSchema>`
Gera tipo TS a partir do schema.

Por que assim?
- Evita divergencia entre tipo e validacao.
- Se schema muda, tipo acompanha.

### `formSteps`
Lista os nomes das etapas.

Por que existe?
- Facilita render dinamico da navegacao lateral.
- Evita string hardcoded espalhada.

### `stepFields`
Diz quais campos pertencem a cada etapa.

Por que existe?
- Permite validar somente os campos da etapa atual com `trigger(fields)`.

### `defaultValues`
Estado inicial padrao do formulario.

Por que existe?
- Reutilizado em `reset` para limpar formulario.
- Evita repeticao de objeto em varios pontos.

### Estados React e o motivo de cada um
- `employees`: dados da tabela.
- `viewMode`: controla se mostra lista ou formulario.
- `activeStep`: controla etapa atual do formulario.
- `isLoadingEmployees`: mostra feedback de carregamento.
- `isSavingEmployee`: bloqueia submit duplicado.
- `isDeletingEmployee`: bloqueia exclusao duplicada.
- `employeeError`: mostra erro de persistencia para usuario.
- `editingEmployee`: indica se formulario esta em modo edicao.
- `deleteTarget`: guarda quem sera excluido no dialog.

### `useForm(...)`
Configura React Hook Form com Zod resolver e defaults.

Por que RHF?
- Menos rerender.
- API simples para formularios grandes.

### `useMemo(initialsColor)`
Memoiza lista de cores usadas em avatares.

Por que usar `useMemo` aqui?
- Evita recriar array a cada render.
- Nao e um ganho gigante, mas mantem padrao consistente.

### `useEffect(... subscribeEmployees ... )`
Assina listener realtime no Firestore e retorna unsubscribe.

Por que essa forma?
- `useEffect` com array vazio executa no mount.
- Retorno `unsubscribe` evita memory leak.

### Funcoes de navegacao/formulario

#### `openCreateForm()`
- Limpa estado de edicao.
- Zera etapa.
- Limpa erros.
- Reseta campos.
- Entra em modo formulario.

Por que importante?
- Garante formulario limpo para novo cadastro.

#### `openEditForm(employee)`
- Guarda colaborador em edicao.
- Preenche campos com dados atuais.
- Muda para tela de formulario.

Por que importante?
- Reuso da mesma tela para editar.

#### `goToList()`
- Volta para listagem e limpa estado de formulario.

Por que importante?
- Evita estado sujo entre operacoes.

#### `goNextStep()`
- Pega os campos da etapa atual.
- Roda validacao desses campos (`trigger`).
- So avanca se validou.

Por que importante?
- UX melhor: usuario corrige erro no momento certo.

#### `goBackStep()`
- Se estiver na etapa 0, volta para lista.
- Caso contrario, volta uma etapa.

Por que assim?
- Comportamento natural do fluxo page-based.

#### `submitForm` (via `handleSubmit`)
- Ativa loading de save.
- Decide criar ou atualizar.
- Em sucesso, volta para lista.
- Em erro, mostra mensagem amigavel.
- Sempre desativa loading no `finally`.

Por que essa estrutura try/catch/finally?
- Controle claro de sucesso/erro.
- Evita spinner preso.

#### `confirmDeleteEmployee()`
- Garante que existe alvo.
- Chama delete no servico.
- Fecha dialog e volta para lista.

Por que separado?
- Facil de testar e entender.
- Dialog so dispara quando usuario confirma.

### Renderizacao principal

O componente renderiza duas experiencias:
- `viewMode === 'list'`: tabela com botoes alterar/excluir
- `viewMode === 'form'`: fluxo de duas etapas com barra de progresso

Por que separar por `viewMode`?
- Simples para o escopo.
- Evita router e complexidade extra sem necessidade.

### Pontos que podem perguntar sobre esse arquivo
- "Por que nao separou em componentes menores?"
  - Resposta: prioridade foi velocidade de entrega. O proximo passo e extrair `EmployeeTable`, `EmployeeForm`, `StepSidebar`.

- "Por que status com Switch em vez de select?"
  - Resposta: para uma decisao binaria (`Ativo/Inativo`), switch e mais claro visualmente.

---

## 4.2 `src/services/employees.ts`

### Responsabilidade
Centralizar regras de acesso ao Firestore.

### Funcoes

#### `subscribeEmployees(onNext, onError)`
- Monta query ordenada por `createdAt` desc.
- Usa `onSnapshot` para tempo real.
- Faz mapping de docs para `Employee`.
- Converte `Timestamp` em `number` (`toMillis`).
- Encaminha erro com `onError`.

Por que desse jeito?
- UI fica desacoplada de detalhes do Firestore.
- Facil trocar backend no futuro com menor impacto na tela.

#### `createEmployee(employee)`
- `addDoc` na colecao `employees`.
- inclui `createdAt: serverTimestamp()`.

Por que `serverTimestamp`?
- Ordenacao consistente com relogio do servidor.

#### `updateEmployee(employeeId, employee)`
- monta referencia de documento por id.
- atualiza campos com `updateDoc`.

Por que funcao separada?
- explicita intencao de update.
- evita codigo de update dentro da UI.

#### `deleteEmployee(employeeId)`
- referencia doc por id e remove com `deleteDoc`.

Por que separado?
- sem acoplamento da UI com API do Firestore.

---

## 4.3 `src/lib/firebase.ts`

### Responsabilidade
Inicializar Firebase uma vez e exportar `db`.

### Partes importantes
- `requiredEnvVars`: lista obrigatoria de envs.
- loop valida env faltando e lanca erro claro.
- `firebaseConfig`: monta config com `import.meta.env`.
- `initializeApp` + `getFirestore`.

Por que validar env no startup?
- Falhar cedo (fail fast).
- Evita bug silencioso em runtime mais tarde.

---

## 4.4 `src/types/employee.ts`

### Responsabilidade
Tipar o dominio.

### Tipos
- `EmployeeStatus`: `'Ativo' | 'Inativo'`
- `Employee`: modelo completo da entidade.
- `EmployeeInput`: remove `id` e `createdAt` para escrita.

Por que `EmployeeInput`?
- Cliente nao deve enviar campos gerados pelo backend.

---

## 4.5 `src/main.tsx`

### Responsabilidade
Ponto de entrada do React.

- `createRoot` para render.
- `StrictMode` para boas praticas em dev.
- `ThemeProvider` aplica tema global.
- `CssBaseline` padroniza base de estilos.

---

## 4.6 `src/theme.ts`

### Responsabilidade
Tema global do Material UI.

- define paleta
- tipografia
- border radius
- overrides de Paper/Button

Por que centralizar tema?
- consistencia visual
- manutencao mais simples

---

## 4.7 Arquivos de config que podem cair na entrevista

## `package.json`
- scripts de dev/build/lint/preview
- dependencias e devDependencies

Pergunta comum: "como garantir qualidade antes de deploy?"
- responder: uso `npm run build` (typecheck + build). Pode evoluir para pipeline CI.

## `vercel.json`
- rewrite SPA para `index.html`

Por que importante?
- sem isso, rotas client-side podem dar 404 em deploy.

## `.env.example`
- modelo de variaveis sem segredo

Por que importante?
- onboarding rapido e seguro.

## `.gitignore`
- impede subir `.env` e artefatos.

---

## 5) Decisoes tecnicas e trade-offs (o que falar com maturidade)

## Decisao 1: tudo em `App.tsx`
Vantagem:
- entrega rapida
- facil para projeto pequeno

Desvantagem:
- arquivo grande
- manutencao pior com crescimento

Melhoria:
- separar em componentes.

## Decisao 2: realtime (`onSnapshot`)
Vantagem:
- UX melhor
- sincronizacao automatica

Desvantagem:
- custo/leituras de banco podem subir

Melhoria:
- paginacao + filtros + controle de escopo de dados.

## Decisao 3: validacao frontend com Zod
Vantagem:
- feedback rapido ao usuario

Desvantagem:
- seguranca real ainda depende de regras backend

Melhoria:
- reforcar validacao/regras no Firestore + autenticacao.

---

## 6) Possiveis perguntas tecnicas (com respostas simples)

## Pergunta: "Como voce evita submit duplo?"
Resposta:
- estado `isSavingEmployee` desabilita botao enquanto request esta em andamento.

## Pergunta: "Como trata erro de rede/banco?"
Resposta:
- `try/catch` nas operacoes e exibicao de `employeeError` para feedback.

## Pergunta: "Como garante que lista fica atualizada?"
Resposta:
- `subscribeEmployees` usa `onSnapshot` realtime.

## Pergunta: "Por que usar `Controller` em alguns campos e `register` em outros?"
Resposta:
- `register` para inputs simples.
- `Controller` para componentes controlados do MUI (`Select`, `Switch`).

## Pergunta: "Qual arquitetura voce diria que usou?"
Resposta:
- modular por responsabilidade, com camadas de UI, servico, infraestrutura e tipos.

## Pergunta: "Como funciona o fluxo de editar?"
Resposta:
- `openEditForm` injeta dados atuais no form com `reset` e submit chama `updateEmployee`.

## Pergunta: "Como funciona o delete seguro?"
Resposta:
- usuario seleciona colaborador, abre dialog confirmatorio, so depois chama `deleteEmployee`.

## Pergunta: "O que voce melhoraria agora?"
Resposta:
1. extrair componentes menores
2. testes unitarios e de integracao
3. mascaras de input (telefone/data)
4. autenticacao + regras de seguranca fortes no Firestore

---

## 7) Bugs/riscos que voce ja sabe (isso passa credibilidade)

1. `App.tsx` esta grande.
2. Em alguns terminais Windows, caracteres especiais podem aparecer estranhos (nao impacta logica).
3. Bundle final acima de 500kB (warning de build). Pode melhorar com code splitting.

Falar riscos mostra maturidade tecnica.

---

## 8) Roteiro de apresentacao (5 minutos)

1. Problema e objetivo (30s)
2. Stack e arquitetura (45s)
3. Demo da listagem (45s)
4. Demo de cadastro em 2 passos (1min)
5. Demo de edicao e exclusao (1min)
6. Persistencia realtime no Firebase (40s)
7. Fechamento com melhorias futuras (20s)

---

## 9) Frases prontas para usar na entrevista

- "Separei responsabilidades para manter manutencao simples: UI no App, dados no service e infraestrutura no firebase.ts."
- "A validacao por etapa reduz friccao e ajuda o usuario a corrigir no contexto certo."
- "Usei listener realtime para manter lista sincronizada sem refresh."
- "No submit, uso fluxo defensivo com loading, try/catch e finally para UX consistente."
- "Com mais tempo, eu quebraria o App em componentes e adicionaria testes automatizados."

---

## 10) Checklist final antes da entrevista

1. Testar criar, editar e excluir no ambiente online.
2. Confirmar que local e Vercel apontam para o mesmo projeto Firebase.
3. Revisar este guia e treinar respostas em voz alta.
4. Saber explicar 3 coisas com clareza:
   - arquitetura
   - fluxo de dados
   - motivos das decisoes

Se voce explicar essas tres partes com calma, voce domina a entrevista desse projeto.
