# Melhorias nas Queries da Aplicacao de Acompanhamento de Protocolos

> Data: 2026-01-07
> Aplicacao: Protocolos_acomp
> Baseado na investigacao do banco fade1

---

## Resumo Executivo

Analise completa das queries SQL utilizadas pela aplicacao de acompanhamento de protocolos,
com propostas de melhorias para incluir:

1. **Informacoes de usuarios** (quem enviou/recebeu)
2. **Dados adicionais** identificados na investigacao
3. **Otimizacoes de performance**
4. **Novas metricas** possiveis

---

## 1. Dados de Usuario Descobertos

### Campos Disponiveis (Validados)

| Campo           | Tabela           | Descricao                         | Preenchimento |
| --------------- | ---------------- | --------------------------------- | ------------- |
| `codUsuario`    | documento        | Usuario que cadastrou o protocolo | 87,8%         |
| `remetente`     | documento        | Nome do remetente externo (texto) | 57,2%         |
| `Interessado`   | documento        | Pessoa interessada/beneficiario   | 39,8%         |
| `codUsuario`    | scd_movimentacao | Usuario que fez a movimentacao    | ~100%         |
| `CodUsuRec`     | scd_movimentacao | Usuario que recebeu no setor      | ~100%         |
| `dtRecebimento` | scd_movimentacao | Data/hora do recebimento          | ~100%         |
| `despachante`   | scd_movimentacao | Nome do despachante (texto)       | Parcial       |

### Tabela Usuario (Join)

```sql
-- Estrutura relevante
Usuario.Codigo     -- PK
Usuario.Nome       -- Nome completo
Usuario.Login      -- Login do sistema
Usuario.Email      -- Email
Usuario.CodSetor   -- Setor do usuario
```

---

## 2. Melhorias por Arquivo

### 2.1 movimentacoes.ts - ADICIONAR USUARIOS

**Arquivo:** `lib/queries/movimentacoes.ts`

**Problema Atual:** Nao mostra quem enviou/recebeu o protocolo em cada movimentacao.

**Melhoria Proposta:**

```typescript
// GET_MOVIMENTACOES_BY_PROTOCOLO - VERSAO MELHORADA
export const GET_MOVIMENTACOES_BY_PROTOCOLO = `
SELECT
    m.codigo AS idMovimentacao,
    m.codprot,
    m.data AS dataMovimentacao,
    FORMAT(m.data, 'dd/MM/yyyy HH:mm') AS dataFormatada,
    m.codsetororigem AS codSetorOrigem,
    m.codsetordestino AS codSetorDestino,
    origem.descr AS setorOrigem,
    destino.descr AS setorDestino,
    m.numdocumento AS numDocumento,
    m.RegAtual AS isAtual,
    m.obs AS observacao,

    -- NOVOS CAMPOS: USUARIO QUE ENVIOU
    m.codUsuario AS codUsuarioEnvio,
    u_env.Nome AS usuarioQueEnviou,
    u_env.Login AS loginUsuarioEnvio,

    -- NOVOS CAMPOS: USUARIO QUE RECEBEU
    m.CodUsuRec AS codUsuarioRecebeu,
    u_rec.Nome AS usuarioQueRecebeu,
    u_rec.Login AS loginUsuarioRecebeu,
    m.dtRecebimento AS dataRecebimento,
    FORMAT(m.dtRecebimento, 'dd/MM/yyyy HH:mm') AS dataRecebimentoFormatada,

    -- NOVO: Tempo ate recebimento (em minutos)
    DATEDIFF(MINUTE, m.data, m.dtRecebimento) AS minutosAteRecebimento,

    -- Situacao (codigo existente mantido)
    COALESCE(
        m.codSituacaoProt,
        CASE
            WHEN m.codSetorDestino IN (${SETORES.ARQUIVOS.join(",")}) THEN ${SITUACOES.ARQUIVADO}
            WHEN m.codSetorDestino = ${SETORES.JURIDICO} THEN ${SITUACOES.ENCAMINHADO_JURIDICO}
            WHEN m.codSetorDestino = ${SETORES.GERENCIA_PROJETOS} THEN ${SITUACOES.EM_ANALISE}
            ELSE ${SITUACOES.RECEBIDO}
        END
    ) AS codSituacaoReal,

    CASE WHEN m.codSituacaoProt IS NULL THEN 1 ELSE 0 END AS situacaoInferida

