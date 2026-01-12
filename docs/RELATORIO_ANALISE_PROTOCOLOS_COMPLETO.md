# Relatorio Completo de Analise de Protocolos

> Data: 2025-12-31
> Versao: 1.0
> Modo: SOMENTE LEITURA (SELECT)

---

## Resumo Executivo

Este relatorio consolida a analise completa do modulo de Protocolos do sistema SAGI.

### Metricas Principais

| Metrica                          | Valor           |
| -------------------------------- | --------------- |
| Total de protocolos ativos       | 175.635         |
| Total de movimentacoes           | 248.323         |
| Media de movimentacoes/protocolo | 1,41            |
| Protocolos sem movimentacao      | 52.253 (29,75%) |
| Protocolos estagnados (>1 ano)   | 65.102          |
| Protocolos com data anomala      | 89              |

---

## 1. Distribuicao de Movimentacoes

### Por Quantidade de Movimentacoes

| Faixa                | Quantidade | Percentual |
| -------------------- | ---------- | ---------- |
| 0 (sem movimentacao) | 52.253     | 29,75%     |
| 1 movimentacao       | 36.723     | 20,91%     |
| 2-5 movimentacoes    | 85.271     | 48,55%     |
| 6-10 movimentacoes   | 1.133      | 0,65%      |
| 11-20 movimentacoes  | 180        | 0,10%      |
| 21-50 movimentacoes  | 75         | 0,04%      |

### Observacao

Quase **50%** dos protocolos tem entre 2-5 movimentacoes, o que representa o fluxo tipico:

1. Entrada (Recepcao/Secretaria)
2. Analise (Gerencia de Projetos ou Financeiro)
3. Arquivamento

---

## 2. Situacoes de Protocolo

| Situacao        | Quantidade | Percentual |
| --------------- | ---------- | ---------- |
| NULL/Indefinido | 115.987    | **94,01%** |
| EM ANALISE      | 7.318      | 5,93%      |
| CANCELADO       | 45         | 0,04%      |
| APROVADO        | 14         | 0,01%      |
| Outras          | 18         | <0,01%     |

### ALERTA

**94% dos protocolos tem situacao NULL/Indefinida!**

Isso indica que o campo `codSituacaoProt` em `scd_movimentacao` nao esta sendo preenchido adequadamente pelo sistema.

---

## 3. Distribuicao por Setor Atual

O setor atual e obtido via **ultima movimentacao** (`scd_movimentacao.codSetorDestino`).

### TOP 10 Setores

| Setor                                  | Protocolos |
| -------------------------------------- | ---------- |
| GERENCIA DE FINANCAS E CONTABILIDADE   | 21.827     |
| DESABILITADO GERENCIA DE ADMINISTRACAO | 18.946     |
| ARQUIVO                                | 17.255     |
| DESABILITADO GERENCIA ADM E FINANCEIRA | 11.262     |
| GERENCIA DE PROJETOS                   | 10.653     |
| ARQUIVO FINANCEIRO                     | 9.814      |
| ARQUIVO GERENCIA DE PROJETOS           | 9.196      |
| DESABILITADO GERENCIA DE PROJETOS      | 5.554      |
| DESABILITADO COORD RH                  | 5.029      |
| DESABILITADO COORD ADM PROJ CONVENIOS  | 4.078      |

### ALERTA: Setores Desabilitados

**4 dos TOP 10 setores sao DESABILITADOS!**

Isso indica que protocolos antigos ainda estao "parados" em setores que ja nao existem mais.

---

## 4. Fluxos de Movimentacao Mais Comuns (2024-2025)

| Origem               | Destino                      | Quantidade |
| -------------------- | ---------------------------- | ---------- |
| GERENCIA DE PROJETOS | GERENCIA DE FINANCAS         | 32.673     |
| SECRETARIA           | GERENCIA DE PROJETOS         | 24.520     |
| NULL (entrada)       | GERENCIA DE PROJETOS         | 20.713     |
| GERENCIA DE FINANCAS | ARQUIVO                      | 13.733     |
| GERENCIA DE FINANCAS | ARQUIVO FINANCEIRO           | 9.968      |
| GERENCIA DE PROJETOS | ARQUIVO GERENCIA DE PROJETOS | 9.404      |
| GERENCIA DE PROJETOS | GERENCIA ADMINISTRATIVA      | 3.937      |

### Fluxo Tipico Identificado

```
                    ┌─────────────────┐
                    │   SECRETARIA    │
                    │   (Entrada)     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   GERENCIA DE   │
                    │    PROJETOS     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ GERENCIA   │  │ GERENCIA   │  │  ARQUIVO   │
     │ FINANCAS   │  │   ADMIN    │  │  PROJETOS  │
     └─────┬──────┘  └────────────┘  └────────────┘
           │
           ▼
     ┌────────────┐
     │  ARQUIVO   │
     │ FINANCEIRO │
     └────────────┘
```

---

