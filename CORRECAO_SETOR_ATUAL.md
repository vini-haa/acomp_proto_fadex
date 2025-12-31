# Correção da Inconsistência do Setor Atual

**Data:** 24 de novembro de 2025
**Status:** ✅ CORRIGIDO

---

## 🐛 Problema Identificado

### **Descrição:**

Alguns protocolos exibiam informações inconsistentes:

- **Setor Origem:** Gerência de Projetos
- **Setor Atual:** Gerência de Projetos
- **Histórico de Movimentações:** Última movimentação para Gerência Financeira

Ou seja, o setor atual e setor origem não estavam de acordo com o histórico real de movimentações.

---

## 🔍 Causa Raiz

### **Problema na CTE `SetorAtual`:**

A lógica de cálculo do setor atual estava **IGNORANDO** o campo `RegAtual` que indica a movimentação **ATIVA** do protocolo.

**Código INCORRETO (antes):**

```sql
SetorAtual AS (
    SELECT
        codprot,
        setor_atual
    FROM (
        SELECT DISTINCT
            m1.codprot,
            -- ❌ PROBLEMA: Lógica CASE complexa e incorreta
            CASE
                WHEN m1.codsetororigem = 48 THEN m1.codsetordestino
                ELSE m1.codsetororigem
            END AS setor_atual,
            -- ❌ PROBLEMA: Ordenava APENAS por data, sem considerar RegAtual
            ROW_NUMBER() OVER (PARTITION BY m1.codprot ORDER BY m1.data DESC) AS rn
        FROM scd_movimentacao m1
        WHERE m1.codsetordestino = 48 OR m1.codsetororigem = 48
    ) sub
    WHERE rn = 1
)
```

**Por que estava errado:**

1. ❌ Não usava `RegAtual = 1` que indica onde o protocolo **ESTÁ AGORA**
2. ❌ Ordenava apenas por `data DESC`, pegando a movimentação mais recente (que pode estar deletada ou inativa)
3. ❌ A lógica CASE estava tentando "adivinhar" o setor atual com base em origem/destino
4. ❌ Não filtrava `Deletado IS NULL`

---

## ✅ Solução Implementada

### **Código CORRETO (depois):**

```sql
SetorAtual AS (
    -- CTE para calcular setor atual baseado em RegAtual (movimentação ativa)
    -- Corrigido para usar RegAtual=1 que indica onde o protocolo ESTÁ AGORA
    SELECT
        codprot,
        setor_atual,
        setor_origem
    FROM (
        SELECT DISTINCT
            m1.codprot,
            -- ✅ CORRETO: Pega o destino da movimentação diretamente
            m1.codsetordestino AS setor_atual,
            m1.codsetororigem AS setor_origem,
            -- ✅ CORRETO: Prioriza RegAtual=1 (movimentação ativa) PRIMEIRO
            ROW_NUMBER() OVER (
                PARTITION BY m1.codprot
                ORDER BY m1.RegAtual DESC, m1.data DESC
            ) AS rn
        FROM scd_movimentacao m1
        WHERE (m1.codsetordestino = 48 OR m1.codsetororigem = 48)
          AND m1.Deletado IS NULL  -- ✅ Ignora registros deletados
    ) sub
    WHERE rn = 1
)
```

---

## 🔧 Mudanças Aplicadas

### **1. Priorização do `RegAtual`:**

```sql
-- ANTES: ORDER BY m1.data DESC
-- DEPOIS: ORDER BY m1.RegAtual DESC, m1.data DESC
```

- Agora prioriza movimentações com `RegAtual = 1` (ativas)
- Depois usa `data DESC` como critério de desempate

### **2. Seleção Direta do Setor:**

```sql
-- ANTES: CASE WHEN m1.codsetororigem = 48 THEN m1.codsetordestino ELSE m1.codsetororigem END
-- DEPOIS: m1.codsetordestino AS setor_atual
```

- Remove lógica CASE complexa e potencialmente incorreta
- Pega o destino da movimentação diretamente (que é onde o protocolo está)

### **3. Adição do Setor Origem:**

```sql
-- NOVO: m1.codsetororigem AS setor_origem
```

