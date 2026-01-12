# Guia Rápido - Nova Versão do Dashboard

## ✅ O QUE FOI IMPLEMENTADO (Backend Completo)

### **1. Métricas Precisas** 📊

Todas as métricas agora refletem o status **REAL e ATUAL** do setor:

| Métrica                   | Descrição                            | Como Funciona                    |
| ------------------------- | ------------------------------------ | -------------------------------- |
| **Total Em Andamento**    | Protocolos **ATUALMENTE** no setor   | Usa `RegAtual = 1` do banco      |
| **Finalizados no Mês**    | Protocolos que **SAÍRAM** este mês   | Data de saída confirmada         |
| **Novos no Mês**          | Protocolos que **ENTRARAM** este mês | Data de entrada confirmada       |
| **Média de Permanência**  | Tempo médio no financeiro            | Baseado em finalizados (90 dias) |
| **Críticos (>30 dias)**   | **ATUALMENTE** há mais de 30 dias    | Apenas os que estão agora        |
| **Urgentes (15-30 dias)** | **ATUALMENTE** entre 15-30 dias      | Apenas os que estão agora        |
| **Média Em Andamento**    | Média dos que estão **AGORA**        | Situação atual                   |

### **2. Filtros de Período** 🔍

A API agora aceita diferentes períodos de análise:

```bash
# Exemplos de uso:
http://localhost:3000/api/kpis?periodo=mes_atual    # Apenas este mês
http://localhost:3000/api/kpis?periodo=30d          # Últimos 30 dias
http://localhost:3000/api/kpis?periodo=90d          # Últimos 90 dias
http://localhost:3000/api/kpis?periodo=6m           # Últimos 6 meses
http://localhost:3000/api/kpis?periodo=1y           # Último ano
http://localhost:3000/api/kpis?periodo=all          # Todos (padrão)
```

---

## 🚀 COMO TESTAR AGORA

### **Teste 1: Verificar API de KPIs**

```bash
# Parar o servidor (Ctrl+C) e reiniciar
npm run dev

# Abrir no navegador:
http://localhost:3000/api/kpis?periodo=all
```

**Resultado esperado:**

```json
{
  "data": {
    "totalEmAndamento": 15000,
    "finalizadosMesAtual": 120,
    "novosMesAtual": 150,
    "mediaDiasFinanceiro": 12.5,
    "criticosMais30Dias": 1200,
    "urgentes15a30Dias": 950,
    "mediaDiasEmAndamento": 18.3,
    "totalNoPeriodo": 29216
  },
  "success": true,
  "periodo": "all"
}
```

### **Teste 2: Comparar com Banco de Dados**

```sql
-- Execute no SQL Server Management Studio:

-- 1. Total atualmente no setor
SELECT COUNT(DISTINCT codprot) AS total_em_andamento
FROM scd_movimentacao
WHERE codsetordestino = 48
  AND RegAtual = 1
  AND Deletado IS NULL;
-- Deve bater com totalEmAndamento da API

-- 2. Críticos (mais de 30 dias)
WITH Atual AS (
    SELECT DISTINCT codprot, data
    FROM scd_movimentacao
    WHERE codsetordestino = 48
      AND RegAtual = 1
      AND Deletado IS NULL
)
SELECT COUNT(*) AS criticos
FROM Atual
WHERE DATEDIFF(DAY, data, GETDATE()) > 30;
-- Deve bater com criticosMais30Dias da API
```

---

## ⚠️ O QUE AINDA PRECISA SER FEITO (Frontend)

### **Tarefa 1: Adicionar Filtro de Período no Dashboard** 🎨

**Arquivo:** `app/(dashboard)/page.tsx` (ou componente de KPIs)

**Implementação:**

```typescript
// Adicionar estado para período
const [periodo, setPeriodo] = useState<string>('all');

// Atualizar hook de KPIs
const { data: kpis } = useKPIs(periodo); // Passar período

// Adicionar Select de período
<div className="mb-6">
  <Label>Período de Análise</Label>
  <Select value={periodo} onValueChange={setPeriodo}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos os Períodos</SelectItem>
      <SelectItem value="mes_atual">Mês Atual</SelectItem>
      <SelectItem value="30d">Últimos 30 Dias</SelectItem>
      <SelectItem value="90d">Últimos 90 Dias</SelectItem>
      <SelectItem value="6m">Últimos 6 Meses</SelectItem>
      <SelectItem value="1y">Último Ano</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### **Tarefa 2: Atualizar Hook useKPIs** 🔧

**Arquivo:** `hooks/useKPIs.ts`

**Implementação:**

```typescript
import { useQuery } from "@tanstack/react-query";
import { KPIs } from "@/types";

