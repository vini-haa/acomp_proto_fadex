# Arquitetura do Sistema

## Visão Geral

O Dashboard de Acompanhamento de Protocolos é uma aplicação Next.js 15 que utiliza o App Router para renderização híbrida (SSR/CSR) e API Routes para backend.

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Browser   │  │   Mobile    │  │   Tablet    │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 15 App                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 App Router (RSC)                     │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │    │
│  │  │ Dashboard │  │ Protocolos│  │ Análises  │       │    │
│  │  └───────────┘  └───────────┘  └───────────┘       │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   API Routes                         │    │
│  │  ┌───────┐  ┌───────┐  ┌───────────┐  ┌────────┐   │    │
│  │  │ /kpis │  │/proto │  │/analytics │  │/health │   │    │
│  │  └───────┘  └───────┘  └───────────┘  └────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQL Server (fade1)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Protocolos  │  │  Tramitacao  │  │   Projetos   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## Decisões de Arquitetura

### 1. Next.js App Router

**Escolha:** Next.js 15 com App Router

**Motivos:**

- Server Components por padrão (melhor performance)
- Streaming e Suspense nativo
- Layouts aninhados
- API Routes integradas
- Excelente DX com TypeScript

**Alternativas consideradas:**

- Pages Router: Descartado por ser legacy
- Remix: Menor ecossistema
- Vite + React: Sem SSR nativo

---

### 2. Gerenciamento de Estado

**Escolha:** TanStack Query (React Query v5)

**Motivos:**

- Cache automático e invalidação inteligente
- Deduplicação de requests
- Background refetching
- Retry automático
- DevTools excelentes

**Padrão de uso:**

```typescript
// hooks/useKPIs.ts
export function useKPIs({ periodo, codigoSetor }: KPIsParams) {
  return useQuery({
    queryKey: ["kpis", periodo, codigoSetor],
    queryFn: () => fetchKPIs({ periodo, setor: codigoSetor }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}
```

**Não usamos:**

- Redux: Overhead desnecessário para dados de servidor
- Zustand: Não precisamos de estado global complexo
- Context API: Apenas para temas e configurações simples

---

### 3. Validação de Dados

**Escolha:** Zod

**Motivos:**

- TypeScript-first
- Inferência de tipos automática
- Mensagens de erro detalhadas
- Validação runtime e compile-time

**Padrão de uso:**

```typescript
// lib/validation/protocolo.ts
export const KPIsFiltersSchema = z.object({
  periodo: z.enum(["30d", "90d", "all"]).default("all"),
  setor: z.coerce.number().int().nonnegative().default(48),
});

// API Route
const result = KPIsFiltersSchema.safeParse(params);
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}
```

---

### 4. Estilização

**Escolha:** Tailwind CSS + shadcn/ui

**Motivos:**

- Utility-first: Rápido desenvolvimento
- shadcn/ui: Componentes acessíveis e customizáveis
- Tree-shaking: Apenas CSS usado é incluído
- Design system consistente

**Estrutura de componentes:**

```
components/
├── ui/           # shadcn/ui (Button, Card, etc.)
├── dashboard/    # Componentes do dashboard
├── charts/       # Gráficos (Recharts/Nivo)
├── tables/       # Tabelas (TanStack Table)
└── protocolo/    # Componentes de protocolo
```

---

### 5. Gráficos

**Escolha:** Recharts + Nivo

**Recharts para:**

- Gráficos de barras
- Gráficos de linha
- Gráficos compostos

**Nivo para:**

- Sankey (fluxo entre setores)
- Heatmap
- Visualizações complexas

**Padrão de performance:**

```typescript
// Todos os gráficos são memoizados
export const ChartComponent = memo(function ChartComponent(props) {
  const chartData = useMemo(() => processData(props.data), [props.data]);
  const handleClick = useCallback(() => {...}, []);

  return <ChartContainer>...</ChartContainer>;
});
```

