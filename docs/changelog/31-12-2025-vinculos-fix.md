# Correção de Vínculos de Protocolos - 31/12/2025

## Resumo do Problema

A funcionalidade de vínculos/relacionamentos de protocolos implementada em 30/12/2025 **não estava funcionando** para protocolos com pagamentos/bolsas.

### Evidências do Bug

- Protocolo de teste: `0153.250325.0049` (código: 3486454)
- Sistema legado SAGI: Mostrava vínculos com pagamentos/bolsas
- Dashboard novo: Mostrava "não possui relacionamentos"

---

## Diagnóstico

### Causa Raiz

As queries originais buscavam vínculos **exclusivamente** na tabela `scd_movimentacaoItem.CodProtRel`:

```sql
-- Query original (QUERY_PROTOCOLO_MAE)
SELECT ... FROM scd_movimentacaoItem smi
WHERE smi.CodProt = @codProtocolo AND smi.CodProtRel IS NOT NULL
```

**Problema**: Para protocolos de **bolsas/pagamentos**, os vínculos estão na tabela `FINANCEIRO`, não em `scd_movimentacaoItem`.

### Descoberta

O protocolo de teste tinha:

- **0 registros** em `scd_movimentacaoItem`
- **133 lançamentos financeiros** em `FINANCEIRO` (bolsas de R$750 cada)
- **R$ 99.750,00** em valor total

---

## Solução Implementada

### 1. Novo Endpoint Dedicado

**Arquivo criado:** `app/api/protocolos/[id]/vinculos/route.ts`

O novo endpoint busca vínculos de **múltiplas fontes**:

| Fonte                     | Tabela                   | Tipo de Vínculo                 |
| ------------------------- | ------------------------ | ------------------------------- |
| Relacionamentos Mãe       | `scd_movimentacaoItem`   | Protocolos que este originou    |
| Relacionamentos Filho     | `scd_movimentacaoItem`   | Protocolos que originaram este  |
| Lançamentos Financeiros   | `FINANCEIRO`             | Bolsas, pagamentos, etc.        |
| Protocolos via Financeiro | `FINANCEIRO` (self-join) | Protocolos com mesmo lançamento |

**Queries implementadas:**

```sql
-- Relacionamentos Mãe/Filho (mantido)
SELECT ... FROM scd_movimentacaoItem smi ...

-- NOVO: Lançamentos Financeiros
SELECT f.CODIGO, f.TITULO, f.VALORLIQUIDO, p.descricao AS beneficiario, ...
FROM FINANCEIRO f
LEFT JOIN PESSOAS p ON p.codigo = f.CODFORNEC
WHERE f.CodProt = @codProtocolo

-- NOVO: Resumo de Vínculos
SELECT
    (SELECT COUNT(*) FROM scd_movimentacaoItem ...) AS qtdFilhos,
    (SELECT COUNT(*) FROM FINANCEIRO ...) AS qtdFinanceiro,
    (SELECT SUM(ABS(VALORLIQUIDO)) FROM FINANCEIRO ...) AS valorTotalFinanceiro
```

### 2. Novo Componente de UI

**Arquivo criado:** `components/protocolo/VinculosProtocolo.tsx`

Características:

- Busca dados via React Query do endpoint `/api/protocolos/[id]/vinculos`
- Exibe resumo em cards (qtd filhos, mães, financeiro, valor total)
- Lista relacionamentos Mãe/Filho com links navegáveis
- Lista lançamentos financeiros com beneficiário, valor, status
- Scroll interno para muitos lançamentos (máx 20 visíveis, com indicador "+N")

### 3. Atualização da Página de Detalhes

**Arquivo modificado:** `app/(dashboard)/protocolos/[id]/page.tsx`

- Substituído `RelacionamentosProtocolo` por `VinculosProtocolo`
- Badge de vínculos agora inclui lançamentos financeiros na contagem
- Tab "Vínculos" usa o novo componente

---

## Arquivos Modificados/Criados

| Arquivo                                      | Ação       | Descrição                      |
| -------------------------------------------- | ---------- | ------------------------------ |
| `app/api/protocolos/[id]/vinculos/route.ts`  | **Criado** | Novo endpoint dedicado         |
| `components/protocolo/VinculosProtocolo.tsx` | **Criado** | Novo componente de UI          |
| `components/protocolo/index.ts`              | Modificado | Export do novo componente      |
| `app/(dashboard)/protocolos/[id]/page.tsx`   | Modificado | Uso do novo componente         |
| `app/api/debug-vinculos/route.ts`            | **Criado** | Endpoint de debug/investigação |

---

## Validação

### Teste com Protocolo `0153.250325.0049`

**Antes (bug):**

```json
{
  "temVinculos": false,
  "relacionamentos": { "filhos": [], "maes": [] }
}
```

**Depois (correção):**

```json
{
  "temVinculos": true,
  "resumo": {
    "qtdFilhos": 0,
    "qtdMaes": 0,
    "qtdFinanceiro": 133,
    "valorTotalFinanceiro": 99750
  }
}
```

### Endpoint de Debug

Para investigar vínculos de qualquer protocolo:

```bash
# Por número
curl http://localhost:3001/api/debug-vinculos?numero=0153.250325.0049

# Por código
curl http://localhost:3001/api/debug-vinculos?codProtocolo=3486454

# Descobrir estrutura
curl http://localhost:3001/api/debug-vinculos?action=discover-tables
```

---

## Performance

| Métrica                        | Valor     |
| ------------------------------ | --------- |
| Tempo do endpoint `/vinculos`  | ~744ms    |
| Queries executadas em paralelo | 5         |
| Cache (staleTime)              | 5 minutos |

---

## Próximos Passos Sugeridos

1. **Remover endpoint de debug** em produção (`/api/debug-vinculos`)
2. **Adicionar índice** na coluna `FINANCEIRO.CodProt` se não existir
3. **Considerar paginação** para protocolos com muitos lançamentos (>100)
4. **Testes automatizados** para o novo endpoint

---

## Estrutura de Vínculos no SAGI

```
Protocolo
├── scd_movimentacaoItem (CodProtRel) → Relacionamentos Mãe/Filho
├── FINANCEIRO (CodProt) → Lançamentos Financeiros/Bolsas
│   ├── PESSOAS (beneficiário)
│   └── CONVENIO (projeto)
└── scd_movimentacao (histórico com obs "VINCULADO")
```

---

_Correção implementada em 31/12/2025_
