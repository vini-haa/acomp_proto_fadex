# Estrutura do Banco de Dados - SAGI (fade1)

## Visao Geral

O sistema utiliza o banco de dados **SQL Server** do sistema SAGI da FADEX. Este documento mapeia todas as tabelas utilizadas pelo dashboard de protocolos.

**Total de Tabelas**: 23 tabelas + 1 view personalizada

---

## 1. Tabelas Principais

### 1.1 documento

**Descricao**: Armazena informacoes basicas de protocolos/documentos

| Campo              | Tipo     | Descricao                              |
| ------------------ | -------- | -------------------------------------- |
| `codigo`           | INT      | PK - Identificador unico do protocolo  |
| `numero`           | VARCHAR  | Numero do protocolo (XXXX.XXXXXX.XXXX) |
| `numDoc`           | VARCHAR  | Numero do documento                    |
| `numeroControle`   | VARCHAR  | Numero de controle                     |
| `data`             | DATETIME | Data do documento                      |
| `dataCad`          | DATETIME | Data de cadastro                       |
| `horaCad`          | TIME     | Hora de cadastro                       |
| `assunto`          | VARCHAR  | Assunto/tipo do protocolo              |
| `descricao`        | TEXT     | Descricao do protocolo                 |
| `obs`              | TEXT     | Observacoes gerais                     |
| `notaFiscal`       | VARCHAR  | Referencia de nota fiscal              |
| `numOf`            | VARCHAR  | Numero de oficio                       |
| `remetente`        | VARCHAR  | Remetente/origem externa               |
| `despachante`      | VARCHAR  | Responsavel pelo despacho              |
| `interessado`      | VARCHAR  | Pessoa interessada                     |
| `destinatario`     | VARCHAR  | Destinatario                           |
| `numconv`          | INT      | FK → convenio.numconv                  |
| `codUsuario`       | INT      | FK → usuario.codigo                    |
| `codTipoDocumento` | INT      | FK → tipoDocumento.codigo              |
| `codInst`          | INT      | FK → instituicao.codigo                |
| `codUnidade`       | INT      | FK → unidades.codigo                   |
| `codDpto`          | INT      | FK → depto.codigo                      |
| `CodFornec`        | INT      | FK → pessoas.codigo                    |
| `CodAssunto`       | INT      | FK → sdoc_assunto.codigo               |
| `deletado`         | BIT      | Flag de exclusao logica                |

**Indices Recomendados**:

```sql
CREATE INDEX IX_documento_numero ON documento(numero);
CREATE INDEX IX_documento_assunto ON documento(assunto);
CREATE INDEX IX_documento_numconv ON documento(numconv);
CREATE INDEX IX_documento_dataCad ON documento(dataCad);
```

---

### 1.2 scd_movimentacao

**Descricao**: Controla o fluxo/tramitacao de protocolos entre setores. Esta e a tabela mais importante para o dashboard.

| Campo             | Tipo     | Descricao                         |
| ----------------- | -------- | --------------------------------- |
| `codigo`          | INT      | PK - Identificador unico          |
| `codprot`         | INT      | FK → documento.codigo             |
| `data`            | DATETIME | Data da movimentacao              |
| `hora`            | TIME     | Hora da movimentacao              |
| `codsetororigem`  | INT      | FK → setor.codigo (origem)        |
| `codsetordestino` | INT      | FK → setor.codigo (destino)       |
| `numdocumento`    | VARCHAR  | Numero do documento               |
| `codUsuario`      | INT      | FK → usuario.codigo (enviou)      |
| `CodUsuRec`       | INT      | FK → usuario.codigo (recebeu)     |
| `dtRecebimento`   | DATETIME | Data/hora do recebimento          |
| `codSituacaoProt` | INT      | FK → situacaoProtocolo.codigo     |
| `obs`             | TEXT     | Observacao da movimentacao        |
| `outros`          | TEXT     | Outras informacoes                |
| `RegAtual`        | BIT      | 1 = registro atual, 0 = historico |
| `PrimReg`         | BIT      | 1 = primeira movimentacao         |
| `DataCad`         | DATETIME | Data de cadastro                  |
| `codUsuOrigem`    | INT      | FK → usuario.codigo               |
| `CodDestinatario` | INT      | FK → usuario.codigo               |
| `despachante`     | VARCHAR  | Nome do despachante               |
| `Deletado`        | BIT      | Flag de exclusao logica           |

**Indices Recomendados**:

```sql
CREATE INDEX IX_scd_movimentacao_codprot_setor_regAtual
    ON scd_movimentacao(codprot, codsetordestino, RegAtual);
CREATE INDEX IX_scd_movimentacao_regAtual
    ON scd_movimentacao(RegAtual, codprot);
CREATE INDEX IX_scd_movimentacao_data
    ON scd_movimentacao(data);
CREATE INDEX IX_scd_movimentacao_codUsuario
    ON scd_movimentacao(codUsuario);
```

**Flags Importantes**:

- `RegAtual = 1`: Indica a posicao atual do protocolo
- `PrimReg = 1`: Indica a primeira entrada do protocolo no sistema

---

### 1.3 scd_movimentacaoItem

**Descricao**: Relacionamentos entre protocolos (pai/filho)

| Campo         | Tipo     | Descricao                     |
| ------------- | -------- | ----------------------------- |
| `codigo`      | INT      | PK                            |
| `CodProt`     | INT      | FK → documento.codigo (pai)   |
| `CodProtRel`  | INT      | FK → documento.codigo (filho) |
| `titulo`      | VARCHAR  | Titulo do item                |
| `observacao`  | TEXT     | Observacao 1                  |
| `observacao2` | TEXT     | Observacao 2                  |
| `Data`        | DATETIME | Data do item                  |
| `Valor`       | DECIMAL  | Valor associado               |
| `dataCad`     | DATETIME | Data de cadastro              |
| `ok`          | BIT      | Flag de confirmacao           |
| `okData`      | DATETIME | Data da confirmacao           |
| `codUsu`      | INT      | FK → usuario.codigo           |
| `deletado`    | BIT      | Flag de exclusao logica       |

**Indices Recomendados**:

```sql
CREATE INDEX IX_scd_movimentacaoItem_CodProt ON scd_movimentacaoItem(CodProt);
CREATE INDEX IX_scd_movimentacaoItem_CodProtRel ON scd_movimentacaoItem(CodProtRel);
```

---

### 1.4 setor

**Descricao**: Setores/departamentos da organizacao

| Campo    | Tipo    | Descricao          |
| -------- | ------- | ------------------ |
| `codigo` | INT     | PK                 |
| `descr`  | VARCHAR | Descricao do setor |

**Setores Principais**:

| Codigo             | Nome                 | Funcao                   |
| ------------------ | -------------------- | ------------------------ |
| 5                  | Juridico             | Analise juridica         |
| 40                 | Gerencia de Projetos | Porta de entrada         |
| 43                 | Contabilidade        | Analise financeira       |
| 44                 | Secretaria           | Porta de entrada         |
| 45                 | Administrativo       | Analise administrativa   |
| 48                 | Financeiro           | Processamento financeiro |
| 52                 | Arquivo              | Protocolo arquivado      |
| 56                 | Presidencia          | Nivel executivo          |
| 25, 51, 53, 54, 55 | Arquivos             | Destinos finais          |

---

### 1.5 convenio

**Descricao**: Projetos/convenios que recebem protocolos

| Campo      | Tipo    | Descricao               |
| ---------- | ------- | ----------------------- |
| `numconv`  | INT     | PK - Numero do convenio |
| `titulo`   | VARCHAR | Nome do projeto         |
| `deletado` | BIT     | Flag de exclusao logica |

---

### 1.6 situacaoProtocolo

**Descricao**: Possiveis status de uma movimentacao

| Campo       | Tipo    | Descricao           |
| ----------- | ------- | ------------------- |
| `codigo`    | INT     | PK                  |
| `descricao` | VARCHAR | Descricao do status |

**Situacoes Principais**:

| Codigo | Descricao               |
| ------ | ----------------------- |
| 1      | Arquivado               |
| 2      | Recebido                |
| 3      | Em Analise              |
| 5      | Encaminhado ao Juridico |

---

### 1.7 usuario

**Descricao**: Usuarios do sistema SAGI

| Campo    | Tipo    | Descricao         |
| -------- | ------- | ----------------- |
| `codigo` | INT     | PK                |
| `Nome`   | VARCHAR | Nome completo     |
| `Login`  | VARCHAR | Login para acesso |
| `descr`  | VARCHAR | Descricao         |

---

## 2. Tabelas Financeiras

### 2.1 FINANCEIRO

**Descricao**: Lancamentos financeiros vinculados aos protocolos