---

### 6. Conexão com Banco de Dados

**Escolha:** mssql com Connection Pool

**Motivos:**

- Driver oficial para SQL Server
- Suporte a Promises/async-await
- Connection pooling nativo
- Prepared statements (segurança)

**Configuração:**

```typescript
// lib/db.ts
const pool = new sql.ConnectionPool({
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
});
```

**Segurança:**

- Todas as queries são parametrizadas
- Nenhum SQL dinâmico com concatenação
- Validação Zod antes de qualquer query

---

### 7. Tratamento de Erros

**Escolha:** Error Boundaries + Classes de Erro Customizadas

**Estrutura:**

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError { ... }
export class ValidationError extends AppError { ... }
export class DatabaseError extends AppError { ... }
```

**Frontend:**

```
app/
├── error.tsx         # Error Boundary global
├── (dashboard)/
│   ├── error.tsx     # Error Boundary do dashboard
│   └── protocolos/
│       └── error.tsx # Error Boundary de protocolos
```

---

### 8. Performance

**Estratégias implementadas:**

1. **React.memo** em todos os componentes de gráfico
2. **useMemo** para dados processados
3. **useCallback** para handlers
4. **Lazy loading** de componentes pesados
5. **Skeleton loaders** para UX durante carregamento
6. **staleTime** no React Query para cache

**Métricas:**

- Re-renders reduzidos em ~60%
- First Contentful Paint < 1.5s
- Time to Interactive < 3s

---

## Estrutura de Diretórios

```
├── app/                      # App Router
│   ├── (dashboard)/          # Grupo de rotas (layout compartilhado)
│   │   ├── layout.tsx        # Layout com sidebar
│   │   ├── loading.tsx       # Loading skeleton
│   │   ├── error.tsx         # Error boundary
│   │   └── page.tsx          # Dashboard principal
│   ├── api/                  # API Routes
│   │   ├── health/           # Health check
│   │   ├── kpis/             # KPIs do dashboard
│   │   ├── protocolos/       # CRUD de protocolos
│   │   └── analytics/        # Dados analíticos
│   ├── error.tsx             # Error boundary global
│   └── layout.tsx            # Layout raiz
│
├── components/               # Componentes React
│   ├── ui/                   # shadcn/ui
│   ├── dashboard/            # KPIs, Header, Sidebar
│   ├── charts/               # Gráficos memoizados
│   ├── tables/               # Tabelas com filtros
│   └── protocolo/            # Timeline, Detalhes
│
├── hooks/                    # Custom hooks
│   ├── useKPIs.ts
│   ├── useProtocolos.ts
│   └── useAnalytics.ts
│
├── lib/                      # Utilitários
│   ├── db.ts                 # Conexão SQL Server
│   ├── errors.ts             # Classes de erro
│   ├── logger.ts             # Sistema de logging
│   ├── queries/              # Queries SQL
│   ├── schemas/              # Schemas Zod
│   └── validation/           # Validadores
│
├── types/                    # TypeScript types
│
└── public/                   # Arquivos estáticos
    └── version.json          # Info de versão (gerado)
```

---

## Fluxo de Dados

### 1. Requisição de KPIs

```
┌─────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────┐
│ Browser │────▶│ useKPIs hook │────▶│ /api/kpis  │────▶│ SQL Server│
└─────────┘     └──────────────┘     └────────────┘     └──────────┘
     │                 │                    │                 │
     │                 │                    │                 │
     │    ┌────────────┴────────────┐      │                 │
     │    │ TanStack Query          │      │                 │
     │    │ - Cache check           │      │                 │
     │    │ - Background refetch    │      │                 │
     │    └─────────────────────────┘      │                 │
     │                                     │                 │
     │                      ┌──────────────┴──────────────┐  │
     │                      │ API Route                   │  │
     │                      │ 1. Zod validation           │  │
     │                      │ 2. Query parametrizada      │  │
     │                      │ 3. Error handling           │  │
     │                      └─────────────────────────────┘  │
     │                                                       │
     │◀──────────────────── JSON Response ──────────────────│
