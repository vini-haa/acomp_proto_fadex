# Arquitetura - Protocolos Dashboard FADEX

## 1. Estrutura de Rotas

### 1.1 Rotas de Frontend (Dashboard)

```
app/(dashboard)/
├── page.tsx                    # Dashboard principal com KPIs e graficos
├── layout.tsx                  # Layout base com sidebar e cache warmer
├── loading.tsx                 # Loading state global
├── protocolos/
│   ├── page.tsx               # Listagem de protocolos com filtros
│   ├── [id]/
│   │   ├── page.tsx           # Detalhe do protocolo
│   │   └── loading.tsx        # Loading state
│   └── movimentacoes/
│       └── page.tsx           # Historico de movimentacoes
├── analises/
│   ├── por-assunto/page.tsx   # Analise agregada por assunto
│   ├── por-projeto/page.tsx   # Analise por projeto
│   └── por-setor/page.tsx     # Analise por setor
└── configuracoes/page.tsx     # Pagina de configuracoes
```

### 1.2 Rotas de API

#### Protocolos

| Endpoint                           | Metodo | Descricao                                |
| ---------------------------------- | ------ | ---------------------------------------- |
| `/api/protocolos`                  | GET    | Lista protocolos com filtros (query SQL) |
| `/api/protocolos/cached`           | GET    | Lista protocolos do cache (instantaneo)  |
| `/api/protocolos/cached/status`    | GET    | Status do cache                          |
| `/api/protocolos/[id]`             | GET    | Detalhe do protocolo                     |
| `/api/protocolos/[id]/completo`    | GET    | Protocolo enriquecido                    |
| `/api/protocolos/[id]/timeline`    | GET    | Timeline de movimentacoes                |
| `/api/protocolos/[id]/vinculos`    | GET    | Relacionamentos mae/filho                |
| `/api/protocolos/por-movimentacao` | GET    | Protocolos por tipo de movimentacao      |
| `/api/protocolos/estagnados`       | GET    | Protocolos estagnados (>365 dias)        |

#### Analytics

| Endpoint                       | Metodo | Descricao                           |
| ------------------------------ | ------ | ----------------------------------- |
| `/api/analytics/temporal`      | GET    | Fluxo temporal (entradas vs saidas) |
| `/api/analytics/distribuicao`  | GET    | Distribuicao por faixa de tempo     |
| `/api/analytics/por-assunto`   | GET    | Analise por assunto                 |
| `/api/analytics/por-projeto`   | GET    | Analise por projeto                 |
| `/api/analytics/fluxo-setores` | GET    | Sankey: fluxo entre setores         |
| `/api/analytics/heatmap`       | GET    | Heatmap (dia semana vs hora)        |
| `/api/analytics/comparativo`   | GET    | Comparativo ano a ano               |

#### Outros

| Endpoint                     | Metodo | Descricao                    |
| ---------------------------- | ------ | ---------------------------- |
| `/api/kpis`                  | GET    | KPIs principais do dashboard |
| `/api/setores`               | GET    | Lista de setores             |
| `/api/health`                | GET    | Health check                 |
| `/api/test-connection`       | GET    | Teste de conexao SQL Server  |
| `/api/admin/qualidade-dados` | GET    | Relatorio de qualidade       |

---

## 2. Componentes Principais

### 2.1 Componentes de Layout

| Componente      | Localizacao              | Responsabilidade                  |
| --------------- | ------------------------ | --------------------------------- |
| `Sidebar`       | `/components/dashboard/` | Navegacao lateral com links       |
| `Header`        | `/components/dashboard/` | Titulo, subtitulo e botao de tema |
| `CacheWarmer`   | `/components/dashboard/` | Pre-carrega cache em background   |
| `ThemeProvider` | `/components/providers/` | Sistema de temas (light/dark)     |
| `QueryProvider` | `/components/providers/` | Provedor React Query              |

### 2.2 Componentes de Filtros

| Componente          | Localizacao            | Responsabilidade               |
| ------------------- | ---------------------- | ------------------------------ |
| `ProtocoloFilters`  | `/components/filters/` | Container principal de filtros |
| `FilterRow`         | `/components/filters/` | Linha individual de filtro     |
| `useFilterState`    | `/components/filters/` | Hook de estado dos filtros     |
| `DateTimeIndicator` | `/components/filters/` | Indicador visual de filtro     |

**Filtros suportados:**

- Status (Em Andamento, Finalizado, Historico)
- Numero de Documento
- Numero de Convenio (numconv)
- Faixa de Tempo
- Setor Atual
- Assunto
- Data Inicio/Fim
- Dia da Semana / Hora
- Exclusao de Lote de Pagamento