| Campo          | Tipo     | Descricao                |
| -------------- | -------- | ------------------------ |
| `CODIGO`       | INT      | PK                       |
| `DTLANCAMENTO` | DATETIME | Data do lancamento       |
| `DTDOCUMENTO`  | DATETIME | Data do documento        |
| `CodProt`      | INT      | FK → documento.codigo    |
| `PROTOCOLO`    | VARCHAR  | Numero do protocolo      |
| `NOTAFISCAL`   | VARCHAR  | Numero da nota fiscal    |
| `VALORBRUTO`   | DECIMAL  | Valor bruto              |
| `VALORLIQUIDO` | DECIMAL  | Valor liquido            |
| `TITULO`       | VARCHAR  | Descricao                |
| `OBSERVACAO`   | TEXT     | Observacao               |
| `CODFORNEC`    | INT      | FK → pessoas.codigo      |
| `NUMCONV`      | INT      | FK → convenio.numconv    |
| `CODRUBRICA`   | INT      | FK → conv_rubrica.codigo |
| `CODSUBHIST`   | INT      | FK → subhist.codigo      |
| `CANCELADO`    | BIT      | 1 = cancelado            |
| `LIBERADO`     | BIT      | 1 = liberado             |
| `DELETADO`     | BIT      | Flag de exclusao logica  |

---

### 2.2 conv_cc

**Descricao**: Contas correntes dos convenios

| Campo       | Tipo | Descricao             |
| ----------- | ---- | --------------------- |
| `numconv`   | INT  | FK → convenio.numconv |
| `codcc`     | INT  | FK → cc.codigo        |
| `principal` | BIT  | 1 = conta principal   |
| `deletado`  | BIT  | Flag de exclusao      |

---

### 2.3 cc

**Descricao**: Contas correntes (financeiras)

| Campo      | Tipo    | Descricao        |
| ---------- | ------- | ---------------- |
| `codigo`   | INT     | PK               |
| `cc`       | VARCHAR | Numero da conta  |
| `deletado` | BIT     | Flag de exclusao |

---

### 2.4 rubrica

**Descricao**: Rubricas orcamentarias

| Campo       | Tipo    | Descricao         |
| ----------- | ------- | ----------------- |
| `codigo`    | INT     | PK                |
| `rubrica`   | VARCHAR | Codigo da rubrica |
| `descricao` | VARCHAR | Descricao         |

---

### 2.5 conv_rubrica

**Descricao**: Rubricas por convenio

| Campo        | Tipo | Descricao           |
| ------------ | ---- | ------------------- |
| `codigo`     | INT  | PK                  |
| `codRubrica` | INT  | FK → rubrica.codigo |

---

### 2.6 subhist

**Descricao**: Subcategorias historicas

| Campo         | Tipo    | Descricao            |
| ------------- | ------- | -------------------- |
| `codigo`      | INT     | PK                   |
| `NomeSubHist` | VARCHAR | Nome da subcategoria |

---

## 3. Tabelas de Apoio

### 3.1 pessoas

**Descricao**: Cadastro de pessoas (fornecedores, solicitantes)

| Campo       | Tipo    | Descricao   |
| ----------- | ------- | ----------- |
| `codigo`    | INT     | PK          |
| `descricao` | VARCHAR | Nome        |
| `cgc_cpf`   | VARCHAR | CPF ou CNPJ |

---

### 3.2 tipoDocumento

**Descricao**: Tipos de documentos

| Campo       | Tipo    | Descricao |
| ----------- | ------- | --------- |
| `codigo`    | INT     | PK        |
| `descricao` | VARCHAR | Descricao |

---

### 3.3 instituicao

**Descricao**: Instituicoes relacionadas

| Campo       | Tipo    | Descricao |
| ----------- | ------- | --------- |
| `codigo`    | INT     | PK        |
| `descricao` | VARCHAR | Nome      |

---

### 3.4 unidades

**Descricao**: Unidades organizacionais

| Campo       | Tipo    | Descricao |
| ----------- | ------- | --------- |
| `codigo`    | INT     | PK        |
| `descricao` | VARCHAR | Nome      |

---

### 3.5 depto

**Descricao**: Departamentos

| Campo       | Tipo    | Descricao |
| ----------- | ------- | --------- |
| `codigo`    | INT     | PK        |
| `descricao` | VARCHAR | Nome      |

---

### 3.6 sdoc_assunto

**Descricao**: Assuntos categorizados

| Campo       | Tipo    | Descricao |
| ----------- | ------- | --------- |
| `codigo`    | INT     | PK        |
| `descricao` | VARCHAR | Descricao |

---

### 3.7 requisicaocompra

**Descricao**: Requisicoes de compra vinculadas

