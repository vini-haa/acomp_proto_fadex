# Pendencias de Analise de Protocolos

> Data: 2025-12-31
> Status: EM ANDAMENTO
> Modo: SOMENTE LEITURA (SELECT)

---

## Resumo

Este documento lista as analises pendentes identificadas durante a documentacao do modulo de Protocolos.

---

## 1. Pendencias de Alta Prioridade

### 1.1 Campo obs em scd_movimentacao

**Objetivo**: Extrair referencias a outros protocolos do campo `obs` (observacoes).

**Contexto**:

- 4.665 registros (1,88%) possuem observacoes preenchidas
- Algumas observacoes contem referencias a outros protocolos

**Query Base**:

```sql
SELECT
    d.Numero AS Protocolo,
    m.obs,
    m.data
FROM scd_movimentacao m
JOIN documento d ON d.Codigo = m.CodProt
WHERE m.obs IS NOT NULL
AND LEN(m.obs) > 10
AND (m.Deletado IS NULL OR m.Deletado = 0)
ORDER BY m.data DESC;
```

**Padroes a Identificar**:

- Referencias a outros protocolos (formato XXXX.XXXXXX.XXXX)
- Mencoes a pagamento
- Mencoes a devolucao/cancelamento
- Mencoes a arquivamento

---

### 1.2 Relacionamentos MAE/FILHO de EventosDoc

**Objetivo**: Extrair e documentar os 1.233 relacionamentos pai/filho identificados.

**Contexto**:

- Padrao: "ORIGINADO A PARTIR DO PROCESSO INICIAL XXXX.XXXXXX.XXXX"
- 100% dos protocolos MAE existem na tabela documento
- Alguns registros mostram self-references (mesmo protocolo)

**Query Base**:

```sql
SELECT
    d_filho.Numero AS ProtocoloFilho,
    d_filho.Assunto AS AssuntoFilho,
    SUBSTRING(
        e.Descricao,
        PATINDEX('%PROCESSO INICIAL [0-9][0-9][0-9][0-9].[0-9][0-9][0-9][0-9][0-9][0-9].[0-9][0-9][0-9][0-9]%', e.Descricao) + 17,
        16
    ) AS ProtocoloMAE
FROM EventosDoc e
JOIN documento d_filho ON d_filho.Codigo = e.CodProt
WHERE e.Descricao LIKE '%ORIGINADO A PARTIR DO PROCESSO INICIAL%'
AND (e.Deletado IS NULL OR e.Deletado = 0)
AND (d_filho.deletado IS NULL OR d_filho.deletado = 0);
```

**Entregaveis**:

- [ ] Lista completa de relacionamentos MAE/FILHO
- [ ] Validacao de integridade (MAE existe?)
- [ ] Identificar self-references incorretas
- [ ] Documentar arvore de relacionamentos

---

## 2. Pendencias de Media Prioridade

### 2.1 Views vw_protocolo e vw_ProtocolosFinanceiro

**Objetivo**: Analisar e documentar as views existentes.

**Contexto**:

- `vw_protocolo`: ~1.048 registros (filtrada?)
- `vw_ProtocolosFinanceiro`: ~47.009 registros

**Query Base**:

```sql
-- Estrutura da view
SELECT
    OBJECT_DEFINITION(OBJECT_ID('vw_protocolo')) AS DefinicaoView;

-- Contagem
SELECT COUNT(*) FROM vw_protocolo;
SELECT COUNT(*) FROM vw_ProtocolosFinanceiro;
```

**Entregaveis**:

- [ ] Documentar campos das views
- [ ] Identificar filtros aplicados
- [ ] Verificar se sao usadas pela aplicacao
- [ ] Comparar com tabela documento

---

### 2.2 Tipos de Evento (EventosDoc.tipo)

**Objetivo**: Documentar o significado dos valores do campo `tipo`.

**Contexto**:
| Tipo | Quantidade |
|------|------------|
| NULL | 365.421 |
| 1 | 34.228 |
| -1 | 222 |
| 0 | 5 |

**Query Base**:

```sql
SELECT
    tipo,
    COUNT(*) as Qtd,
    MIN(Descricao) as ExemploDescricao
FROM EventosDoc
WHERE (Deletado IS NULL OR Deletado = 0)
GROUP BY tipo
ORDER BY COUNT(*) DESC;
```

**Entregaveis**:

- [ ] Identificar significado de cada tipo
- [ ] Correlacionar com acoes do sistema
- [ ] Documentar no TABELA_EventosDoc.md

---

## 3. Pendencias de Baixa Prioridade

### 3.1 Setores Desabilitados com Protocolos

**Objetivo**: Listar protocolos parados em setores desabilitados.

**Query Base**:

```sql
SELECT
    s.DESCR AS SetorDesabilitado,
    COUNT(DISTINCT m.CodProt) AS Protocolos
FROM scd_movimentacao m
JOIN SETOR s ON s.CODIGO = m.codSetorDestino
WHERE s.DESCR LIKE 'DESABILITADO%'
AND (m.Deletado IS NULL OR m.Deletado = 0)
GROUP BY s.DESCR
ORDER BY COUNT(DISTINCT m.CodProt) DESC;
```

---

### 3.2 Protocolos com Datas Anomalas

**Objetivo**: Corrigir ou documentar os 89 protocolos com datas invalidas.

**Query Base**:

```sql
SELECT Numero, data, Assunto
FROM documento
WHERE (YEAR(data) > 2030 OR YEAR(data) < 1990)
AND (deletado IS NULL OR deletado = 0);
```

---

## 4. Queries Prontas para Execucao

Quando a conexao com o banco estiver disponivel, executar:

```sql
-- 1. Padroes no campo obs
SELECT
    'Referencias a protocolo' as Padrao,
    COUNT(*) as Quantidade
FROM scd_movimentacao
WHERE obs LIKE '%[0-9][0-9][0-9][0-9].[0-9][0-9][0-9][0-9][0-9][0-9].[0-9][0-9][0-9][0-9]%'
AND (Deletado IS NULL OR Deletado = 0)
UNION ALL
SELECT 'Mencao a pagamento', COUNT(*)
FROM scd_movimentacao WHERE obs LIKE '%pagamento%' AND (Deletado IS NULL OR Deletado = 0)
UNION ALL
SELECT 'Mencao a devolucao', COUNT(*)
FROM scd_movimentacao WHERE obs LIKE '%devol%' AND (Deletado IS NULL OR Deletado = 0)
UNION ALL
SELECT 'Mencao a cancelamento', COUNT(*)
FROM scd_movimentacao WHERE obs LIKE '%cancel%' AND (Deletado IS NULL OR Deletado = 0);

-- 2. Relacionamentos MAE/FILHO validos
WITH Relacionamentos AS (
    SELECT
        d_filho.Numero AS Filho,
        SUBSTRING(e.Descricao,
            PATINDEX('%PROCESSO INICIAL [0-9][0-9][0-9][0-9].[0-9][0-9][0-9][0-9][0-9][0-9].[0-9][0-9][0-9][0-9]%', e.Descricao) + 17,
            16) AS Mae
    FROM EventosDoc e
    JOIN documento d_filho ON d_filho.Codigo = e.CodProt
    WHERE e.Descricao LIKE '%ORIGINADO A PARTIR DO PROCESSO INICIAL%'
    AND (e.Deletado IS NULL OR e.Deletado = 0)
    AND (d_filho.deletado IS NULL OR d_filho.deletado = 0)
)
SELECT Filho, Mae
FROM Relacionamentos
WHERE Filho <> Mae  -- Excluir self-references
ORDER BY Filho;

-- 3. Tipos de evento com exemplos
SELECT TOP 10
    tipo,
    Descricao
FROM EventosDoc
WHERE tipo = 1
AND (Deletado IS NULL OR Deletado = 0);
```

---

## 5. Proximos Passos

1. **Quando conexao disponivel**: Executar queries acima
2. **Criar documentacao**: Atualizar arquivos .md com resultados
3. **Validar integridade**: Verificar consistencia dos dados
4. **Atualizar CHANGELOG**: Registrar progresso

---

> **Modo de operacao**: SOMENTE LEITURA (SELECT)
> **Gerado por**: Engenharia de Dados - Claude Code
