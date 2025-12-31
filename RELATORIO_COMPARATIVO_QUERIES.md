# Relatório Comparativo - Queries de Protocolos Setor 48

**Data:** 24 de novembro de 2025
**Setor:** 48 - Gerência de Finanças e Contabilidade
**Banco de Dados:** fade1 (SQL Server)

---

## 1. Resumo Executivo

Este relatório compara duas abordagens diferentes para consultar protocolos no Setor 48:

1. **Query Global**: Retorna TODOS os protocolos atualmente no setor (29,216 registros)
2. **Query por Data**: Retorna protocolos de documentos criados em data específica (12 registros)

Ambas as queries estão corretas, mas servem a propósitos diferentes.

---

## 2. Comparativo das Queries

### 2.1. Query Global - Todos os Protocolos no Setor

**Objetivo:** Visão completa de todos os protocolos em andamento no setor

```sql
SELECT
    COUNT(DISTINCT s.CodProt) AS total_protocolos_no_setor_48
FROM scd_movimentacao s
WHERE s.CodProt IS NOT NULL
  AND s.RegAtual = 1
  AND s.CodSetorDestino = 48
  AND s.Deletado IS NULL;
```

**Retorno:** 29,216 protocolos

**Características:**

- ✅ Visão global da carga de trabalho
- ✅ Útil para gestão e planejamento
- ✅ Query simples e rápida
- ✅ Não depende de filtros externos
- ⚠️ Pode incluir protocolos muito antigos
- ⚠️ Número alto dificulta análise individual

---

### 2.2. Query por Data - Protocolos de Documentos Específicos

**Objetivo:** Análise de protocolos por período de criação do documento

```sql
DECLARE @DataInicio DATE = '2025-11-24';
DECLARE @DataFim DATE = '2025-11-24';

SELECT
    d.Codigo AS CodDocumento,
    d.NumDoc,
    d.Assunto,
    d.Descricao,
    d.DataCad AS DataCriacao,
    s.CodProt,
    s.CodSetorDestino,
    se.Descr AS SetorAtual
FROM Documento d
INNER JOIN scd_movimentacao s ON (
    s.CodProt = d.Codigo
    AND s.RegAtual = 1
    AND s.CodSetorDestino = 48
    AND s.Deletado IS NULL
)
LEFT JOIN Setor se ON (se.Codigo = s.CodSetorDestino)
WHERE d.deletado IS NULL
  AND DATEADD(dd, 0, DATEDIFF(dd, 0, d.DataCad)) >= @DataInicio
  AND DATEADD(dd, 0, DATEDIFF(dd, 0, d.DataCad)) <= @DataFim
  AND d.assunto <> 'LOTE DE PAGAMENTOS'
  AND CONVERT(VARCHAR(MAX), d.Descricao) <> 'LOTE DE PAGAMENTO';
```

**Retorno:** 12 protocolos (para data 2025-11-24)

**Características:**

- ✅ Análise focada e direcionada
- ✅ Permite rastreamento por período
- ✅ Retorna dados detalhados dos documentos
- ✅ Filtra lotes de pagamento automaticamente
- ⚠️ Depende de período específico
- ⚠️ Query mais complexa (JOIN com múltiplas tabelas)
- ⚠️ Performance pode variar conforme período selecionado

---

## 3. Análise de Performance

### 3.1. Query Global

| Métrica              | Valor                               |
| -------------------- | ----------------------------------- |
| Tabelas Acessadas    | 1 (scd_movimentacao)                |
| JOINs                | 0                                   |
| Registros Escaneados | ~250,633 (total da tabela)          |
| Índices Necessários  | CodSetorDestino, RegAtual, Deletado |
| Tempo Estimado       | < 1 segundo                         |
| Uso de Memória       | Baixo                               |

**Recomendações de Índice:**

```sql
CREATE NONCLUSTERED INDEX IX_scd_movimentacao_setor_atual
ON scd_movimentacao (CodSetorDestino, RegAtual, Deletado)
INCLUDE (CodProt);
```

---

### 3.2. Query por Data

| Métrica              | Valor                                  |
| -------------------- | -------------------------------------- |
| Tabelas Acessadas    | 3 (Documento, scd_movimentacao, Setor) |
| JOINs                | 2 (1 INNER, 1 LEFT)                    |
| Registros Escaneados | Variável (depende do período)          |
| Índices Necessários  | DataCad, CodProt, CodSetorDestino      |
| Tempo Estimado       | 1-3 segundos                           |
| Uso de Memória       | Médio                                  |

**Recomendações de Índices:**