### 2.3 Componentes de Tabelas

| Componente        | Localizacao           | Responsabilidade            |
| ----------------- | --------------------- | --------------------------- |
| `ProtocolosTable` | `/components/tables/` | Tabela paginada com sorting |
| `AssuntoTable`    | `/components/tables/` | Tabela agregada por assunto |
| `columns.tsx`     | `/components/tables/` | Definicao das colunas       |

### 2.4 Componentes de Graficos

| Componente               | Localizacao           | Biblioteca | Tipo    |
| ------------------------ | --------------------- | ---------- | ------- |
| `FluxoTemporalChart`     | `/components/charts/` | Recharts   | Area    |
| `ComparativoChart`       | `/components/charts/` | Nivo       | Bar     |
| `HeatmapChart`           | `/components/charts/` | Nivo       | Heatmap |
| `SetorSankeyChart`       | `/components/charts/` | Nivo       | Sankey  |
| `AssuntoBarChart`        | `/components/charts/` | Nivo       | Bar     |
| `ProjetoBarChart`        | `/components/charts/` | Nivo       | Bar     |
| `DistribuicaoFaixaChart` | `/components/charts/` | Nivo       | Pie     |
| `ChartContainer`         | `/components/charts/` | -          | Wrapper |

### 2.5 Componentes de Protocolo

| Componente               | Localizacao              | Responsabilidade          |
| ------------------------ | ------------------------ | ------------------------- |
| `ProtocoloTimeline`      | `/components/timeline/`  | Timeline de movimentacoes |
| `DadosEnriquecidos`      | `/components/protocolo/` | Dados adicionais          |
| `LancamentosFinanceiros` | `/components/protocolo/` | Movimentacoes financeiras |
| `ResumoTramitacao`       | `/components/protocolo/` | Resumo da tramitacao      |
| `VinculosProtocolo`      | `/components/protocolo/` | Relacionamentos mae/filho |

### 2.6 Componentes de KPIs

| Componente    | Localizacao              | Responsabilidade        |
| ------------- | ------------------------ | ----------------------- |
| `KPICards`    | `/components/dashboard/` | Grid com 6 KPIs         |
| `KPICard`     | `/components/dashboard/` | Card individual         |
| `StatusBadge` | `/components/dashboard/` | Badge com status visual |

**KPIs exibidos:**

1. Total em Andamento
2. Novos no Periodo
3. Media de Permanencia (min/max)
4. Em Dia (< 15 dias)
5. Urgentes (15-30 dias)
6. Criticos (> 30 dias)

### 2.7 Componentes UI (shadcn/ui)

```
button, card, table, dialog, select, input, label, badge,
alert, skeleton, tabs, tooltip, popover, dropdown-menu,
progress, separator, switch, command, checkbox, toast
```

---

## 3. Fluxo de Dados

