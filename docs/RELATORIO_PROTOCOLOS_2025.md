# Relatorio de Analise - Protocolos 2025

> **Data**: 2025-12-31
> **Banco**: fade1
> **Modo**: SOMENTE LEITURA

---

## Resumo Executivo

| Metrica                       | Valor         |
| ----------------------------- | ------------- |
| **Total de Protocolos 2025**  | 6.760         |
| **Protocolos Ativos**         | 6.703 (99,2%) |
| **Protocolos Deletados**      | 57 (0,8%)     |
| **Com Pagamentos Vinculados** | 2.094 (31,2%) |
| **Protocolos Mae**            | 34            |
| **Protocolos Filho**          | 21            |

---

## 1. Distribuicao por Categoria de Assunto

| Categoria  | Quantidade | Percentual |
| ---------- | ---------- | ---------- |
| PAGAMENTOS | 3.823      | 57,0%      |
| BOLSAS     | 1.413      | 21,1%      |
| OUTROS     | 1.009      | 15,1%      |
| SERVICOS   | 186        | 2,8%       |
| COMPRAS    | 147        | 2,2%       |
| PASSAGENS  | 119        | 1,8%       |
| DIARIAS    | 6          | 0,1%       |

### Observacao

A grande maioria dos protocolos (78,1%) esta relacionada a pagamentos ou bolsas.

---

## 2. TOP 10 Protocolos com Mais Pagamentos Vinculados

| #   | Protocolo        | Assunto                           | Pagamentos |
| --- | ---------------- | --------------------------------- | ---------- |
| 1   | 0153.250325.0049 | SOLICITACAO DE PAGAMENTO DE BOLSA | 126        |
| 2   | 0121.251121.0037 | SOLICITACAO DE PAGAMENTO          | 111        |
| 3   | 0153.250924.0135 | SOLICITACAO DE PAGAMENTO DE BOLSA | 77         |
| 4   | 0121.250422.0006 | SOLICITACAO DE PAGAMENTO          | 67         |
| 5   | 0153.251024.0061 | SOLICITACAO DE PAGAMENTO DE BOLSA | 62         |
| 6   | 0022.250315.0016 | SOLICITACAO DE PAGAMENTO          | 60         |
| 7   | 0121.250621.0019 | SOLICITACAO DE PAGAMENTO          | 55         |
| 8   | 0153.251024.0065 | SOLICITACAO DE PAGAMENTO DE BOLSA | 55         |
| 9   | 0153.250624.0046 | SOLICITACAO DE PAGAMENTO DE BOLSA | 53         |
| 10  | 0153.250325.0073 | SOLICITACAO DE PAGAMENTO DE BOLSA | 50         |

### Analise

- O protocolo `0153.250325.0049` lidera com **126 pagamentos vinculados**
- Os 10 maiores protocolos sao todos de solicitacoes de pagamento
- **716 pagamentos** estao concentrados nos TOP 10 protocolos

---

## 3. Vinculos Mae/Filho (Reapresentacoes)

### 3.1 Protocolos MAE (Originaram outros)

Total: **34 protocolos** que geraram reapresentacoes.

### 3.2 Protocolos FILHO (Originados de outros)

Total: **21 protocolos** que sao resultado de reapresentacoes.

### Exemplos de Protocolos Filho

| Protocolo Filho  | Assunto                                  | Data       |
| ---------------- | ---------------------------------------- | ---------- |
| 8080.250425.0026 | BOLSA                                    | 25/04/2025 |
| 3302.250325.0010 | 33.90.20 - BOLSAS PESQUISADOR            | 25/03/2025 |
| 2650.250725.0003 | 33.90.14 - DIARIAS                       | 25/07/2025 |
| 1430.250425.0017 | BOLSAS PESQUISADOR                       | 25/04/2025 |
| 0189.251124.0068 | SOLICITACOES DE PAGAMENTO DE BOLSAS      | 25/11/2024 |
| 0153.251124.0045 | SOLICITACAO DE PAGAMENTO DE DIARIAS      | 25/11/2024 |
| 0153.250825.0090 | SOLICITACAO DE PAGAMENTO DE BOLSA - DISC | 25/08/2025 |

---

## 4. Eventos de Protocolos (EventosDoc)