FROM scd_movimentacao m
    LEFT JOIN situacaoProtocolo s ON m.codSituacaoProt = s.codigo
    LEFT JOIN setor origem ON m.codsetororigem = origem.codigo
    LEFT JOIN setor destino ON m.codsetordestino = destino.codigo
    -- NOVOS JOINS: Usuarios
    LEFT JOIN Usuario u_env ON m.codUsuario = u_env.Codigo
    LEFT JOIN Usuario u_rec ON m.CodUsuRec = u_rec.Codigo
WHERE m.codprot = @codProtocolo
    AND (m.Deletado IS NULL OR m.Deletado = 0)
ORDER BY m.data DESC;
`;
```

### 2.2 protocolos.ts - ADICIONAR CADASTRADOR E INTERESSADO

**Arquivo:** `lib/queries/protocolos.ts`

**Melhoria em buildProtocolosListQuery:**

```typescript
// Adicionar ao SELECT:
    -- NOVOS CAMPOS: Quem cadastrou o protocolo
    d.codUsuario AS codUsuarioCadastro,
    u_cad.Nome AS usuarioCadastro,

    -- NOVOS CAMPOS: Interessado/Beneficiario
    d.Interessado AS interessado,

// Adicionar ao FROM:
    LEFT JOIN Usuario u_cad ON d.codUsuario = u_cad.Codigo
```

**Melhoria em GET_PROTOCOLO_BY_ID:**

```typescript
// Adicionar ao SELECT principal:
    -- Quem cadastrou o protocolo
    d.codUsuario AS codUsuarioCadastro,
    u_cad.Nome AS usuarioCadastro,
    u_cad.Login AS loginCadastro,

    -- Remetente externo
    d.remetente AS remetenteExterno,

    -- Interessado/Beneficiario
    d.Interessado AS interessado,

// Adicionar ao FROM:
    LEFT JOIN Usuario u_cad ON d.codUsuario = u_cad.Codigo
```

**Melhoria em GET_PROTOCOLO_TIMELINE:**

```typescript
// Adicionar ao SELECT:
    -- Quem movimentou
    u_env.Nome AS usuarioQueEnviou,

    -- Quem recebeu
    u_rec.Nome AS usuarioQueRecebeu,
    mo.dtRecebimento AS dataRecebimento,

// Adicionar aos JOINs:
    LEFT JOIN Usuario u_env ON mo.codUsuario = u_env.Codigo
    LEFT JOIN Usuario u_rec ON mo.CodUsuRec = u_rec.Codigo
```

### 2.3 base-cte.ts - ADICIONAR USUARIO CRIADOR

**Arquivo:** `lib/queries/base-cte.ts`

**Melhoria no CTE PrimeiraMovimentacao:**

```sql
PrimeiraMovimentacao AS (
    SELECT
        codprot,
        MIN(data) AS dt_primeira_mov,
        MIN(codsetororigem) AS setor_origem_inicial,
        -- NOVO: Usuario que criou (primeira movimentacao)
        (SELECT TOP 1 m2.codUsuario
         FROM scd_movimentacao m2
         WHERE m2.codprot = m.codprot AND m2.Deletado IS NULL
         ORDER BY m2.data) AS cod_usuario_criador
    FROM scd_movimentacao m
    WHERE Deletado IS NULL
    GROUP BY codprot
),
```

**Ou usar subquery correlacionada no SELECT final:**

```sql
-- Na vw_ProtocolosFinanceiro, adicionar:
(SELECT TOP 1 u.Nome
 FROM scd_movimentacao m2
 INNER JOIN Usuario u ON m2.codUsuario = u.Codigo
 WHERE m2.codprot = pm.codprot AND m2.Deletado IS NULL
 ORDER BY m2.data) AS usuario_criador,
```

---

## 3. Novas Queries Propostas

### 3.1 Ranking de Usuarios por Volume de Movimentacoes

```sql
-- TOP usuarios que mais movimentam protocolos
SELECT TOP 20
    u.Nome AS usuario,
    u.Login,
    s.DESCR AS setor,
    COUNT(DISTINCT m.codprot) AS protocolosMovimentados,
    COUNT(*) AS totalMovimentacoes,
    MIN(m.data) AS primeiraMovimentacao,
    MAX(m.data) AS ultimaMovimentacao
FROM scd_movimentacao m
    INNER JOIN Usuario u ON m.codUsuario = u.Codigo
    LEFT JOIN SETOR s ON u.CodSetor = s.CODIGO
WHERE (m.Deletado IS NULL OR m.Deletado = 0)
  AND m.data >= DATEADD(MONTH, -6, GETDATE())
GROUP BY u.Nome, u.Login, s.DESCR
ORDER BY totalMovimentacoes DESC;
```

### 3.2 Tempo Medio de Recebimento por Setor