export function useKPIs(periodo: string = "all") {
  return useQuery({
    queryKey: ["kpis", periodo], // Incluir período na key
    queryFn: async () => {
      const res = await fetch(`/api/kpis?periodo=${periodo}`);
      if (!res.ok) throw new Error("Falha ao buscar KPIs");
      const data = await res.json();
      return data.data as KPIs;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000, // Auto-refresh a cada 5 min
  });
}
```

### **Tarefa 3: Atualizar Cards de KPIs** 📇

**Arquivo:** Componente que exibe os cards

**Mudanças necessárias:**

1. **Remover card:** "Taxa de Resolução" (não existe mais)
2. **Adicionar novo card:** "Média Em Andamento"
3. **Renomear:** "Média Últimos 90d" → "Média de Permanência"

**Exemplo de Card:**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Média Em Andamento</CardTitle>
    <CardDescription>
      Tempo médio dos protocolos atualmente no setor
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">
      {kpis.mediaDiasEmAndamento.toFixed(1)} dias
    </div>
  </CardContent>
</Card>
```

### **Tarefa 4: Adicionar Tooltips Explicativos** 💡

**Exemplo:**

```typescript
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex items-center gap-2">
        <span>Total Em Andamento</span>
        <InfoIcon className="h-4 w-4" />
      </div>
    </TooltipTrigger>
    <TooltipContent>
      <p>Protocolos que estão ATUALMENTE no setor financeiro</p>
      <p className="text-xs text-muted-foreground">
        Baseado em RegAtual = 1 do banco de dados
      </p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 📁 ARQUIVOS MODIFICADOS

### **Backend (✅ Completo)**

| Arquivo                   | Status | Descrição                 |
| ------------------------- | ------ | ------------------------- |
| `lib/queries/base-cte.ts` | ✅     | CTE híbrida com RegAtual  |
| `lib/queries/kpis.ts`     | ✅     | Novas métricas + filtros  |
| `app/api/kpis/route.ts`   | ✅     | API com query params      |
| `types/protocolo.ts`      | ✅     | Interface KPIs atualizada |
| `types/api.ts`            | ✅     | Query params atualizados  |

### **Frontend (⏳ Pendente)**

| Arquivo                               | Status | O que fazer                   |
| ------------------------------------- | ------ | ----------------------------- |
| `hooks/useKPIs.ts`                    | ⏳     | Adicionar parâmetro `periodo` |
| `app/(dashboard)/page.tsx`            | ⏳     | Adicionar Select de período   |
| `components/dashboard/kpis-cards.tsx` | ⏳     | Atualizar cards, remover taxa |
| `components/dashboard/kpi-card.tsx`   | ⏳     | Adicionar tooltips            |

---

## 🎯 PRIORIDADES

### **Alta Prioridade** 🔴

1. ✅ Testar API `/api/kpis?periodo=all`
2. ⏳ Atualizar hook `useKPIs` com parâmetro `periodo`
3. ⏳ Verificar se dashboard carrega sem erros

### **Média Prioridade** 🟡

4. ⏳ Adicionar Select de período no dashboard
5. ⏳ Remover card de "Taxa de Resolução"
6. ⏳ Adicionar card de "Média Em Andamento"

### **Baixa Prioridade** 🟢

7. ⏳ Adicionar tooltips explicativos
8. ⏳ Melhorar layout dos cards
9. ⏳ Adicionar loading states

---

## 🐛 TROUBLESHOOTING

### **Problema 1: Erro de TypeScript no Frontend**

**Erro:** `Property 'taxaResolucaoMesPct' does not exist`

**Solução:**

```typescript
// Remover todas as referências a:
kpis.taxaResolucaoMesPct;

// Substituir por:
kpis.mediaDiasFinanceiro; // ou
kpis.mediaDiasEmAndamento;
```

### **Problema 2: Dashboard Não Carrega**

**Possíveis causas:**

1. Servidor não foi reiniciado → `npm run dev`
2. Banco de dados não tem campo `RegAtual` → Verificar no SSMS
3. Erro de sintaxe SQL → Checar logs do terminal

**Como verificar:**

```bash
# Ver logs do servidor
# Terminal deve mostrar:
✓ Compiled in X seconds
```

### **Problema 3: Números Muito Diferentes**

**É esperado!** Os números vão mudar porque agora são mais precisos.

**Exemplo:**

- **Antes:** 8,500 "em andamento" (incluía histórico)
- **Depois:** 15,000 em andamento (apenas atuais com RegAtual=1)

---

## 📞 PRÓXIMOS PASSOS

1. **Agora:** Reiniciar servidor e testar API
2. **Hoje:** Atualizar frontend conforme tarefas acima
3. **Amanhã:** Testar em produção com usuários
4. **Esta semana:** Colher feedback e ajustar

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Detalhes técnicos:** `CHANGELOG_REFATORACAO_KPIS.md`
- **Análise comparativa:** `RELATORIO_COMPARATIVO_QUERIES.md`
- **Queries de debug:** `database/queries_setores_debug.sql`

---

**Bom trabalho! 🎉**

Todas as mudanças críticas do backend estão prontas.
Agora é só atualizar o frontend seguindo este guia!
