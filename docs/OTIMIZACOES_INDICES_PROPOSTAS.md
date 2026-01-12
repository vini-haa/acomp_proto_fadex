# Otimizacoes de Indices Propostas

> Data: 2025-12-31
> Versao: 1.0
> Modo: SOMENTE LEITURA (analise)

---

## Resumo Executivo

Foram identificados **178 pares de indices duplicados** no banco fade1.
Estes indices tem as mesmas colunas-chave e podem ser candidatos a remocao.

### Impacto Estimado

| Metrica                       | Valor         |
| ----------------------------- | ------------- |
| Pares duplicados              | 178           |
| Indices candidatos a remocao  | ~178          |
| Economia potencial de storage | A calcular    |
| Melhoria em INSERT/UPDATE     | Significativa |

---

## 1. Indices Duplicados Identificados

### 1.1 Exemplo Critico: EventosDoc

```
Tabela: EventosDoc (399.876 registros)

IndEventosDoc1: CodProt    <- DUPLICADO
IndEventosDoc2: CodProt    <- DUPLICADO
PK__EventosD__...: Codigo  <- OK (PK)
```

**Recomendacao**: Remover `IndEventosDoc1` ou `IndEventosDoc2`.

### 1.2 Amostra dos Duplicados Encontrados

| Tabela              | Indice 1             | Indice 2                 | Colunas        |
| ------------------- | -------------------- | ------------------------ | -------------- |
| AGENDA              | PK**AGENDA**...      | INDAGENDA2               | CODIGO,DATA    |
| AGENDAMENTO         | PK**AGENDAMENTO**... | INDAG1                   | CODIGO,NUMCONV |
| AgenteCarga         | PK**AgenteCa**...    | iNDAgenteCarga           | Codigo         |
| Anuentes            | PK**Anuentes**...    | IndAnuentes              | Codigo         |
| Area                | PK**Area**...        | IndArea                  | Codigo         |
| ArquivoProtocolo    | PK**ArquivoP**...    | IndArquivoProtocolo      | Codigo         |
| ASSINANTES          | PK**ASSINANTES**...  | INDASS                   | CODIGO         |
| Atividades_Projetos | PK**PreProje**...    | indPreProjeto_Atividades | Codigo         |
| Atualizacoes        | PK**Atualiza**...    | IndAtualizacoes          | Codigo         |

### 1.3 Padrao Comum Identificado

Muitas tabelas possuem:

1. **Primary Key** com nome automatico (`PK__Tabela__HASH`)
2. **Indice adicional** com nome manual (`IndTabela`, `INDTABELA`, etc.)

Ambos apontam para as mesmas colunas, gerando duplicidade.

---

## 2. Analise de Risco

### 2.1 Risco BAIXO (Remocao Segura)

Indices que sao claramente duplicatas da PK:

```sql
-- Exemplo: Tabela ASSINANTES
-- PK__ASSINANTES__619B8048 em CODIGO (PK)
-- INDASS em CODIGO (duplicado)
DROP INDEX INDASS ON ASSINANTES;  -- Seguro remover
```

### 2.2 Risco MEDIO (Verificar INCLUDE)

Alguns indices podem ter INCLUDE columns diferentes:

```sql
-- Verificar se ha colunas incluidas diferentes
SELECT
    i.name,
    STUFF((
        SELECT ',' + c.name
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
        AND ic.is_included_column = 1
        ORDER BY ic.index_column_id
        FOR XML PATH('')
    ), 1, 1, '') AS IncludedColumns
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('NomeTabela');
```

### 2.3 Risco ALTO (NAO REMOVER)

- Indices usados em constraints
- Indices usados em hints em procedures
- Indices referenciados em views indexadas

---

## 3. Query para Identificar Todos os Duplicados