```sql
-- Quanto tempo cada setor demora para "receber" o protocolo
SELECT
    s.DESCR AS setor,
    COUNT(*) AS totalMovimentacoes,
    AVG(DATEDIFF(MINUTE, m.data, m.dtRecebimento)) AS mediaMinutosRecebimento,
    MIN(DATEDIFF(MINUTE, m.data, m.dtRecebimento)) AS minMinutosRecebimento,
    MAX(DATEDIFF(MINUTE, m.data, m.dtRecebimento)) AS maxMinutosRecebimento
FROM scd_movimentacao m
    INNER JOIN SETOR s ON m.codsetordestino = s.CODIGO
WHERE (m.Deletado IS NULL OR m.Deletado = 0)
  AND m.dtRecebimento IS NOT NULL
  AND m.data >= DATEADD(MONTH, -6, GETDATE())
GROUP BY s.DESCR
ORDER BY mediaMinutosRecebimento DESC;
```

### 3.3 Protocolos Pendentes de Recebimento

```sql
-- Protocolos enviados mas ainda nao recebidos
SELECT
    d.numero AS protocolo,
    d.assunto,
    s_orig.DESCR AS setorOrigem,
    s_dest.DESCR AS setorDestino,
    u_env.Nome AS enviadoPor,
    m.data AS dataEnvio,
    DATEDIFF(HOUR, m.data, GETDATE()) AS horasPendente
FROM scd_movimentacao m
    INNER JOIN documento d ON m.codprot = d.codigo
    LEFT JOIN SETOR s_orig ON m.codsetororigem = s_orig.CODIGO
    LEFT JOIN SETOR s_dest ON m.codsetordestino = s_dest.CODIGO
    LEFT JOIN Usuario u_env ON m.codUsuario = u_env.Codigo
WHERE m.RegAtual = 1
  AND m.dtRecebimento IS NULL
  AND (m.Deletado IS NULL OR m.Deletado = 0)
ORDER BY m.data;
```

### 3.4 Analise de Remetentes Externos

```sql
-- Top remetentes externos (quem mais envia documentos)
SELECT TOP 30
    d.remetente AS remetenteExterno,
    COUNT(*) AS totalProtocolos,
    COUNT(DISTINCT d.numConv) AS projetosDistintos,
    MIN(d.data) AS primeiroProtocolo,
    MAX(d.data) AS ultimoProtocolo
FROM documento d
WHERE d.deletado IS NULL
  AND d.remetente IS NOT NULL
  AND d.remetente <> ''
GROUP BY d.remetente
ORDER BY totalProtocolos DESC;
```

### 3.5 Performance por Usuario (SLA)

```sql
-- Tempo medio que cada usuario leva para processar e encaminhar
WITH TempoUsuario AS (
    SELECT
        m1.codUsuario,
        m1.codprot,
        m1.data AS dataRecebimento,
        (SELECT TOP 1 m2.data
         FROM scd_movimentacao m2
         WHERE m2.codprot = m1.codprot
           AND m2.codsetororigem = m1.codsetordestino
           AND m2.data > m1.data
           AND m2.Deletado IS NULL
         ORDER BY m2.data) AS dataEncaminhamento
    FROM scd_movimentacao m1
    WHERE m1.dtRecebimento IS NOT NULL
      AND m1.Deletado IS NULL
)
SELECT
    u.Nome AS usuario,
    s.DESCR AS setor,
    COUNT(*) AS protocolosProcessados,
    AVG(DATEDIFF(HOUR, tu.dataRecebimento, tu.dataEncaminhamento)) AS mediaHorasProcessamento,
    SUM(CASE WHEN DATEDIFF(HOUR, tu.dataRecebimento, tu.dataEncaminhamento) <= 24 THEN 1 ELSE 0 END) AS processadosEm24h,
    SUM(CASE WHEN DATEDIFF(HOUR, tu.dataRecebimento, tu.dataEncaminhamento) > 72 THEN 1 ELSE 0 END) AS demorouMais72h
FROM TempoUsuario tu
    INNER JOIN Usuario u ON tu.codUsuario = u.Codigo
    LEFT JOIN SETOR s ON u.CodSetor = s.CODIGO
WHERE tu.dataEncaminhamento IS NOT NULL
GROUP BY u.Nome, s.DESCR
ORDER BY mediaHorasProcessamento;
```

---

## 4. Melhorias na Interface (Sugestoes)

### 4.1 Timeline do Protocolo

Adicionar na timeline:

- Nome do usuario que enviou
- Nome do usuario que recebeu
- Tempo ate recebimento
- Indicador visual de SLA (verde/amarelo/vermelho)

### 4.2 Listagem de Protocolos

Novos filtros possiveis:

- Por usuario que cadastrou
- Por remetente externo
- Por interessado
- Por usuario atual (quem esta com o protocolo)

### 4.3 Dashboard

Novos KPIs possiveis:

- Protocolos pendentes de recebimento
- Tempo medio de recebimento por setor
- Top usuarios por volume
- SLA de processamento por setor

---

## 5. Codigo Pronto para Implementacao

### 5.1 Atualizar movimentacoes.ts

```typescript
// Adicionar estes campos ao GET_MOVIMENTACOES_BY_PROTOCOLO

// No SELECT, ANTES de FROM, adicionar:
    // Usuario que enviou
    m.codUsuario AS codUsuarioEnvio,
    u_env.Nome AS usuarioQueEnviou,

    // Usuario que recebeu
    m.CodUsuRec AS codUsuarioRecebeu,
    u_rec.Nome AS usuarioQueRecebeu,
    m.dtRecebimento AS dataRecebimento,
    FORMAT(m.dtRecebimento, 'dd/MM/yyyy HH:mm') AS dataRecebimentoFormatada,

// Nos JOINs, adicionar:
    LEFT JOIN Usuario u_env ON m.codUsuario = u_env.Codigo
    LEFT JOIN Usuario u_rec ON m.CodUsuRec = u_rec.Codigo
```

### 5.2 Atualizar protocolos.ts

```typescript
// Em buildProtocolosListQuery, adicionar ao SELECT:
    d.codUsuario AS codUsuarioCadastro,
    u_cad.Nome AS usuarioCadastro,
    d.remetente AS remetenteExterno,
    d.Interessado AS interessado,

// Adicionar JOIN:
    LEFT JOIN Usuario u_cad ON d.codUsuario = u_cad.Codigo
```

### 5.3 Atualizar GET_PROTOCOLO_TIMELINE

```typescript
// No CTE MovimentacoesOrdenadas, adicionar:
    m.codUsuario,
    m.CodUsuRec,
    m.dtRecebimento,

// No SELECT final, adicionar:
    u_env.Nome AS usuarioQueEnviou,
    u_rec.Nome AS usuarioQueRecebeu,
    mo.dtRecebimento AS dataRecebimento,
    FORMAT(mo.dtRecebimento, 'dd/MM/yyyy HH:mm') AS dataRecebimentoFormatada,
    DATEDIFF(MINUTE, mo.dataMovimentacao, mo.dtRecebimento) AS minutosAteRecebimento,

// Nos JOINs, adicionar:
    LEFT JOIN Usuario u_env ON mo.codUsuario = u_env.Codigo
    LEFT JOIN Usuario u_rec ON mo.CodUsuRec = u_rec.Codigo
```

---

## 6. Impacto de Performance

### JOINs Adicionais

| Query                          | JOINs Atuais | JOINs Novos  | Impacto Estimado              |
| ------------------------------ | ------------ | ------------ | ----------------------------- |
| GET_MOVIMENTACOES_BY_PROTOCOLO | 4            | +2 (Usuario) | Baixo (filtro por codprot)    |
| buildProtocolosListQuery       | 6            | +1 (Usuario) | Baixo (Usuario tem indice PK) |
| GET_PROTOCOLO_TIMELINE         | 2            | +2 (Usuario) | Baixo (filtro por codprot)    |

### Indices Recomendados

A tabela Usuario ja possui indice na PK (Codigo), entao os JOINs serao eficientes.

```sql
-- Verificar se existe indice em scd_movimentacao.codUsuario
-- Se nao existir, criar:
CREATE INDEX IX_scd_movimentacao_codUsuario ON scd_movimentacao(codUsuario);
CREATE INDEX IX_scd_movimentacao_CodUsuRec ON scd_movimentacao(CodUsuRec);
```

---

## 7. Proximos Passos

1. [ ] Implementar campos de usuario em movimentacoes.ts
2. [ ] Implementar campos de usuario em protocolos.ts
3. [ ] Atualizar tipos TypeScript para incluir novos campos
4. [ ] Testar performance das queries modificadas
5. [ ] Atualizar interface para exibir novos dados
6. [ ] Criar novos filtros na listagem
7. [ ] Adicionar novas metricas ao dashboard

---

## Relacionado

- [INVESTIGACAO_REMETENTE_PROTOCOLO.sql](../sql_queries/INVESTIGACAO_REMETENTE_PROTOCOLO.sql)
- [TABELA_scd_movimentacao.md](../tabelas/TABELA_scd_movimentacao.md)
- [TABELA_documento.md](../tabelas/TABELA_documento.md)

---

> **Gerado em:** 2026-01-07
> **Modo:** Analise e Recomendacoes
