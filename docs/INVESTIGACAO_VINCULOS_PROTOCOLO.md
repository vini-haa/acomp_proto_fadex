# Investigacao - Vinculos de Protocolos Mae/Filho

> Data: 2025-12-31
> Protocolo Testado: 0153.250325.0049
> Status: CONCLUIDA

---

## 1. Resumo Executivo

```
Problema: Dashboard mostra "nao possui relacionamentos" para protocolos que TEM vinculos no SAGI
Causa: A tabela scd_movimentacaoItem esta VAZIA - vinculos sao feitos via TEXTO nas observacoes
Solucao: Criar parser de vinculos via regex nas observacoes OU aceitar que nao ha vinculos formais
```

---

## 2. Estrutura Documentada vs Realidade

### 2.1 O que a Documentacao DIZ

A documentacao indica que vinculos mae/filho sao armazenados em:

**Tabela**: `scd_movimentacaoItem`

- `CodProt` = Codigo do protocolo MAE
- `CodProtRel` = Codigo do protocolo FILHO

### 2.2 O que REALMENTE Existe no Banco

| Verificacao                              | Resultado    |
| ---------------------------------------- | ------------ |
| Tabela `scd_movimentacaoItem` existe?    | SIM          |
| Campos `CodProt` e `CodProtRel` existem? | SIM          |
| **Total de registros na tabela**         | **0 (ZERO)** |
| Registros ativos                         | 0            |
| Registros deletados                      | 0            |

**CONCLUSAO**: A estrutura existe mas NUNCA FOI UTILIZADA neste banco de dados.

---

## 3. Como os Vinculos SAO Feitos (Descoberta)

Os vinculos entre protocolos sao registrados **informalmente** atraves de:

1. **Texto nas observacoes** das movimentacoes (`scd_movimentacao.obs`)
2. **Padroes textuais** identificados:

### Padroes Encontrados

| Padrao                                  | Exemplo                                          | Quantidade |
| --------------------------------------- | ------------------------------------------------ | ---------- |
| `Protocolo de origem: XXXX.XXXXXX.XXXX` | "Protocolo de origem: 0153.230725.0172"          | ~50        |
| `PROTOCOLOS: XXXX.XXXXXX.XXXX`          | "PROTOCOLOS: 0153.070825.0089, 0153.070825.0090" | ~80        |
| `vinculado aos protocolos`              | "vinculado aos protocolos: 0121.060521.0001"     | ~40        |
| `substituido pelo XXXX.XXXXXX.XXXX`     | "substituido pelo 0153.110825.0015"              | ~30        |

**Total de protocolos com vinculos via observacao**: ~257

---

## 4. Resultados dos Testes

### 4.1 Query #5 (Protocolo MAE)

```sql
SELECT COUNT(*) FROM scd_movimentacaoItem
WHERE CodProtRel IS NOT NULL;
-- Resultado: 0
```

### 4.2 Query #6 (Protocolo FILHO)

```sql
SELECT COUNT(*) FROM scd_movimentacaoItem
WHERE CodProt IS NOT NULL;
-- Resultado: 0
```

### 4.3 Query #18 (Contadores)

```sql
-- ProtocolosFilhos: 0 para TODOS os protocolos
-- EhFilhoDe: 0 para TODOS os protocolos
```

### 4.4 Protocolo de Teste: 0153.250325.0049

| Verificacao                       | Resultado             |
| --------------------------------- | --------------------- |
| Protocolo encontrado              | SIM (Codigo: 3486454) |
| Movimentacoes                     | 5                     |
| Observacoes com texto             | 0 (todas vazias)      |
| Referenciado em outros protocolos | NAO                   |
| Lancamentos financeiros           | 133                   |

**Este protocolo NAO possui vinculos formais NEM informais.**

---

## 5. Causa Raiz Identificada

### Problema Principal

A **funcionalidade de vinculos mae/filho NUNCA FOI IMPLEMENTADA** no sistema SAGI de producao:

1. A tabela `scd_movimentacaoItem` foi **criada mas nunca populada**
2. Vinculos sao feitos **manualmente via texto** nas observacoes
3. Nao existe integracao automatica entre protocolos

### Por que o Sistema Legado "Mostra" Vinculos?

**Hipotese 1**: O sistema legado pode estar mostrando vinculos via:

- Parsing das observacoes
- Campo diferente que nao identificamos
- Logica de negocio customizada

**Hipotese 2**: O usuario pode estar confundindo:

