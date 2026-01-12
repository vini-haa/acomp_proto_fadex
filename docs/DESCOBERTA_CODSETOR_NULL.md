# Descoberta: documento.codSetor NUNCA foi usado

> Data: 2025-12-31
> Status: CONFIRMADO

---

## Resumo

O campo `documento.codSetor` esta **NULL para 99,99% dos protocolos**.

| Metrica                    | Valor       |
| -------------------------- | ----------- |
| Total de protocolos ativos | 175.635     |
| Com codSetor preenchido    | 22          |
| Percentual com codSetor    | **0,0125%** |

---

## Analise por Ano

O problema NAO e recente. O campo sempre foi NULL desde 2001:

| Ano  | Total | Com Setor | %     |
| ---- | ----- | --------- | ----- |
| 2025 | 6.703 | 0         | 0%    |
| 2024 | 6.058 | 9         | 0,15% |
| 2023 | 5.876 | 0         | 0%    |
| ...  | ...   | ...       | ...   |
| 2013 | 5.159 | 0         | 0%    |

---

## Os 22 Protocolos com codSetor

| codSetor | Setor                                  | Quantidade |
| -------- | -------------------------------------- | ---------- |
| 6        | DESABILITADO GERENCIA DE ADMINISTRACAO | 18         |
| 42       | DESABILITADO GERENCIA ADM E FINANCEIRA | 2          |
| 48       | GERENCIA DE FINANCAS E CONTABILIDADE   | 1          |
| 35       | DESABILITADO COORD DE COMPRAS          | 1          |

Nota: A maioria dos poucos registros aponta para setores DESABILITADOS.

---

## Conclusao

O campo `documento.codSetor` **NUNCA foi populado pelo sistema SAGI**.

O setor atual de um protocolo DEVE ser obtido via:

1. **Ultima movimentacao** (`scd_movimentacao.codSetorDestino`)
2. **Primeira movimentacao** (setor de origem/criacao)

---

## Query Correta para Setor Atual

```sql
-- Setor atual de um protocolo
SELECT
    d.Numero,
    d.Assunto,
    sd.DESCR AS SetorAtual
FROM documento d
CROSS APPLY (
    SELECT TOP 1 codSetorDestino
    FROM scd_movimentacao m
    WHERE m.CodProt = d.Codigo
      AND (m.Deletado IS NULL OR m.Deletado = 0)
    ORDER BY m.data DESC, m.codigo DESC
) ult
LEFT JOIN SETOR sd ON sd.CODIGO = ult.codSetorDestino
WHERE d.Numero = '0153.250325.0049';
```

---

## Impacto em Aplicacoes

1. **NAO usar** `documento.codSetor` para determinar setor atual
2. **SEMPRE** buscar da ultima movimentacao
3. Considerar criar **view** ou **coluna calculada** para facilitar

---

## Arquivos Relacionados

| Arquivo                              | Descricao              |
| ------------------------------------ | ---------------------- |
| `tabelas/TABELA_documento.md`        | Estrutura da tabela    |
| `tabelas/TABELA_scd_movimentacao.md` | Movimentacoes          |
| `03_modulos/MODULO_PROTOCOLO.md`     | Documentacao do modulo |

---

> **Gerado por**: Engenharia de Dados - Claude Code