## 5. Protocolos Sem Movimentacao

### Por Ano

| Ano  | Total  | Sem Mov | % Sem Mov |
| ---- | ------ | ------- | --------- |
| 2025 | 40.780 | 8.235   | 20,19%    |
| 2024 | 32.798 | 9.344   | 28,49%    |
| 2023 | 16.004 | 4.659   | 29,11%    |
| 2022 | 11.839 | 3.801   | 32,11%    |
| 2021 | 8.250  | 2.788   | 33,79%    |
| 2020 | 7.167  | 2.533   | 35,34%    |

### Padrao Identificado

Protocolos do tipo **"LOTE DE PAGAMENTOS"** frequentemente nao tem movimentacao registrada. Exemplo:

```
0110.020526.0001 | LOTE DE PAGAMENTOS | 2026-05-02
0110.280426.0001 | LOTE DE PAGAMENTOS | 2026-04-28
0001.091225.0001 | LOTE DE PAGAMENTOS | 2025-12-09
```

---

## 6. Tempo Medio de Arquivamento

| Ano  | Arquivados | Dias Medio |
| ---- | ---------- | ---------- |
| 2025 | 13.519     | 27 dias    |
| 2024 | 22.919     | 200 dias   |
| 2023 | 1.168      | 604 dias   |
| 2022 | 329        | 1.005 dias |

### Observacao

Protocolos de 2025 estao sendo arquivados em media em **27 dias**.
Protocolos mais antigos levam mais tempo devido a acumulo de tramitacao.

---

## 7. Protocolos Estagnados

**Definicao**: Protocolos cuja ultima movimentacao tem mais de 1 ano e NAO estao em setor de ARQUIVO.

| Metrica             | Valor      |
| ------------------- | ---------- |
| Total de estagnados | 65.102     |
| Mais antigo         | 2013-08-05 |

### Amostra dos Mais Antigos

| Protocolo        | Ultima Mov | Setor Atual                    |
| ---------------- | ---------- | ------------------------------ |
| 0001.050813.0001 | 2013-08-05 | COMPRAS                        |
| 0002.060813.0001 | 2013-08-07 | INFORMATICA                    |
| 0022.230813.0008 | 2013-08-23 | DESABILITADO GERENCIA PROJETOS |

### Recomendacao

Criar processo de limpeza/arquivamento para protocolos estagnados ha mais de 2 anos.

---

## 8. Tipos de Documento Mais Frequentes

| Tipo                              | Quantidade |
| --------------------------------- | ---------- |
| JUSTIFICATIVA                     | 52.283     |
| DIARIA                            | 25.868     |
| REQUISICAO DE COMPRA              | 20.898     |
| SOLICITACAO DE PAGAMENTO DE BOLSA | 18.321     |
| SOLICITACAO DE PAGAMENTO - PF     | 13.206     |
| BOLSA                             | 5.445      |
| PESSOA FISICA                     | 5.363      |
| RELATORIO DE VIAGEM               | 4.708      |
| OFICIO                            | 4.295      |
| SOLICITACAO DE SERVICOS PJ        | 3.770      |

---

## 9. Protocolos com Datas Anomalas

**Total**: 89 protocolos

### Exemplos

| Protocolo        | Data           | Assunto                             |
| ---------------- | -------------- | ----------------------------------- |
| 0011.050824.0065 | **8202**-09-05 | SOLICITACAO DE PAGAMENTO DE DIARIAS |
| 0121.230522.0024 | **5202**-05-23 | SOLICITACAO DE PAGAMENTO - PF       |
| 0153.190324.0031 | **3024**-03-19 | SOLICITACAO DE PAGAMENTO            |

### Causa Provavel

O ano esta sendo digitado incorretamente:

- 8202 -> deveria ser 2028
- 5202 -> deveria ser 2025
- 3024 -> deveria ser 2024

### Recomendacao

Adicionar validacao na entrada de dados para rejeitar anos futuros (>2030).

---

## 10. TOP 10 Convenios com Mais Protocolos (2024-2025)

| Convenio | Titulo                           | Protocolos |
| -------- | -------------------------------- | ---------- |
| 1999435  | CONTRATO 21/2022 - PROGRAMA EJA  | 2.789      |
| 3008647  | CONT 28.24 - PROJETO DE PESQUISA | 2.297      |
| 3265015  | CONT 31.2024 - PROGRAMA UFPI     | 2.072      |
| 3183679  | CONTRATO 62/2024 - PROJETO       | 1.707      |
| 3271301  | CONT 31/2024 - IFMA              | 1.444      |
| 2627410  | CONT 09/2024 - PROJETO EXTENSAO  | 1.406      |
| 2978744  | TERMO PARCERIA 224 - SOFTEX      | 1.274      |
| 3212948  | IFSERTAO - CONTRATO 16/2024      | 1.230      |
| 2502399  | CONTRATO 004/2024 - UNIVASF      | 1.197      |
| 2164665  | CONTRATO 22/2023 OFERTA CURSOS   | 1.168      |