| Tipo de Evento      | Quantidade |
| ------------------- | ---------- |
| OUTROS              | 6.679      |
| PAGAMENTO ASSOCIADO | 5.033      |
| FOI REAPRESENTADO   | 95         |

### Analise

- **5.033 eventos** de associacao de pagamento
- **95 eventos** de reapresentacao (vinculos mae/filho)
- A maioria dos eventos sao de outros tipos (recepcao, tramitacao, etc)

---

## 5. Resumo de Vinculos

| Metrica                                 | Valor | Percentual |
| --------------------------------------- | ----- | ---------- |
| Protocolos com pagamento vinculado      | 2.094 | 31,2%      |
| Protocolos MAE (originaram outros)      | 34    | 0,5%       |
| Protocolos FILHO (originados de outros) | 21    | 0,3%       |

### Interpretacao

1. **31,2%** dos protocolos tem pelo menos um pagamento vinculado
2. **0,8%** dos protocolos participam de relacionamentos mae/filho
3. A tabela `scd_movimentacaoItem` continua **VAZIA** - vinculos via EventosDoc

---

## 6. Descobertas Importantes

### 6.1 Formato do Numero de Protocolo

O formato `XXXX.AAMMDD.NNNN` onde:

- **XXXX**: Codigo do funcionario criador
- **AA**: Ano (25 = 2025)
- **MM**: Mes
- **DD**: Dia
- **NNNN**: Sequencial

**Nota**: A busca `WHERE Numero LIKE '%.25%'` captura protocolos de 2025, mas tambem pode incluir alguns de outros anos se o dia for 25. Para precisao total, usar:

```sql
WHERE SUBSTRING(Numero, 6, 2) = '25'
```

### 6.2 Vinculos via EventosDoc

Os relacionamentos sao extraidos de:

- `PROTOCOLO/PROCESSO ASSOCIADO AO PAGAMENTO DE NUMERO XXXXXX`
- `ORIGINADO A PARTIR DO PROCESSO INICIAL XXXX.XXXXXX.XXXX`
- `FOI REAPRESENTADO...ATRAVES DO NOVO PROTOCOLO XXXX.XXXXXX.XXXX`

### 6.3 Setores - DESCOBERTA IMPORTANTE

**O campo `documento.codSetor` esta NULL para TODOS os protocolos 2025!**

O setor atual de um protocolo deve ser obtido via **ultima movimentacao**:

```sql
SELECT TOP 1 codSetorDestino
FROM scd_movimentacao
WHERE CodProt = @CodProtocolo
  AND (Deletado IS NULL OR Deletado = 0)
ORDER BY data DESC, codigo DESC
```

### TOP 10 Setores (via ultima movimentacao)

| Setor                                  | Protocolos |
| -------------------------------------- | ---------- |
| GERENCIA DE ADMINISTRACAO              | 883        |
| ARQUIVO                                | 668        |
| GERENCIA DE PROJETOS                   | 626        |
| GERENCIA DE FINANCAS E CONTABILIDADE   | 624        |
| GERENCIA ADMINISTRATIVA E FINANCEIRA   | 426        |
| COORDENACAO DE RECURSOS HUMANOS        | 328        |
| ARQUIVO FINANCEIRO                     | 259        |
| ARQUIVO GERENCIA DE PROJETOS           | 259        |
| GERENCIA DE PROJETOS E RELACOES        | 215        |
| COORDENACAO DE ADM DE PROJ E CONVENIOS | 158        |

**Nota**: Alguns setores estao marcados como "DESABILITADO" no nome.

---

## 7. Arquivos Relacionados

| Arquivo                                   | Descricao              |
| ----------------------------------------- | ---------------------- |
| `sql_queries/QUERIES_PROTOCOLOS_2025.sql` | Queries completas      |
| `scripts/analisar_protocolos_2025.py`     | Script de analise      |
| `tabelas/TABELA_EventosDoc.md`            | Documentacao da tabela |
| `03_modulos/MODULO_PROTOCOLO.md`          | Documentacao do modulo |

---

## 8. Proximos Passos

1. [ ] Investigar por que setores retornaram vazio
2. [ ] Analisar valor total dos pagamentos vinculados
3. [ ] Identificar protocolos parados ha mais de 30 dias
4. [ ] Mapear fluxo completo mae -> filho

---

> **Gerado por**: Claude Code
> **Script**: `scripts/analisar_protocolos_2025.py`
> **Versao**: 1.0