| Campo             | Tipo     | Descricao             |
| ----------------- | -------- | --------------------- |
| `codigo`          | INT      | PK                    |
| `numero`          | VARCHAR  | Numero da requisicao  |
| `codProt`         | INT      | FK → documento.codigo |
| `data`            | DATETIME | Data da requisicao    |
| `obs`             | TEXT     | Observacao            |
| `convenio_codigo` | INT      | FK → convenio.numconv |
| `pessoa_codigo`   | INT      | FK → pessoas.codigo   |
| `liberado`        | BIT      | Flag                  |
| `rejeitado`       | BIT      | Flag                  |
| `isNaoLiberada`   | BIT      | Flag                  |
| `valorLimite`     | DECIMAL  | Valor limite          |
| `deletado`        | BIT      | Flag de exclusao      |

---

## 4. Tabelas de Auditoria

### 4.1 documento_historico

**Descricao**: Auditoria de alteracoes em documentos

| Campo       | Tipo     | Descricao               |
| ----------- | -------- | ----------------------- |
| `codigo`    | INT      | PK                      |
| `CodRef`    | INT      | Referencia ao documento |
| `descricao` | TEXT     | Descricao da alteracao  |
| `DataCad`   | DATETIME | Data da alteracao       |
| `CodUsu`    | INT      | FK → usuario.codigo     |
| `TabelaRef` | VARCHAR  | Tabela de referencia    |
| `deletado`  | BIT      | Flag                    |

---

### 4.2 scd_movimentacao_historico

**Descricao**: Auditoria de alteracoes em movimentacoes

| Campo       | Tipo     | Descricao                 |
| ----------- | -------- | ------------------------- |
| `codigo`    | INT      | PK                        |
| `CodRef`    | INT      | Referencia a movimentacao |
| `descricao` | TEXT     | Descricao da alteracao    |
| `DataCad`   | DATETIME | Data da alteracao         |
| `CodUsu`    | INT      | FK → usuario.codigo       |
| `TabelaRef` | VARCHAR  | Tabela de referencia      |
| `deletado`  | BIT      | Flag                      |

---

### 4.3 DocsAnexados

**Descricao**: Arquivos anexados aos protocolos

| Campo       | Tipo     | Descricao               |
| ----------- | -------- | ----------------------- |
| `codigo`    | INT      | PK                      |
| `CodRef`    | INT      | Referencia ao protocolo |
| `NomeDoc`   | VARCHAR  | Nome do arquivo         |
| `descricao` | VARCHAR  | Descricao               |
| `Data`      | DATETIME | Data do anexo           |
| `Origem`    | VARCHAR  | Tabela de origem        |

---

## 5. Diagrama de Relacionamentos