```sql
-- Índice na tabela Documento
CREATE NONCLUSTERED INDEX IX_Documento_DataCad
ON Documento (DataCad, deletado, assunto, Descricao)
INCLUDE (Codigo, NumDoc);

-- Índice na tabela scd_movimentacao
CREATE NONCLUSTERED INDEX IX_scd_movimentacao_protocolo_setor
ON scd_movimentacao (CodProt, RegAtual, CodSetorDestino, Deletado)
INCLUDE (data);
```

---

## 4. Casos de Uso

### 4.1. Quando Usar Query Global

**✅ Use quando precisar:**

1. **Dashboard de Gestão**
   - KPI: Total de protocolos em andamento
   - Visão de carga de trabalho do setor
   - Comparativo entre setores

2. **Relatórios Gerenciais**
   - Análise de volume total
   - Planejamento de recursos
   - Identificação de gargalos

3. **Alertas e Monitoramento**
   - Alertas quando volume ultrapassa limite
   - Monitoramento de SLA geral do setor

**Exemplo de Dashboard:**

```
╔════════════════════════════════════════╗
║     SETOR 48 - FINANÇAS                ║
║                                        ║
║  Protocolos em Andamento: 29,216      ║
║  Média Mensal: 2,435                   ║
║  Tendência: ↑ 5%                       ║
╚════════════════════════════════════════╝
```

---

### 4.2. Quando Usar Query por Data

**✅ Use quando precisar:**

1. **Análise Operacional**
   - Rastrear protocolos de um dia específico
   - Verificar documentos de período determinado
   - Acompanhamento de entrada diária

2. **Relatórios de Produtividade**
   - Quantos documentos de hoje estão no setor?
   - Análise de fluxo por período
   - Tempo médio de permanência por data de criação

3. **Auditoria e Compliance**
   - Rastreamento de documentos específicos
   - Análise de protocolos por período fiscal
   - Validação de processamento de demandas

**Exemplo de Relatório:**

```
╔════════════════════════════════════════╗
║   PROTOCOLOS DO DIA: 24/11/2025        ║
║                                        ║
║  Total Criados: 12                     ║
║  No Setor 48: 12 (100%)                ║
║  Status: Todos em andamento            ║
║                                        ║
║  Próxima Ação: Análise financeira      ║
╚════════════════════════════════════════╝
```

---

## 5. Recomendação para Aplicação

### 5.1. Arquitetura Recomendada: Abordagem Híbrida

**Implemente AMBAS as queries** com propósitos distintos:

```
┌─────────────────────────────────────────────┐
│           APLICAÇÃO WEB/DESKTOP             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  Dashboard   │      │  Relatórios     │ │
│  │   Geral      │      │  Operacionais   │ │
│  │              │      │                 │ │
│  │ Query Global │      │ Query por Data  │ │
│  │  (29,216)    │      │     (12)        │ │
│  └──────────────┘      └─────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 5.2. Implementação Sugerida

#### Módulo 1: Dashboard Executivo

```sql
-- KPI: Total de Protocolos Ativos
SELECT COUNT(DISTINCT CodProt) AS total_protocolos
FROM scd_movimentacao
WHERE codSetorDestino = 48
  AND RegAtual = 1
  AND Deletado IS NULL;
```

**Atualização:** Tempo real ou cache de 5 minutos

---

#### Módulo 2: Gestão Operacional

```sql
-- Filtro por Período (Data de Criação do Documento)
-- Permite ao usuário selecionar período
SELECT
    d.DataCad,
    d.NumDoc,
    d.Assunto,
    s.CodProt,
    DATEDIFF(DAY, s.data, GETDATE()) AS dias_no_setor
FROM Documento d
INNER JOIN scd_movimentacao s ON (
    s.CodProt = d.Codigo
    AND s.RegAtual = 1
    AND s.CodSetorDestino = 48
    AND s.Deletado IS NULL
)
WHERE d.deletado IS NULL
  AND d.DataCad BETWEEN @DataInicio AND @DataFim
ORDER BY d.DataCad DESC;
```

**Atualização:** Sob demanda (filtro do usuário)

---

#### Módulo 3: Análise de Tendências

```sql
-- Distribuição por Data de Criação (Últimos 30 dias)
SELECT
    CONVERT(DATE, d.DataCad) AS data_criacao,
    COUNT(DISTINCT s.CodProt) AS qtd_protocolos,
    AVG(DATEDIFF(DAY, s.data, GETDATE())) AS media_dias_setor
FROM Documento d
INNER JOIN scd_movimentacao s ON (
    s.CodProt = d.Codigo
    AND s.RegAtual = 1
    AND s.CodSetorDestino = 48
    AND s.Deletado IS NULL
)
WHERE d.deletado IS NULL
  AND d.DataCad >= DATEADD(DAY, -30, GETDATE())