---

## 11. TOP Remetentes (2024-2025)

| Remetente                           | Protocolos |
| ----------------------------------- | ---------- |
| NULL/Sem remetente                  | 39.085     |
| LIVIA FERNANDA NERY DA SILVA        | 2.991      |
| MARIA DA GLORIA DUARTE FERRO        | 1.885      |
| VIRGINIA TAMARA MUNIZ SILVA         | 1.636      |
| LOUISE TATIANA MENDES RODRIGUES     | 1.376      |
| MARCIA PERCILIA MOURA PARENTE       | 1.352      |
| ANDERSON MIRANDA DE SOUZA           | 1.255      |
| WHASHINGTON LUIS FERREIRA CONCEICAO | 1.249      |
| RICARDO DE CASTRO RIBEIRO SANTOS    | 994        |

---

## 12. Descobertas Criticas Consolidadas

### 12.1. documento.codSetor NUNCA foi usado

- **99,99%** dos protocolos tem `codSetor = NULL`
- Setor atual DEVE ser obtido via ultima movimentacao

### 12.2. scd_movimentacaoItem esta VAZIA

- Tabela que deveria conter relacionamentos mae/filho tem **0 registros**
- Relacionamentos estao em `EventosDoc.Descricao` como TEXTO

### 12.3. 28 Setores Desabilitados

- Setores com prefixo "DESABILITADO" no nome
- **NAO estao deletados** (deletado IS NULL)
- Ainda contem protocolos "parados"

### 12.4. Situacao de Protocolo nao preenchida

- **94%** dos protocolos tem `codSituacaoProt = NULL`

---

## 13. Recomendacoes

### Curto Prazo

1. **Criar view** para obter setor atual via ultima movimentacao
2. **Validar entrada** de datas para evitar anos anomalos
3. **Revisar setores desabilitados** e migrar protocolos

### Medio Prazo

4. **Implementar preenchimento** de `codSituacaoProt`
5. **Criar processo de arquivamento** automatico para estagnados
6. **Documentar** campos obrigatorios e suas regras

### Longo Prazo

7. **Migrar relacionamentos** de `EventosDoc.Descricao` para tabela propria
8. **Implementar dashboard** de acompanhamento de tramitacao
9. **Criar alertas** para protocolos parados por muito tempo

---

## 14. Queries Uteis

### 14.1. Setor Atual de um Protocolo

```sql
SELECT
    d.Numero,
    d.Assunto,
    s.DESCR AS SetorAtual
FROM documento d
CROSS APPLY (
    SELECT TOP 1 codSetorDestino
    FROM scd_movimentacao m
    WHERE m.CodProt = d.Codigo
    AND (m.Deletado IS NULL OR m.Deletado = 0)
    ORDER BY m.data DESC, m.codigo DESC
) ult
LEFT JOIN SETOR s ON s.CODIGO = ult.codSetorDestino
WHERE d.Numero = '0153.250325.0049';
```

### 14.2. Protocolos Estagnados

```sql
SELECT d.Numero, d.Assunto, ult.data AS UltimaMov, s.DESCR AS SetorAtual
FROM documento d
CROSS APPLY (
    SELECT TOP 1 m.data, m.codSetorDestino
    FROM scd_movimentacao m
    WHERE m.CodProt = d.Codigo
    AND (m.Deletado IS NULL OR m.Deletado = 0)
    ORDER BY m.data DESC, m.codigo DESC
) ult
JOIN SETOR s ON s.CODIGO = ult.codSetorDestino
WHERE (d.deletado IS NULL OR d.deletado = 0)
AND ult.data < DATEADD(YEAR, -1, GETDATE())
AND s.DESCR NOT LIKE '%ARQUIVO%';
```

### 14.3. Protocolos com Datas Anomalas

```sql
SELECT Numero, data, Assunto
FROM documento
WHERE (YEAR(data) > 2030 OR YEAR(data) < 1990)
AND (deletado IS NULL OR deletado = 0);
```

---

## 15. Arquivos Relacionados

| Arquivo                                       | Descricao              |
| --------------------------------------------- | ---------------------- |
| `03_modulos/MODULO_PROTOCOLO.md`              | Documentacao do modulo |
| `tabelas/TABELA_documento.md`                 | Estrutura da tabela    |
| `tabelas/TABELA_scd_movimentacao.md`          | Movimentacoes          |
| `tabelas/TABELA_EventosDoc.md`                | Eventos e vinculos     |
| `docs/DESCOBERTA_CODSETOR_NULL.md`            | Analise codSetor       |
| `02_relacionamentos/DIAGRAMA_ER_PROTOCOLO.md` | Diagrama ER            |
| `sql_queries/QUERIES_PROTOCOLOS_2025.sql`     | Queries de analise     |

---

> **Modo de operacao**: SOMENTE LEITURA (SELECT)
> **Gerado por**: Engenharia de Dados - Claude Code