```

### 2. Fluxo de Erro

```
Erro ocorre
    │
    ▼
┌───────────────────┐     ┌─────────────────┐
│ API Route         │────▶│ AppError thrown │
└───────────────────┘     └────────┬────────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │ JSON Response  │
                          │ status: 4xx/5xx│
                          └────────┬───────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │ useQuery       │
                          │ error state    │
                          └────────┬───────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │ Error Boundary │
                          │ ou Alert       │
                          └────────────────┘
```

---

## Padrões de Código

### Nomenclatura

| Tipo        | Convenção         | Exemplo             |
| ----------- | ----------------- | ------------------- |
| Componentes | PascalCase        | `KPICard.tsx`       |
| Hooks       | camelCase com use | `useKPIs.ts`        |
| Utilitários | camelCase         | `formatCurrency.ts` |
| Types       | PascalCase        | `Protocolo`         |
| Constantes  | SCREAMING_SNAKE   | `TODOS_SETORES`     |
| API Routes  | kebab-case        | `/api/por-assunto`  |

### Estrutura de Componente

```typescript
"use client"; // Se necessário

import { memo, useMemo, useCallback } from "react";
// imports externos
// imports internos (@/)

interface ComponentProps {
  // Props tipadas
}

export const Component = memo(function Component({ prop }: ComponentProps) {
  // 1. Hooks
  const memoizedValue = useMemo(() => ..., [deps]);
  const memoizedFn = useCallback(() => ..., [deps]);

  // 2. Early returns (loading, error)
  if (loading) return <Skeleton />;
  if (error) return <Alert />;

  // 3. Render
  return (
    <div>...</div>
  );
});
```

### Estrutura de API Route

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateParams } from "@/lib/validation/protocolo";

export async function GET(request: NextRequest) {
  try {
    // 1. Validação
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const validation = validateParams(Schema, params);

    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    // 2. Query
    const data = await queryDatabase(validation.data);

    // 3. Response
    return NextResponse.json(data);
  } catch (error) {
    // 4. Error handling
    logger.error("Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
```

---

## Segurança

### Implementado

- [x] Queries SQL parametrizadas (proteção contra SQL Injection)
- [x] Validação Zod em todas as APIs (proteção contra input malicioso)
- [x] Variáveis de ambiente para credenciais
- [x] Headers de segurança via Next.js config
- [x] Error messages genéricas para usuário (sem stack traces)

### Não implementado (fora do escopo atual)

- [ ] Autenticação (NextAuth.js)
- [ ] Rate limiting
- [ ] CORS restritivo (atualmente apenas local)
- [ ] CSP headers

---

## Monitoramento

### Health Check

```bash
GET /api/health
```

Retorna:

```json
{
  "status": "healthy",
  "timestamp": "2025-12-31T...",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "latencyMs": 45
  }
}
```

### Logging

```typescript
// lib/logger.ts
const logger = {
  info: (msg, data?) => console.log(`[INFO] ${msg}`, data),
  warn: (msg, data?) => console.warn(`[WARN] ${msg}`, data),
  error: (msg, data?) => console.error(`[ERROR] ${msg}`, data),
};
```

---

## Futuras Melhorias

### Curto Prazo

- [ ] Testes unitários com Vitest
- [ ] Testes E2E com Playwright
- [ ] CI/CD com GitHub Actions

### Médio Prazo

- [ ] Autenticação com NextAuth.js
- [ ] Cache Redis para queries pesadas
- [ ] WebSocket para atualizações em tempo real

### Longo Prazo

- [ ] PWA para acesso offline
- [ ] API GraphQL
- [ ] Migração para edge runtime

---

## Referências

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com)
- [Recharts](https://recharts.org)
- [Zod](https://zod.dev)