GROUP BY CONVERT(DATE, d.DataCad)
ORDER BY data_criacao DESC;
```

**Atualização:** Diária (00:00h)

---

## 6. Análise de Custos e Benefícios

### 6.1. Query Global

| Aspecto                     | Avaliação  | Notas                          |
| --------------------------- | ---------- | ------------------------------ |
| **Performance**             | ⭐⭐⭐⭐⭐ | Muito rápida, uma única tabela |
| **Escalabilidade**          | ⭐⭐⭐⭐   | Cresce linearmente com volume  |
| **Utilidade Gestão**        | ⭐⭐⭐⭐⭐ | Essencial para visão macro     |
| **Utilidade Operacional**   | ⭐⭐       | Limitada, muitos dados         |
| **Complexidade Manutenção** | ⭐⭐⭐⭐⭐ | Muito simples                  |
| **Custo de Implementação**  | Baixo      | Query simples, índice único    |

**Pontuação Total:** 23/30

---

### 6.2. Query por Data

| Aspecto                     | Avaliação  | Notas                          |
| --------------------------- | ---------- | ------------------------------ |
| **Performance**             | ⭐⭐⭐⭐   | Boa, depende do período        |
| **Escalabilidade**          | ⭐⭐⭐⭐⭐ | Excelente com índices corretos |
| **Utilidade Gestão**        | ⭐⭐⭐     | Útil para análises específicas |
| **Utilidade Operacional**   | ⭐⭐⭐⭐⭐ | Ideal para trabalho diário     |
| **Complexidade Manutenção** | ⭐⭐⭐     | Moderada, múltiplas tabelas    |
| **Custo de Implementação**  | Médio      | Múltiplos índices, JOINs       |

**Pontuação Total:** 24/30

---

## 7. Cenários de Negócio

### Cenário 1: Gestão de Equipe

**Pergunta:** "Quantos protocolos temos para processar?"
**Query Ideal:** **Global**
**Motivo:** Visão completa da carga de trabalho

---

### Cenário 2: Acompanhamento Diário

**Pergunta:** "Quais documentos de hoje chegaram ao financeiro?"
**Query Ideal:** **Por Data**
**Motivo:** Foco em entrada recente, análise detalhada

---

### Cenário 3: Análise de SLA

**Pergunta:** "Quantos protocolos estão atrasados?"
**Query Ideal:** **Híbrida** (Global + filtro de dias)

```sql
SELECT COUNT(DISTINCT s.CodProt)
FROM scd_movimentacao s
WHERE s.codSetorDestino = 48
  AND s.RegAtual = 1
  AND s.Deletado IS NULL
  AND DATEDIFF(DAY, s.data, GETDATE()) > 30; -- Exemplo: SLA de 30 dias
```

---

### Cenário 4: Relatório Mensal

**Pergunta:** "Quais protocolos de novembro ainda estão abertos?"
**Query Ideal:** **Por Data**
**Motivo:** Análise de período específico

---

## 8. Recomendação Final

### 🎯 Melhor Abordagem: **IMPLEMENTAR AMBAS**

**Para a Aplicação Principal:**

1. **Tela Inicial / Dashboard:**
   - Use **Query Global** para mostrar volume total
   - Exibir KPIs gerais (total em andamento, média, tendências)
   - Cache: 5-10 minutos

2. **Tela de Consulta / Listagem:**
   - Use **Query por Data** com filtros configuráveis
   - Permitir ao usuário filtrar por:
     - Data de criação do documento
     - Período (hoje, esta semana, este mês)
     - Tipo de documento (com opção de excluir lotes)
   - Atualização sob demanda

3. **Relatórios Exportáveis:**
   - **Query por Data** para Excel/PDF
   - Incluir detalhes completos (Query 3 do arquivo QUERY_CORRETA_FINAL.sql)
   - Permitir agendamento com parâmetros salvos

---

## 9. Código de Implementação Sugerido

### 9.1. Procedure para Dashboard

```sql
CREATE PROCEDURE sp_Dashboard_Setor48
AS
BEGIN
    SET NOCOUNT ON;

    -- Total em andamento
    SELECT
        COUNT(DISTINCT CodProt) AS total_em_andamento
    FROM scd_movimentacao
    WHERE codSetorDestino = 48
      AND RegAtual = 1
      AND Deletado IS NULL;

    -- Entrada nos últimos 7 dias
    SELECT
        COUNT(DISTINCT s.CodProt) AS entrada_semanal
    FROM Documento d
    INNER JOIN scd_movimentacao s ON (
        s.CodProt = d.Codigo
        AND s.RegAtual = 1
        AND s.CodSetorDestino = 48
        AND s.Deletado IS NULL
    )
    WHERE d.deletado IS NULL
      AND d.DataCad >= DATEADD(DAY, -7, GETDATE());

    -- Média de permanência
    SELECT
        AVG(DATEDIFF(DAY, data, GETDATE())) AS media_dias
    FROM scd_movimentacao
    WHERE codSetorDestino = 48
      AND RegAtual = 1
      AND Deletado IS NULL;