### 3.1 Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js + React)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Paginas React                                                   │
│  ├── Dashboard (/)                                               │
│  ├── Listagem (/protocolos)                                      │
│  ├── Detalhe (/protocolos/[id])                                  │
│  └── Analises (/analises/*)                                      │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              React Query (TanStack Query)                   ││
│  │  ├── useProtocolos()      → /api/protocolos                 ││
│  │  ├── useCachedProtocolos() → /api/protocolos/cached         ││
│  │  ├── useKPIs()            → /api/kpis                       ││
│  │  ├── useAnalytics*()      → /api/analytics/*                ││
│  │  └── Cache: staleTime/gcTime configuraveis                  ││
│  └─────────────────────────────────────────────────────────────┘│
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/JSON
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Validacao Zod → Query Builder → Execucao SQL                   │
│                                                                  │
│  Cache em Memoria (protocolos-cache.ts)                         │
│  ├── 50.000 protocolos                                          │
│  ├── Refresh automatico: 5 minutos                              │
│  └── Filtro em memoria (instantaneo)                            │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ mssql driver
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SQL SERVER (banco SAGI - fade1)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tabelas principais:                                             │
│  ├── documento (protocolos)                                      │
│  ├── scd_movimentacao (movimentacoes)                           │
│  ├── setor (setores)                                            │
│  ├── projeto (projetos)                                         │
│  └── pessoa (pessoas)                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Fluxo: Listagem de Protocolos

```
Usuario acessa /protocolos
        │
        ▼
useCachedProtocolos({ page, pageSize, filters })
        │
        ▼ React Query
fetch('/api/protocolos/cached?...')
        │
        ▼ route.ts
initializeCache()  ←── Se primeira vez: carrega 50k do SQL
        │
        ▼
getCachedProtocolos(filters)  ←── Filtro em memoria
        │
        ▼
Response: {
  data: Protocolo[],
  pagination: { total, totalPages },
  cacheInfo: { lastUpdated, isStale }
}
        │
        ▼
ProtocolosTable renderiza
```

### 3.3 Fluxo: Dashboard KPIs

```
Usuario acessa /
        │
        ▼
KPICards({ periodo, codigoSetor })
        │
        ▼
useKPIs({ periodo: 'all', codigoSetor: 48 })
        │
        ▼ React Query (cache 5min)
fetch('/api/kpis?periodo=all&setor=48')
        │
        ▼ route.ts
Valida com Zod → buildKPIsQueryOptimized()
        │
        ▼
Query SQL com agregacoes
        │
        ▼
Response: {
  totalEmAndamento: 150,
  novosMesAtual: 42,
  mediaDiasFinanceiro: 12.5,
  emDiaMenos15Dias: 100,
  urgentes15a30Dias: 35,
  criticosMais30Dias: 15
}
        │
        ▼
KPICards renderiza 6 cards coloridos
```

### 3.4 Fluxo: Detalhe do Protocolo

```
Usuario acessa /protocolos/[id]
        │
        ▼
useProtocolo(id) + useProtocoloCompleto(id)
        │
        ▼ React Query (paralelo)
fetch(/api/protocolos/${id})
fetch(/api/protocolos/${id}/completo)
        │
        ▼
Queries SQL com JOINs
        │
        ▼
Response: {
  dadosBasicos: Protocolo,
  lancamentosFinanceiros: [],
  movimentacoes: [],
  relacionamentos: { filhos, pais }
}
        │
        ▼
Renderiza tabs com todas as informacoes
```

---

## 4. Estrategia de Cache

### 4.1 Cache React Query (Cliente)

| Tipo de Dado      | Categoria  | staleTime | gcTime |
| ----------------- | ---------- | --------- | ------ |
| KPIs              | REAL_TIME  | 5 min     | 10 min |
| Lista Protocolos  | STANDARD   | 2 min     | 5 min  |
| Detalhe Protocolo | REAL_TIME  | 5 min     | 10 min |
| Serie Temporal    | ANALYTICS  | 10 min    | 20 min |
| Heatmap           | HISTORICAL | 30 min    | 60 min |
| Comparativo       | HISTORICAL | 30 min    | 60 min |

### 4.2 Cache em Memoria (Servidor)

**Localizacao:** `/lib/cache/protocolos-cache.ts`

```
┌─────────────────────────────────────────────────┐
│         Cache em Memoria (Node.js)              │
├─────────────────────────────────────────────────┤
│ cache.data[]           → 50.000 protocolos      │
│ cache.lastUpdated      → timestamp              │
│ cache.isUpdating       → flag durante refresh   │
│ cache.contasCorrentes  → lista unica            │
│ cache.setores          → lista unica            │
│ cache.assuntos         → lista unica            │
├─────────────────────────────────────────────────┤
│ Refresh automatico: 5 minutos                   │
│ Primeira requisicao: aguarda carregamento       │
│ Requisicoes seguintes: instantaneas             │
└─────────────────────────────────────────────────┘
```

**CacheWarmer (ativa o cache):**

```typescript
// Renderizado no layout.tsx
export function CacheWarmer() {
  useCachedProtocolos({ page: 1, pageSize: 1 });
  return null;
}
```

---

## 5. Integracoes

### 5.1 SQL Server (banco SAGI)

**Configuracao:** `/lib/db.ts`

```typescript
const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE || "fade1",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
  },
};
```

**Variaveis de Ambiente:**

```env
DB_SERVER=192.168.x.x
DB_PORT=1433
DB_DATABASE=fade1
DB_USER=sagi
DB_PASSWORD=***
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### 5.2 Validacao com Zod

Todos os endpoints validam entrada com Zod:

```typescript
// Exemplo: filtros de protocolo
const protocoloFiltersSchema = z.object({
  status: z.enum(["Em Andamento", "Finalizado", "Historico"]).optional(),
  numeroDocumento: z.string().optional(),
  numconv: z.coerce.number().positive().optional(),
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().max(50000).default(20),
});
```

### 5.3 Tratamento de Erros

```typescript
// Middleware em todas as rotas
export const GET = withErrorHandling(async (request) => {
  // Logica da rota
});

// Retorno padronizado em caso de erro:
{
  success: false,
  error: 'Mensagem de erro',
  statusCode: 400,
  details?: []  // Erros de validacao Zod
}
```

### 5.4 Analytics (Vercel)

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

<Analytics />
<SpeedInsights />
```

---

## 6. Autenticacao e Seguranca

### 6.1 Status de Autenticacao

**A aplicacao NAO possui sistema de autenticacao implementado.**

- Sem login/logout
- Sem controle de acesso por usuario
- Sem middleware de autenticacao
- Sem protecao de rotas

**Recomendacao:** Implementar autenticacao antes de deploy em producao.

### 6.2 Medidas de Seguranca Implementadas

| Medida        | Implementacao              | Localizacao      |
| ------------- | -------------------------- | ---------------- |
| SQL Injection | Parametrizacao mssql + Zod | `/lib/db.ts`     |
| XSS           | Headers HTTP               | `next.config.ts` |
| Clickjacking  | X-Frame-Options: DENY      | `next.config.ts` |
| MIME Sniffing | X-Content-Type-Options     | `next.config.ts` |
| Referrer      | Referrer-Policy            | `next.config.ts` |

### 6.3 Headers de Seguranca

```typescript
// next.config.ts
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ]
  }]
}
```

---

## 7. Hooks Customizados

### 7.1 Hooks de Dados

| Hook                       | Cache  | Uso                 |
| -------------------------- | ------ | ------------------- |
| `useProtocolos()`          | 2 min  | Lista com query SQL |
| `useCachedProtocolos()`    | 1 min  | Lista do cache      |
| `useKPIs()`                | 5 min  | KPIs principais     |
| `useFluxoTemporal()`       | 10 min | Grafico temporal    |
| `useDistribuicaoFaixa()`   | 10 min | Distribuicao        |
| `useAnalyticsPorAssunto()` | 10 min | Por assunto         |
| `useAnalyticsPorProjeto()` | 10 min | Por projeto         |
| `useFluxoSetores()`        | 10 min | Sankey              |
| `useHeatmap()`             | 30 min | Heatmap             |
| `useComparativo()`         | 30 min | Comparativo         |
| `useSetores()`             | -      | Lista setores       |
| `useTimeline(id)`          | 2 min  | Timeline            |

### 7.2 Hooks de UI

| Hook               | Responsabilidade        |
| ------------------ | ----------------------- |
| `useFilterState()` | Estado dos filtros      |
| `usePreferences()` | Preferencias do usuario |
| `use-toast()`      | Notificacoes            |

---

## 8. Tipos Principais

### 8.1 Protocolo

```typescript
interface Protocolo {
  codprot: number;
  numeroDocumento: string;
  assunto: string | null;
  remetente: string | null;
  projeto: string | null;
  numconv: number | null;
  setorOrigem: string | null;
  setorDestinoAtual: string | null;
  dtEntrada: Date;
  dtUltimaMovimentacao: Date;
  statusProtocolo: StatusProtocolo;
  diasNoFinanceiro?: number;
  faixaTempo: string;
  statusVisual: "danger" | "warning" | "info" | "success";
}

type StatusProtocolo = "Em Andamento" | "Finalizado" | "Historico" | "Arquivado";
```

### 8.2 KPIs

```typescript
interface KPIs {
  totalEmAndamento: number;
  novosMesAtual: number;
  mediaDiasFinanceiro: number;
  minDiasFinanceiro: number | null;
  maxDiasFinanceiro: number | null;
  emDiaMenos15Dias: number;
  urgentes15a30Dias: number;
  criticosMais30Dias: number;
}
```

### 8.3 Respostas de API

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    totalPages: number;
    current: number;
    pageSize: number;
  };
}

interface CachedResponse<T> extends PaginatedResponse<T> {
  cacheInfo: {
    lastUpdated: string | null;
    isStale: boolean;
    totalCached: number;
  };
}
```

---

## 9. Performance e Otimizacoes

### 9.1 Lazy Loading

```typescript
const FluxoTemporalChart = dynamic(
  () => import('@/components/charts/FluxoTemporalChart'),
  {
    loading: () => <Skeleton className="h-[400px]" />,
    ssr: false
  }
);
```

### 9.2 Query Optimization

- Pool de conexoes (min: 2, max: 10)
- `COUNT(*) OVER()` para evitar 2 queries
- Indices estrategicos no SQL Server
- CTEs para queries complexas

### 9.3 Bundle Optimization

```bash
# Analise de bundle
npm run analyze
```

---

## 10. Proximos Passos Recomendados

1. **Autenticacao:** Implementar NextAuth.js
2. **Rate Limiting:** Protecao contra abuso
3. **Testes:** Expandir cobertura (Vitest)
4. **Monitoramento:** Integrar Sentry/DataDog
5. **Documentacao API:** Swagger/OpenAPI
6. **Admin Panel:** Gerenciamento de cache

---

_Documentacao gerada em: 12/01/2026_
_Versao: 0.1.0_