```
┌─────────────────────────────────────────────────────────────────────┐
│                         documento (PK: codigo)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    scd_movimentacao                           │   │
│  │                    FK: codprot                                │   │
│  │                                                               │   │
│  │  ├─ setor (FK: codsetororigem)                               │   │
│  │  ├─ setor (FK: codsetordestino)                              │   │
│  │  ├─ usuario (FK: codUsuario) - quem enviou                   │   │
│  │  ├─ usuario (FK: CodUsuRec) - quem recebeu                   │   │
│  │  └─ situacaoProtocolo (FK: codSituacaoProt)                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                 scd_movimentacaoItem                          │   │
│  │                 FK: CodProt (pai)                             │   │
│  │                 FK: CodProtRel (filho) → documento            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      convenio                                 │   │
│  │                      FK: numconv                              │   │
│  │                                                               │   │
│  │  ├─ conv_cc (FK: numconv)                                    │   │
│  │  │   └─ cc (FK: codcc)                                       │   │
│  │  └─ conv_rubrica                                             │   │
│  │      └─ rubrica                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ├─ usuario (FK: codUsuario) - quem cadastrou                       │
│  ├─ tipoDocumento (FK: codTipoDocumento)                            │
│  ├─ instituicao (FK: codInst)                                       │
│  ├─ unidades (FK: codUnidade)                                       │
│  ├─ depto (FK: codDpto)                                             │
│  ├─ pessoas (FK: CodFornec)                                         │
│  └─ sdoc_assunto (FK: CodAssunto)                                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      FINANCEIRO                               │   │
│  │                      FK: CodProt                              │   │
│  │                                                               │   │
│  │  ├─ pessoas (FK: CODFORNEC)                                  │   │
│  │  ├─ convenio (FK: NUMCONV)                                   │   │
│  │  └─ subhist (FK: CODSUBHIST)                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   requisicaocompra                            │   │
│  │                   FK: codProt                                 │   │
│  │                                                               │   │
│  │  ├─ convenio (FK: convenio_codigo)                           │   │
│  │  └─ pessoas (FK: pessoa_codigo)                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. View Personalizada

### vw_ProtocolosFinanceiro

**Descricao**: View criada para o dashboard de financeiro

**Arquivo**: `/database/create_view_protocolos_financeiro.sql`

| Campo                    | Tipo     | Descricao                         |
| ------------------------ | -------- | --------------------------------- |
| `codprot`                | INT      | ID do protocolo                   |
| `numero_documento`       | VARCHAR  | Numero do documento               |
| `assunto`                | VARCHAR  | Assunto                           |
| `dt_entrada`             | DATETIME | Data entrada no financeiro        |
| `dt_saida`               | DATETIME | Data saida do financeiro          |
| `dt_ultima_movimentacao` | DATETIME | Ultima movimentacao               |
| `setor_origem_inicial`   | VARCHAR  | Setor de origem                   |
| `setor_destino_final`    | VARCHAR  | Setor final                       |
| `setor_atual`            | VARCHAR  | Setor atual                       |
| `setor_atual_codigo`     | INT      | Codigo do setor atual             |
| `status_protocolo`       | VARCHAR  | Em Andamento/Finalizado/Historico |
| `dias_no_financeiro`     | INT      | Dias em tramitacao                |
| `horas_no_financeiro`    | INT      | Horas em tramitacao               |
| `faixa_tempo`            | VARCHAR  | Categorizacao por tempo           |
| `ano_entrada`            | INT      | Ano de entrada                    |
| `mes_entrada`            | INT      | Mes de entrada                    |
| `semana_entrada`         | INT      | Semana de entrada                 |
| `periodo_entrada`        | VARCHAR  | Periodo (YYYY-MM)                 |
| `dia_semana_entrada`     | INT      | Dia da semana (1-7)               |
| `hora_entrada`           | INT      | Hora de entrada (0-23)            |

---

## 7. Problemas Conhecidos e Solucoes

### 7.1 Campo codSituacaoProt NULL

**Problema**: Muitos registros em `scd_movimentacao` tem `codSituacaoProt = NULL`

**Solucao**: Inferencia automatica baseada no setor destino

```sql
COALESCE(
    m.codSituacaoProt,
    CASE
        WHEN m.codSetorDestino IN (25,51,52,53,54,55) THEN 1  -- ARQUIVADO
        WHEN m.codSetorDestino = 5 THEN 5                     -- JURIDICO
        WHEN m.codSetorDestino = 40 THEN 3                    -- EM ANALISE
        ELSE 2                                                 -- RECEBIDO
    END
) AS codSituacaoProt
```

### 7.2 Exclusao Logica

Todas as tabelas principais usam `deletado = 0` para exclusao logica. Sempre incluir este filtro nas queries:

```sql
WHERE deletado = 0
```

---

## 8. Estatisticas do Banco

| Tabela           | Registros Estimados |
| ---------------- | ------------------- |
| documento        | ~175.000            |
| scd_movimentacao | ~250.000            |
| setor            | ~100                |
| convenio         | ~5.000              |
| usuario          | ~500                |
| FINANCEIRO       | ~50.000             |

---

## 9. Indices SQL Recomendados

Arquivo completo em: `/database/indices-recomendados.sql`

```sql
-- Movimentacoes
CREATE INDEX IX_scd_movimentacao_codprot_setor_regAtual
    ON scd_movimentacao(codprot, codsetordestino, RegAtual);

CREATE INDEX IX_scd_movimentacao_regAtual
    ON scd_movimentacao(RegAtual, codprot);

CREATE INDEX IX_scd_movimentacao_data
    ON scd_movimentacao(data);

-- Relacionamentos
CREATE INDEX IX_scd_movimentacaoItem_CodProt
    ON scd_movimentacaoItem(CodProt);

CREATE INDEX IX_scd_movimentacaoItem_CodProtRel
    ON scd_movimentacaoItem(CodProtRel);

-- Documentos
CREATE INDEX IX_documento_numero
    ON documento(numero);

CREATE INDEX IX_documento_assunto
    ON documento(assunto);

CREATE INDEX IX_documento_numconv
    ON documento(numconv);

-- Financeiro
CREATE INDEX IX_FINANCEIRO_CodProt
    ON FINANCEIRO(CodProt);
```

---

_Documentacao gerada em: 12/01/2026_
_Banco: SQL Server - SAGI (fade1)_