END;
GO
```

---

### 9.2. Procedure para Consulta Operacional

```sql
CREATE PROCEDURE sp_Consulta_Protocolos_Setor48
    @DataInicio DATE,
    @DataFim DATE,
    @ExcluirLotes BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        d.Codigo AS CodDocumento,
        d.NumDoc,
        d.Assunto,
        d.Descricao,
        d.DataCad AS DataCriacao,
        s.CodProt,
        s.data AS DataEntradaSetor,
        DATEDIFF(DAY, s.data, GETDATE()) AS DiasNoSetor,
        se.Descr AS SetorAtual
    FROM Documento d
    INNER JOIN scd_movimentacao s ON (
        s.CodProt = d.Codigo
        AND s.RegAtual = 1
        AND s.CodSetorDestino = 48
        AND s.Deletado IS NULL
    )
    LEFT JOIN Setor se ON (se.Codigo = s.CodSetorDestino)
    WHERE d.deletado IS NULL
      AND d.DataCad >= @DataInicio
      AND d.DataCad <= @DataFim
      AND (@ExcluirLotes = 0 OR (
          d.assunto <> 'LOTE DE PAGAMENTOS'
          AND CONVERT(VARCHAR(MAX), d.Descricao) <> 'LOTE DE PAGAMENTO'
      ))
    ORDER BY d.DataCad DESC, s.data DESC;
END;
GO
```

---

### 9.3. Procedure para Análise de Tendências

```sql
CREATE PROCEDURE sp_Tendencia_Protocolos_Setor48
    @Dias INT = 30
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CONVERT(DATE, d.DataCad) AS data_criacao,
        COUNT(DISTINCT s.CodProt) AS qtd_protocolos,
        AVG(DATEDIFF(DAY, s.data, GETDATE())) AS media_dias_setor,
        MIN(s.data) AS primeira_entrada,
        MAX(s.data) AS ultima_entrada
    FROM Documento d
    INNER JOIN scd_movimentacao s ON (
        s.CodProt = d.Codigo
        AND s.RegAtual = 1
        AND s.CodSetorDestino = 48
        AND s.Deletado IS NULL
    )
    WHERE d.deletado IS NULL
      AND d.DataCad >= DATEADD(DAY, -@Dias, GETDATE())
    GROUP BY CONVERT(DATE, d.DataCad)
    ORDER BY data_criacao DESC;
END;
GO
```

---

## 10. Matriz de Decisão Rápida

| Se você precisa...       | Use                                 | Exemplo                          |
| ------------------------ | ----------------------------------- | -------------------------------- |
| KPI de carga de trabalho | Query Global                        | "29.216 protocolos ativos"       |
| Documentos de hoje       | Query por Data (dia atual)          | "12 documentos criados hoje"     |
| Documentos da semana     | Query por Data (7 dias)             | "85 documentos desta semana"     |
| Planejamento de recursos | Query Global                        | "Equipe precisa processar 29k"   |
| Auditoria de período     | Query por Data (período específico) | "Documentos de outubro/2025"     |
| Alerta de volume         | Query Global                        | "Limite de 30k atingido"         |
| Exportação para Excel    | Query por Data                      | "Relatório com detalhes"         |
| Gráfico de tendência     | Query por Data (agregada)           | "Entrada diária últimos 30 dias" |

---

## 11. Conclusão

### ✅ Queries Corretas Identificadas

Ambas as queries estão **corretas** e servem propósitos complementares:

1. **Query Global (29,216):** Visão completa do setor
2. **Query por Data (12):** Análise focada por período

### 🎯 Recomendação de Implementação

**Implementar AMBAS** em módulos diferentes da aplicação:

- **Dashboard:** Query Global
- **Consultas/Relatórios:** Query por Data
- **Análises:** Híbrido (combinar ambas conforme necessidade)

### 📊 Performance

Ambas têm boa performance quando otimizadas com índices corretos. A Query por Data é mais flexível para análises operacionais.

### 💡 Próximos Passos

1. Implementar as stored procedures sugeridas
2. Criar os índices recomendados
3. Desenvolver interface com filtros configuráveis
4. Testar performance em horário de pico
5. Documentar para equipe de desenvolvimento

---

**Documento preparado por:** Claude + MCP SQL Analyzer
**Versão:** 1.0
**Data:** 24/11/2025

---

## Anexo: Arquivos de Referência

- `QUERY_CORRETA_FINAL.sql` - Queries completas implementadas
- `teste_todos_filtros.sql` - Testes de validação
- `RESULTADO_INVESTIGACAO.md` - Histórico da análise