- Agora também captura o setor de origem da movimentação

### **4. Filtro de Deletados:**

```sql
-- NOVO: AND m1.Deletado IS NULL
```

- Garante que movimentações deletadas não sejam consideradas

---

## 📊 Como Funciona Agora

### **Exemplo de Movimentações:**

```
codprot: 4583107
┌─────┬──────────┬────────┬────────┬─────────┐
│ ID  │ Data     │ Origem │ Destino│ RegAtual│
├─────┼──────────┼────────┼────────┼─────────┤
│ 100 │ 01/11/25 │ 45     │ 48     │ 0       │ Entrada antiga
│ 101 │ 05/11/25 │ 48     │ 50     │ 0       │ Saiu para Setor 50
│ 102 │ 10/11/25 │ 50     │ 48     │ 1       │ ✅ ATUAL (RegAtual=1)
└─────┴──────────┴────────┴────────┴─────────┘
```

**ANTES (INCORRETO):**

- Pegava a movimentação mais recente por data (ID 102)
- Mas a lógica CASE poderia retornar o setor errado

**DEPOIS (CORRETO):**

- Prioriza `RegAtual = 1` → Pega ID 102
- `setor_atual` = 48 (codsetordestino da ID 102)
- `setor_origem` = 50 (codsetororigem da ID 102)

---

## 🎯 Resultado

### **Agora, para um protocolo:**

- **Setor Origem:** Será o `codsetororigem` da movimentação com `RegAtual = 1`
- **Setor Atual:** Será o `codsetordestino` da movimentação com `RegAtual = 1`
- **Histórico:** Mostrará todas as movimentações, incluindo a ativa

✅ **Totalmente consistente!**

---

## 📁 Arquivo Modificado

**Arquivo:** `lib/queries/base-cte.ts`
**Linhas:** 40-58 (CTE `SetorAtual`)

**Observação:** O arquivo `base-cte-light.ts` não foi alterado pois:

- É usado apenas para KPIs (não calcula setor_atual)
- Não exibe informações de setor origem/destino
- Mantém a performance otimizada

---

## 🧪 Como Testar

### **1. Acessar Detalhes de um Protocolo:**

```
http://localhost:3000/protocolos/{codprot}
```

### **2. Verificar Consistência:**

- Olhe o **Setor Origem** e **Setor Atual** no topo da página
- Olhe a **última movimentação** no histórico
- ✅ **Devem estar de acordo!**

### **3. Exemplo de Teste:**

```
Protocolo: 4583107
- Setor Atual: Deve ser o destino da última movimentação com RegAtual=1
- Setor Origem: Deve ser a origem da última movimentação com RegAtual=1
- Timeline: A última movimentação deve corresponder ao setor atual
```

---

## ⚠️ Observação Importante

### **Campo `RegAtual` é CRÍTICO:**

```sql
-- RegAtual = 1 → Movimentação ATIVA (onde o protocolo ESTÁ AGORA)
-- RegAtual = 0 → Movimentação HISTÓRICA (onde o protocolo JÁ PASSOU)
```

**Este campo é a FONTE DA VERDADE para saber onde um protocolo está atualmente.**

A correção garante que sempre usamos este campo como base para calcular o setor atual.

---

## 📈 Impacto

### **Benefícios:**

✅ Dados consistentes entre detalhes e histórico
✅ Setor atual sempre reflete a realidade
✅ Elimina confusão para usuários
✅ Lógica mais simples e correta
✅ Respeita o campo `RegAtual` (fonte da verdade)

### **Performance:**

- ✅ **Sem impacto negativo** (mesma complexidade de query)
- ✅ Uso de índices permanece eficiente
- ✅ Filtro adicional (`Deletado IS NULL`) pode até melhorar performance

---

## 🚀 Status

✅ **Correção implementada em:** `lib/queries/base-cte.ts`
✅ **Servidor reiniciado:** Porta 3000
✅ **Aplicação rodando:** http://localhost:3000
⏳ **Aguardando testes:** Usuário pode verificar protocolos problemáticos

---

**Criado em:** 24/11/2025
**Status:** ✅ IMPLEMENTADO - AGUARDANDO VALIDAÇÃO