- Movimentacoes do mesmo protocolo com "vinculos"
- Protocolos do mesmo convenio com "vinculos"
- Referencias textuais com vinculos formais

---

## 6. Opcoes de Solucao

### Opcao A: Aceitar que NAO ha Vinculos Formais

**Impacto**: Dashboard mostra corretamente que nao existem vinculos
**Esforco**: Nenhum
**Recomendacao**: Comunicar ao usuario que essa funcionalidade nao existe no banco

### Opcao B: Implementar Parser de Vinculos via Observacao

**Impacto**: Dashboard extrairia vinculos do texto das observacoes
**Esforco**: Medio (regex + logica de extracao)
**Riscos**:

- Dados inconsistentes
- Erros de digitacao nos numeros
- Manutencao complexa

```typescript
// Exemplo de implementacao
const PADROES_VINCULO = [
  /Protocolo de origem:\s*([\d\.]+(?:\s*(?:a|e|,)\s*[\d\.]+)*)/gi,
  /PROTOCOLOS?:\s*([\d\.]+(?:\s*(?:a|e|,)\s*[\d\.]+)*)/gi,
  /vinculado aos? protocolos?\s*([\d\.]+(?:\s*(?:a|e|,)\s*[\d\.]+)*)/gi,
  /substituido pelo\s*([\d\.]+)/gi,
];

function extrairVinculosDeObservacao(obs: string): string[] {
  const vinculos: string[] = [];
  for (const padrao of PADROES_VINCULO) {
    const matches = obs.matchAll(padrao);
    for (const match of matches) {
      // Extrair numeros de protocolo do grupo capturado
      const numeros = match[1].match(/\d{4}\.\d{6}\.\d{4}/g);
      if (numeros) vinculos.push(...numeros);
    }
  }
  return [...new Set(vinculos)];
}
```

### Opcao C: Popular a Tabela scd_movimentacaoItem

**Impacto**: Queries documentadas funcionariam
**Esforco**: Alto (migracao de dados, validacao)
**Riscos**:

- Alteracao em banco de producao
- Necessita aprovacao do DBA
- Pode quebrar sistema legado

---

## 7. Recomendacao

### Curto Prazo (Imediato)

1. **Remover** ou **ocultar** a secao de "Relacionamentos Mae/Filho" do dashboard
2. **Comunicar** ao usuario que essa funcionalidade nao existe no banco atual
3. **Documentar** esta descoberta

### Medio Prazo (Se necessario)

1. **Implementar Opcao B** (parser de observacoes)
2. Criar query alternativa que busca vinculos via texto
3. Mostrar vinculos como "Inferidos" (nao formais)

### Longo Prazo (Ideal)

1. **Avaliar** se vale a pena popular `scd_movimentacaoItem`
2. **Migrar** vinculos textuais para a tabela correta
3. **Integrar** com sistema legado

---

## 8. Arquivos Relacionados

| Arquivo                                     | Descricao                        |
| ------------------------------------------- | -------------------------------- |
| `sql_queries/QUERIES_PROTOCOLO_COMPLETO.md` | Queries #5, #6, #7 documentadas  |
| `03_modulos/MODULO_PROTOCOLO.md`            | Documentacao do modulo           |
| `tabelas/TABELA_scd_movimentacaoItem.md`    | Estrutura da tabela (se existir) |

---

## 9. Evidencias

### 9.1 Tabela scd_movimentacaoItem

```
Total de registros (todos): 0
Total de registros ativos: 0
Com CodProt preenchido: 0
Com CodProtRel preenchido: 0
```

### 9.2 Vinculos via Observacao (Exemplos)

```
0175.040925.0025: Protocolo de origem: 0153.210825.0005
0174.140825.0041: PROTOCOLOS:0153.120825.0040 E 0153.120825.0042
0125.060521.0035: vinculado aos protocolos: 0121.060521.0001 e 0121.060521.0002
```

### 9.3 Protocolo de Teste

```
Numero: 0153.250325.0049
Codigo: 3486454
Assunto: SOLICITACAO DE PAGAMENTO DE BOLSA
Movimentacoes: 5
Lancamentos Financeiros: 133
Vinculos Formais: 0
Vinculos via Observacao: 0
```

---

## 10. DESCOBERTA ADICIONAL: Tabela EventosDoc

### 10.1 Nova Fonte de Relacionamentos Encontrada

A tabela `EventosDoc` contem **399.876 registros** com eventos/acoes de protocolos:

| Tipo de Evento         | Quantidade | Descricao                             |
| ---------------------- | ---------- | ------------------------------------- |
| ASSOCIADO AO PAGAMENTO | 212.031    | Vincula protocolo a FINANCEIRO.CODIGO |
| REAPRESENTACAO         | 1.755      | Indica reapresentacao de pagamento    |
| ORIGINADO DE PROCESSO  | 1.295      | Indica protocolo filho                |
| Outros                 | ~185.000   | Recepcao, transferencia, etc          |

### 10.2 Protocolo 0153.250325.0049 na EventosDoc

O protocolo de teste tem **133 eventos** na EventosDoc:

- **126 eventos** de "ASSOCIADO AO PAGAMENTO" (vinculo com 126 lancamentos financeiros)
- **12 eventos** de "REAPRESENTACAO" (6 pessoas tiveram pagamentos reapresentados)
- **2 eventos** de confirmacao de recepcao

### 10.3 Estrutura dos Vinculos via EventosDoc

```
EventosDoc.Descricao contem:
├── "PROTOCOLO/PROCESSO ASSOCIADO AO PAGAMENTO DE NÚMERO XXXXXX"
│   └── XXXXXX = FINANCEIRO.CODIGO
│
├── "REAPRESENTAÇÃO DO PAGAMENTO DE [NOME]. ORIGINADO A PARTIR DO PROCESSO INICIAL [PROTOCOLO]"
│   └── Indica que este protocolo foi ORIGINADO de outro
│
└── "FOI REAPRESENTADO O PAGAMENTO DE [NOME], ATRAVÉS DO NOVO PROTOCOLO [PROTOCOLO]"
    └── Indica que este protocolo ORIGINOU outro
```

### 10.4 Query para Extrair Vinculos via EventosDoc

```sql
-- Pagamentos associados
SELECT
    TRY_CAST(SUBSTRING(e.Descricao, CHARINDEX('NÚMERO ', e.Descricao) + 8, 10) AS INT) AS CodPagamento
FROM EventosDoc e
WHERE e.CodProt = @CodProtocolo
  AND e.Descricao LIKE '%ASSOCIADO AO PAGAMENTO DE NÚMERO%';

-- Reapresentacoes
SELECT e.Descricao
FROM EventosDoc e
WHERE e.CodProt = @CodProtocolo
  AND (e.Descricao LIKE '%REAPRESENTAÇÃO%' OR e.Descricao LIKE '%FOI REAPRESENTADO%');
```

---

## 11. Arquivos Criados

| Arquivo                                   | Descricao                                   |
| ----------------------------------------- | ------------------------------------------- |
| `docs/INVESTIGACAO_VINCULOS_PROTOCOLO.md` | Este documento                              |
| `scripts/extrair_vinculos_observacao.py`  | Parser de vinculos via scd_movimentacao.obs |
| `sql_queries/QUERY_EVENTOS_PROTOCOLO.sql` | Queries para EventosDoc                     |

---

## 12. Conclusao Final

### O que o Sistema SAGI Provavelmente Mostra

O sistema legado SAGI provavelmente mostra "relacionamentos" baseados em:

1. **EventosDoc** - Eventos de pagamento, reapresentacao, etc.
2. **FINANCEIRO.CodProt** - Lancamentos financeiros vinculados
3. **scd_movimentacao.obs** - Referencias textuais em observacoes

### O que NAO Existe

- Relacionamentos formais mae/filho via `scd_movimentacaoItem` (tabela VAZIA)

### Recomendacao

Para exibir relacionamentos no dashboard:

1. **Mostrar pagamentos associados** via EventosDoc (212K eventos)
2. **Mostrar reapresentacoes** via EventosDoc (1.7K eventos)
3. **Mostrar lancamentos financeiros** via FINANCEIRO.CodProt (1.2M registros)
4. **NAO mostrar** vinculos mae/filho formais (nao existem)

---

## 13. Checklist de Validacao

- [x] Script de teste executado
- [x] Tabela scd_movimentacaoItem verificada (VAZIA)
- [x] Padroes de vinculo via observacao identificados
- [x] Protocolo 0153.250325.0049 testado
- [x] Causa raiz identificada
- [x] Opcoes de solucao documentadas
- [x] **NOVA**: Tabela EventosDoc investigada
- [x] **NOVA**: 399.876 eventos encontrados
- [x] **NOVA**: Query para EventosDoc criada
- [ ] Comunicacao com usuario sobre limitacao
- [ ] Decisao sobre implementacao no dashboard

---

> **Investigador**: Claude Code
> **Data**: 2025-12-31
> **Versao**: 2.0 (atualizado com EventosDoc)
