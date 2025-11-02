# Painel Administrativo Web - Sistema de Gestão

Painel web para gerenciar clientes, máquinas, relatórios, tintas e solventes. Utiliza Firebase como backend compartilhado com aplicativo Android.

## Funcionalidades

### Gerenciamento de Clientes
- Criar, editar e excluir clientes
- Campos: nome, CPF/CNPJ, telefone, email, endereço
- Busca por nome ou documento
- Interface responsiva com tabela completa

### Gerenciamento de Máquinas
- Vincular máquinas a clientes
- Campos: fabricante, modelo, número de série, ano, identificação, configuração
- Status ativo/inativo
- Filtros e busca avançada

### Gerenciamento de Relatórios
- Criar relatórios vinculados a clientes e máquinas
- Campos: título, descrição, status, dados do equipamento
- Status: Rascunho, Em Progresso, Pré-Assinatura, Aguardando Assinatura, Finalizado
- Sistema de assinaturas (cliente e técnico)
- Suporte para anexos (fotos via Firebase Storage)

### Catálogos
- **Tintas**: código, descrição, fabricante, cor (hex)
- **Solventes**: código, descrição, fabricante

## Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase (Firestore + Auth + Storage)
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React
- **Roteamento**: React Router DOM

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Copie .env.example para .env e preencha com suas credenciais Firebase

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_PROJECT_ID=seu-project-id
VITE_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
VITE_FIREBASE_AUTH_DOMAIN=seu-auth-domain
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
VITE_FIREBASE_APP_ID=seu-app-id
```

## Estrutura do Firestore

### Coleções

- `clientes` - Dados dos clientes
- `maquinas` - Máquinas vinculadas a clientes
- `relatorios` - Relatórios de manutenção/serviço
- `tintas` - Catálogo de tintas (código como ID do documento)
- `solventes` - Catálogo de solventes (código como ID do documento)

Todas as coleções possuem Firestore Security Rules habilitadas e requerem autenticação.

## Integração com Android

Este painel compartilha o mesmo backend Firebase com o aplicativo Android. Consulte [ANDROID_INTEGRATION.md](./ANDROID_INTEGRATION.md) para instruções detalhadas de como conectar seu app Android.

## Autenticação

O sistema usa Firebase Auth com email/senha. Funcionalidades:

- Registro de novos usuários
- Login/Logout
- Sessão persistente
- Rotas protegidas

## Regras de Segurança Firebase

### Firestore Security Rules

O arquivo `firestore.rules` contém as regras de segurança do Firestore. Para aplicar:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto
firebase init firestore

# Deploy das regras
firebase deploy --only firestore:rules
```

### Storage Security Rules

O arquivo `storage.rules` contém as regras de segurança do Firebase Storage. Para aplicar:

```bash
firebase deploy --only storage:rules
```

## Deploy

Recomendado para deploy:

- **Vercel**: Deploy automático do GitHub
- **Netlify**: CI/CD gratuito
- **Firebase Hosting**: Hospedagem integrada do Firebase

### Deploy no Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar Hosting
firebase init hosting

# Build e Deploy
npm run build
firebase deploy --only hosting
```

### Deploy no Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Build Otimizado

```bash
npm run build
# Arquivos gerados em /dist
```

## Estrutura de Arquivos

```
src/
├── components/          # Componentes React
│   ├── ClientesManager.tsx
│   ├── MaquinasManager.tsx
│   ├── RelatoriosManager.tsx
│   ├── TintasManager.tsx
│   ├── SolventesManager.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # Contexts React
│   └── AuthContext.tsx
├── lib/               # Utilitários
│   └── firebase.ts    # Cliente Firebase
├── pages/             # Páginas
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   └── Register.tsx
├── App.tsx           # Componente principal
└── main.tsx          # Entry point
```

## Desenvolvimento

### Comandos Disponíveis

```bash
# Desenvolvimento com hot reload
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build
npm run build
```

### Adicionar Nova Funcionalidade

1. Criar componente em `src/components/`
2. Criar tipo em `src/lib/firebase.ts`
3. Adicionar rota no Dashboard
4. Implementar CRUD com Firestore
5. Atualizar regras de segurança em `firestore.rules`

## Segurança

- ✅ Firestore Security Rules em todas as coleções
- ✅ Regras de acesso para usuários autenticados
- ✅ Validação no frontend
- ✅ Proteção de rotas
- ✅ Autenticação Firebase Auth
- ✅ Storage Rules para controle de upload de arquivos

## Performance

- Bundle otimizado com Vite
- Lazy loading de componentes
- Otimização de imagens via Firebase Storage
- Cache automático do Firestore

## Suporte

Para dúvidas sobre integração Android, consulte [ANDROID_INTEGRATION.md](./ANDROID_INTEGRATION.md).

## Licença

MIT