```sql
-- Query completa para identificar indices duplicados
SELECT
    t.name AS Tabela,
    i1.name AS Indice1,
    i2.name AS Indice2,
    STUFF((
        SELECT ',' + c.name
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i1.object_id AND ic.index_id = i1.index_id
        AND ic.is_included_column = 0
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
    ), 1, 1, '') AS ColunasChave
FROM sys.indexes i1
JOIN sys.indexes i2 ON i1.object_id = i2.object_id
    AND i1.index_id < i2.index_id
JOIN sys.tables t ON i1.object_id = t.object_id
WHERE i1.type > 0 AND i2.type > 0
AND STUFF((
    SELECT ',' + c.name
    FROM sys.index_columns ic
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE ic.object_id = i1.object_id AND ic.index_id = i1.index_id
    AND ic.is_included_column = 0
    ORDER BY ic.key_ordinal
    FOR XML PATH('')
), 1, 1, '') = STUFF((
    SELECT ',' + c.name
    FROM sys.index_columns ic
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE ic.object_id = i2.object_id AND ic.index_id = i2.index_id
    AND ic.is_included_column = 0
    ORDER BY ic.key_ordinal
    FOR XML PATH('')
), 1, 1, '')
ORDER BY t.name;
```

---

## 4. Plano de Acao Recomendado

### Fase 1: Analise Detalhada (1-2 dias)

1. Executar query acima para lista completa
2. Para cada par, verificar INCLUDE columns
3. Verificar estatisticas de uso (`sys.dm_db_index_usage_stats`)
4. Identificar indices referenciados em procedures

### Fase 2: Remocao em Ambiente de Teste (1 dia)

1. Script de DROP em ambiente de teste
2. Executar testes de regressao
3. Medir impacto em performance

### Fase 3: Remocao em Producao (Com cautela)

1. Remover em horario de baixo uso
2. Monitorar performance pos-remocao
3. Manter script de CREATE para rollback

---

## 5. Script de Remocao (Exemplo)

```sql
-- ATENCAO: Executar APENAS apos validacao completa
-- Backup: manter script de CREATE antes de remover

-- Exemplo: EventosDoc
-- DROP INDEX IndEventosDoc1 ON EventosDoc;  -- OU IndEventosDoc2

-- Gerar scripts automaticamente:
SELECT
    'DROP INDEX ' + i2.name + ' ON ' + t.name + ';' AS DropScript,
    'CREATE NONCLUSTERED INDEX ' + i2.name + ' ON ' + t.name + ' (' +
    STUFF((
        SELECT ',' + c.name
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i2.object_id AND ic.index_id = i2.index_id
        AND ic.is_included_column = 0
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
    ), 1, 1, '') + ');' AS CreateScript
FROM sys.indexes i1
JOIN sys.indexes i2 ON i1.object_id = i2.object_id
    AND i1.index_id < i2.index_id
JOIN sys.tables t ON i1.object_id = t.object_id
WHERE i1.type > 0 AND i2.type > 0
AND i1.is_primary_key = 1  -- Manter PK, remover duplicata
-- ... (adicionar condicao de colunas iguais)
```

---

## 6. Beneficios Esperados

| Beneficio               | Impacto                      |
| ----------------------- | ---------------------------- |
| Reducao de storage      | ~10-20% nos indices          |
| Melhoria em INSERT      | 5-15% mais rapido            |
| Melhoria em UPDATE      | 5-15% mais rapido            |
| Reducao de locks        | Menos contencao              |
| Manutencao simplificada | Menos objetos para gerenciar |

---

## 7. Arquivos Relacionados

| Arquivo                                    | Descricao          |
| ------------------------------------------ | ------------------ |
| `scripts/auditoria_indices_duplicados.py`  | Script de analise  |
| `logs/auditoria_indices_duplicados_*.json` | Dados brutos       |
| `logs/RELATORIO_AUDITORIA_INDICES_*.md`    | Relatorio anterior |

---

## 8. Proximos Passos

- [ ] Aprovar analise detalhada
- [ ] Executar em ambiente de teste
- [ ] Validar com equipe de desenvolvimento
- [ ] Agendar janela de manutencao
- [ ] Executar remocao com monitoramento

---

> **IMPORTANTE**: Nenhuma alteracao deve ser feita sem validacao da equipe.
> Este documento e apenas uma analise e recomendacao.

> **Modo de operacao**: SOMENTE LEITURA (SELECT)
> **Gerado por**: Engenharia de Dados - Claude Code
