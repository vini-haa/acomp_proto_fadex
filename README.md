# Dashboard de Acompanhamento de Protocolos - FADEX

Sistema de monitoramento e análise de protocolos que passam pelo setor financeiro da Fundação FADEX.

## 🚀 Stack Tecnológica

### Frontend

- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** (React Query) - Gerenciamento de estado servidor
- **TanStack Table v8** - Tabelas avançadas
- **Recharts** + **Nivo** - Visualizações de dados
- **date-fns** - Manipulação de datas (locale pt-BR)
- **Lucide React** - Ícones
- **Sonner** - Toast notifications
- **next-themes** - Dark mode

### Backend

- **Next.js API Routes**
- **mssql** - Driver SQL Server
- **Zod** - Validação de schemas

## 📁 Estrutura do Projeto

```
protocolos-dashboard/
├── app/
│   ├── (dashboard)/              # Grupo de rotas do dashboard
│   │   ├── layout.tsx            # Layout com sidebar
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── protocolos/           # Listagem de protocolos
│   │   ├── analises/             # Páginas de análise
│   │   │   ├── temporal/
│   │   │   ├── por-assunto/
│   │   │   ├── por-projeto/
│   │   │   └── por-setor/
│   │   └── alertas/              # Protocolos críticos
│   ├── api/                      # API Routes
│   │   ├── kpis/
│   │   ├── protocolos/
│   │   ├── analytics/
│   │   └── alertas/
│   ├── layout.tsx                # Layout root
│   └── globals.css               # Estilos globais
├── components/
│   ├── ui/                       # Componentes shadcn/ui
│   ├── dashboard/                # Componentes do dashboard
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── KPICards.tsx
│   │   ├── StatusBadge.tsx
│   │   └── AlertIndicator.tsx
│   ├── charts/                   # Componentes de gráficos
│   ├── tables/                   # Componentes de tabelas
│   ├── filters/                  # Componentes de filtros
│   ├── timeline/                 # Timeline de protocolos
│   └── providers/                # Providers (Theme, Query)
├── lib/
│   ├── db.ts                     # Conexão SQL Server
│   ├── queries/                  # Queries SQL organizadas
│   ├── schemas/                  # Schemas Zod
│   └── utils.ts                  # Utilitários
├── types/                        # Tipos TypeScript
├── hooks/                        # Hooks customizados
├── database/                     # Scripts SQL
│   └── create_view_protocolos_financeiro.sql
└── public/                       # Arquivos estáticos
```

## 🔧 Configuração

### 1. Instalar Dependências

```bash
npm install --legacy-peer-deps
```

> **Nota**: O flag `--legacy-peer-deps` é necessário devido a incompatibilidades entre React 19 e algumas bibliotecas do Nivo.

### 2. Configurar Banco de Dados

#### a) Executar o script SQL

Execute o script SQL localizado em `database/create_view_protocolos_financeiro.sql` no seu SQL Server para criar a view `vw_ProtocolosFinanceiro`.

```sql
-- Conecte-se ao banco de dados FADEX e execute:
.\database\create_view_protocolos_financeiro.sql
```

#### b) Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local` e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

Edite o `.env.local` com suas credenciais do SQL Server:

```env
DB_SERVER=seu_servidor
DB_PORT=1433
DB_DATABASE=FADEX
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

### 3. Executar o Projeto

```bash
# Modo desenvolvimento
npm run dev

# Build de produção
npm run build
npm start

# Linting
npm run lint

# Formatação de código
npm run format
```

O projeto estará disponível em: [http://localhost:3000](http://localhost:3000)

## 📊 Funcionalidades

### ✅ Fase 1: Fundação (Concluída)

- [x] Projeto Next.js 14 com TypeScript
- [x] Configuração Tailwind CSS + shadcn/ui
- [x] Estrutura de pastas completa
- [x] Layout com sidebar e header
- [x] Dark mode
- [x] React Query configurado
- [x] Script SQL da view base

### 🚧 Fase 2: Backend e API (Próxima)

- [ ] Conexão SQL Server (lib/db.ts)
- [ ] Tipos TypeScript completos
- [ ] Schemas Zod
- [ ] 12 API Routes implementadas
- [ ] Testes de integração

### 🔮 Fase 3: Dashboard KPIs

- [ ] 7 KPIs principais
- [ ] Hooks customizados
- [ ] Loading states
- [ ] Error handling

### 🔮 Fase 4: Tabela de Protocolos

- [ ] TanStack Table
- [ ] Filtros avançados
- [ ] Paginação server-side
- [ ] Página de detalhe com timeline

### 🔮 Fase 5: Gráficos e Análises

- [ ] 6 visualizações (Recharts + Nivo)
- [ ] Páginas de análise
- [ ] Drill-down interativo

### 🔮 Fase 6: Finalizações

- [ ] Página de alertas
- [ ] Exportação CSV/Excel
- [ ] Auto-refresh
- [ ] Performance optimization

## 🎨 Componentes shadcn/ui Instalados

- ✅ button
- ✅ card
- ✅ input
- ✅ label
- ✅ select
- ✅ table
- ✅ skeleton
- ✅ badge
- ✅ separator
- ✅ tabs
- ✅ toast
- ✅ dropdown-menu
- ✅ dialog
- ✅ popover
- ✅ command

## 📚 Documentação Adicional

### Queries SQL Disponíveis

A view `vw_ProtocolosFinanceiro` fornece os seguintes campos:

- `codprot` - ID do protocolo
- `dt_entrada` - Data de entrada no financeiro
- `dt_saida` - Data de saída (NULL se em andamento)
- `dt_ultima_movimentacao` - Última movimentação
- `setor_origem_inicial` - Setor de origem
- `setor_destino_final` - Setor de destino
- `setor_atual` - Setor atual
- `status_protocolo` - 'Em Andamento', 'Finalizado', 'Histórico'
- `dias_no_financeiro` - Dias totais no setor
- `horas_no_financeiro` - Horas totais no setor
- `faixa_tempo` - Categorização de tempo
- `ano_entrada`, `mes_entrada`, `semana_entrada` - Dados temporais
- `periodo_entrada` - Formato 'yyyy-MM'
- `dia_semana_entrada` - Nome do dia da semana

### Navegação

O sistema possui as seguintes rotas:

- `/` - Dashboard principal com KPIs
- `/protocolos` - Listagem de protocolos
- `/protocolos/[id]` - Detalhe do protocolo
- `/alertas` - Protocolos críticos
- `/analises/temporal` - Análise temporal
- `/analises/por-assunto` - Análise por assunto
- `/analises/por-projeto` - Análise por projeto
- `/analises/por-setor` - Fluxo entre setores

## 🐛 Troubleshooting

### Erro de peer dependencies

Se encontrar erros de peer dependencies ao instalar pacotes, use:

```bash
npm install --legacy-peer-deps
```

### Erro de conexão com SQL Server

Verifique se:

1. O SQL Server está rodando
2. As credenciais no `.env.local` estão corretas
3. A view `vw_ProtocolosFinanceiro` foi criada
4. O firewall permite conexões na porta 1433

### Dark mode não funciona

Certifique-se de que o `ThemeProvider` está envolvendo a aplicação no `app/layout.tsx`.

## 👥 Contribuindo

Este é um projeto interno da FADEX. Para contribuir:

1. Crie uma branch para sua feature
2. Faça commit das mudanças
3. Abra um Pull Request

## 📄 Licença

Propriedade da Fundação FADEX © 2025

---

**Desenvolvido com** ❤️ **para o Setor Financeiro FADEX**
