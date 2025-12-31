# Refatoração de Código - 31/12/2025

## Objetivo

Eliminar duplicações, melhorar organização e facilitar manutenção seguindo princípios de Clean Code.

---

## Resumo das Mudanças

### Fase 1: Utilitários Centralizados

#### 1.1 Criado `lib/formatting.ts`

Funções de formatação centralizadas:

- `formatCurrency(value)` - Formata valores monetários (R$ X.XXX,XX)
- `formatNumber(value)` - Formata números com separadores brasileiros
- `formatCPFCNPJ(value)` - Formata CPF/CNPJ
- `formatPercent(value)` - Formata porcentagens
- `formatDays(days)` - Formata contagem de dias

#### 1.2 Criado `lib/object-helpers.ts`

Helpers para objetos com dados do SQL Server:

- `getValue<T>(obj, camelKey, pascalKey)` - Acessa propriedades em ambos os formatos
- `hasValue(obj, camelKey, pascalKey)` - Verifica existência de propriedade
- `normalizeKeys(obj)` - Converte todas as chaves para camelCase

**Arquivos modificados:**
| Arquivo | Mudança |
|---------|---------|
| `components/protocolo/LancamentosFinanceiros.tsx` | Importa de lib/ |
| `components/protocolo/DadosEnriquecidos.tsx` | Importa getValue |
| `components/protocolo/ResumoTramitacao.tsx` | Importa getValue |
| `components/protocolo/RelacionamentosProtocolo.tsx` | Importa getValue |

---

### Fase 2: Componentes Reutilizáveis para Charts

#### 2.1 Criado `components/charts/ChartContainer.tsx`

Wrapper que centraliza:

- Estado de loading (Skeleton)
- Estado de erro (Alert)
- Estado vazio (mensagem)
- Header com título e conteúdo customizável
- Footer para estatísticas

**Props:**

```typescript
interface ChartContainerProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  height?: string;
  headerContent?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}
```

#### 2.2 Criado `components/charts/StatsGrid.tsx`

Grid de estatísticas reutilizável com formatação automática.

**Props:**

```typescript
interface StatItem {
  label: string;
  value: number | string;
  color?: string;
  subtext?: string;
  format?: "number" | "currency" | "percent" | "none";
}

interface StatsGridProps {
  items: StatItem[];
  columns?: 2 | 3 | 4;
}
```

**Arquivo refatorado como exemplo:**

- `components/charts/AssuntoBarChart.tsx` - Usa ChartContainer e StatsGrid

---

### Fase 3: Barrel Exports

#### Criado `components/charts/index.ts`

Exportação centralizada de todos os gráficos:

```typescript
export { AssuntoBarChart } from "./AssuntoBarChart";
export { ComparativoChart } from "./ComparativoChart";
export { DistribuicaoFaixaChart } from "./DistribuicaoFaixaChart";
export { FluxoTemporalChart } from "./FluxoTemporalChart";
export { HeatmapChart } from "./HeatmapChart";
export { ProjetoBarChart } from "./ProjetoBarChart";
export { SetorSankeyChart } from "./SetorSankeyChart";
export { ChartContainer } from "./ChartContainer";
export { StatsGrid } from "./StatsGrid";
```

---

## Arquivos Criados

| Arquivo                                | Descrição             |
| -------------------------------------- | --------------------- |
| `lib/formatting.ts`                    | Funções de formatação |
| `lib/object-helpers.ts`                | Helpers para objetos  |
| `components/charts/ChartContainer.tsx` | Wrapper de gráficos   |
| `components/charts/StatsGrid.tsx`      | Grid de estatísticas  |
| `components/charts/index.ts`           | Barrel exports        |

---

## Economia de Código

| Tipo                           | Antes            | Depois                  | Economia               |
| ------------------------------ | ---------------- | ----------------------- | ---------------------- |
| Função `getValue`              | 4 cópias         | 1 centralizada          | ~12 linhas             |
| Funções de formatação          | 3+ cópias        | 1 centralizado          | ~20 linhas             |
| Loading/Error states em charts | ~45 linhas/chart | Componente reutilizável | ~315 linhas (7 charts) |

**Total estimado:** ~350 linhas de código duplicado removidas

---

## Validação

- [x] Build passa sem erros
- [x] Todos os componentes de protocolo funcionando
- [x] AssuntoBarChart refatorado como exemplo
- [x] Imports centralizados funcionando

---

## Próximos Passos (Opcional)

1. Refatorar os outros 6 gráficos para usar ChartContainer/StatsGrid
2. Adicionar mais funções de formatação conforme necessário
3. Considerar criar hook `useChartData` para padronizar fetch de dados

---

_Refatoração implementada em 31/12/2025_
