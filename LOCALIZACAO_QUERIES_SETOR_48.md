# Localização das Queries do Setor Financeiro (48)

**Data:** 24 de novembro de 2025

---

## 📍 Arquivos que Contêm Queries do Setor 48

### **1. 🎯 PRINCIPAL: `lib/queries/base-cte.ts`**

**Importância:** ⭐⭐⭐⭐⭐ (CRÍTICO)

**O que faz:** Define a CTE base que TODOS os outros usam

**Onde está o setor 48:**

#### **Linha 18-21: ProtocolosAtuaisNoSetor**

```typescript
WHERE m.codsetordestino = 48  ← SETOR FINANCEIRO
  AND m.RegAtual = 1
  AND m.Deletado IS NULL
```

**Função:** Identifica protocolos ATUALMENTE no setor (RegAtual=1)

#### **Linha 37: MovimentacoesFinanceiro**

```typescript
WHERE m.codsetordestino = 48 OR m.codsetororigem = 48
```

**Função:** Pega TODAS as movimentações de entrada e saída do setor 48

#### **Linha 54: SetorAtual**

```typescript
WHERE (m.codsetordestino = 48 OR m.codsetororigem = 48)
  AND m.Deletado IS NULL
```

**Função:** Calcula qual é o setor atual do protocolo

**Impacto:** Se você mudar AQUI, muda em TODA a aplicação!

---

### **2. `lib/queries/base-cte-light.ts`**

**Importância:** ⭐⭐⭐⭐ (ALTA)

**O que faz:** Versão otimizada da CTE para KPIs

**Onde está o setor 48:**

#### **Linha 19-21:**

```typescript
WHERE m.codsetordestino = 48  ← SETOR FINANCEIRO
  AND m.RegAtual = 1
  AND m.Deletado IS NULL
```

#### **Linha 49:**

```typescript
WHERE m.codsetordestino = 48 OR m.codsetororigem = 48
```

**Impacto:** Usado apenas em KPIs e dashboard

---

### **3. `lib/queries/protocolos.ts`**

**Importância:** ⭐⭐⭐ (MÉDIA)

**O que faz:** Queries de listagem e detalhes de protocolos

**Onde usa o setor 48:**

- **NÃO define diretamente**
- Usa `vw_ProtocolosFinanceiro` (que vem do `base-cte.ts`)

**Exemplo (linha 81):**

```typescript
FROM vw_ProtocolosFinanceiro vp  ← Usa a CTE que filtra setor 48
```

**Impacto:** Indireto - depende do `base-cte.ts`

---

### **4. `lib/queries/kpis-optimized.ts`**

**Importância:** ⭐⭐⭐ (MÉDIA)

**O que faz:** Calcula KPIs do dashboard

**Onde usa o setor 48:**

- **NÃO define diretamente**
- Usa `vw_ProtocolosFinanceiro` (que vem do `base-cte-light.ts`)

**Exemplo (linha 20+):**

```typescript
FROM vw_ProtocolosFinanceiro vp  ← Usa a CTE light que filtra setor 48
```

**Impacto:** Indireto - depende do `base-cte-light.ts`

---

### **5. `lib/queries/analytics.ts`**

**Importância:** ⭐⭐ (BAIXA)

**O que faz:** Queries de análises e gráficos

**Onde usa o setor 48:**

- **NÃO define diretamente**
- Usa `vw_ProtocolosFinanceiro` (que vem do `base-cte.ts`)

**Impacto:** Indireto - depende do `base-cte.ts`

---

### **6. `lib/queries/alertas.ts`**

**Importância:** ⭐⭐ (BAIXA)

**O que faz:** Queries de alertas (protocolos críticos)

**Onde usa o setor 48:**

- **NÃO define diretamente**
- Usa `vw_ProtocolosFinanceiro` (que vem do `base-cte.ts`)

**Impacto:** Indireto - depende do `base-cte.ts`

---

## 🎯 Onde Modificar para Filtrar Dados Antigos

### **OPÇÃO 1: Modificar APENAS o base-cte.ts (RECOMENDADO)**

**Vantagem:** Modifica em um lugar só, afeta toda a aplicação

**Arquivo:** `lib/queries/base-cte.ts`

**Modificações necessárias:**

#### **1. ProtocolosAtuaisNoSetor (linha 18-21):**

```typescript
// ANTES
WHERE m.codsetordestino = 48
  AND m.RegAtual = 1
  AND m.Deletado IS NULL

// DEPOIS (adicionar filtro de data)
WHERE m.codsetordestino = 48
  AND m.RegAtual = 1
  AND m.Deletado IS NULL
  AND m.data >= '2024-01-01'  ← FILTRO DE DATA
```

#### **2. MovimentacoesFinanceiro (linha 37):**

```typescript
// ANTES
WHERE m.codsetordestino = 48 OR m.codsetororigem = 48

// DEPOIS
WHERE (m.codsetordestino = 48 OR m.codsetororigem = 48)
  AND m.data >= '2024-01-01'  ← FILTRO DE DATA
```

#### **3. SetorAtual (linha 54):**

```typescript
// ANTES
WHERE (m.codsetordestino = 48 OR m.codsetororigem = 48)
  AND m.Deletado IS NULL

// DEPOIS
WHERE (m.codsetordestino = 48 OR m.codsetororigem = 48)
  AND m.Deletado IS NULL
  AND m1.data >= '2024-01-01'  ← FILTRO DE DATA
```

---

### **OPÇÃO 2: Modificar AMBOS os CTEs**

Se você usar OPÇÃO 1, também precisa modificar o `base-cte-light.ts`:

**Arquivo:** `lib/queries/base-cte-light.ts`

**Mesmas modificações:**

- Linha 19: adicionar `AND m.data >= '2024-01-01'`
- Linha 49: adicionar `AND m.data >= '2024-01-01'`

---

## 🔍 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    BASE-CTE.TS (PRINCIPAL)                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │ WHERE m.codsetordestino = 48 ← SETOR FINANCEIRO   │     │
│  │   AND m.RegAtual = 1                              │     │
│  │   AND m.data >= '2024-01-01' ← ADICIONAR AQUI    │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↓ (usa)
                           ↓
┌──────────────────┬──────────────────┬───────────────────┐
│  protocolos.ts   │  kpis-optimized  │   analytics.ts    │
│   (listagem)     │     (KPIs)       │    (gráficos)     │
│                  │                  │                   │
│ Usa indiretamente│ Usa indiretamente│ Usa indiretamente │
│ através da CTE   │ através da CTE   │ através da CTE    │
└──────────────────┴──────────────────┴───────────────────┘
```

---

## 📋 Checklist de Modificação

Para filtrar dados antigos (exemplo: somente 2024+):

- [ ] Modificar `lib/queries/base-cte.ts` linha 18-21 (ProtocolosAtuaisNoSetor)
- [ ] Modificar `lib/queries/base-cte.ts` linha 37 (MovimentacoesFinanceiro)
- [ ] Modificar `lib/queries/base-cte.ts` linha 54 (SetorAtual)
- [ ] Modificar `lib/queries/base-cte-light.ts` linha 19 (ProtocolosAtuaisNoSetor)
- [ ] Modificar `lib/queries/base-cte-light.ts` linha 49 (WHERE do FROM principal)
- [ ] Testar aplicação
- [ ] Verificar se KPIs estão corretos
- [ ] Verificar se listagem está correta

---

## 💡 Recomendação

**Qual data usar?**

Baseado na análise dos dados:

```
Distribuição de protocolos por ano:
- 2021: 26 protocolos
- 2022: 315 protocolos
- 2023: 8.726 protocolos
- 2024: 16.870 protocolos
- 2025: 28.708 protocolos (até novembro)
```

**Opções:**

1. **`>= '2024-01-01'`** - Se o setor começou em 2024
2. **`>= '2024-11-01'`** - Se o setor começou em novembro de 2024
3. **`>= '2025-01-01'`** - Se o setor começou em 2025
4. **`>= DATEADD(YEAR, -1, GETDATE())`** - Últimos 12 meses (dinâmico)

**Pergunta para você:** Quando o setor de Gerência Financeira realmente começou?

---

## 🚀 Próximos Passos

1. **Você decide:** Qual data usar como filtro?
2. **Eu modifico:** Os arquivos `base-cte.ts` e `base-cte-light.ts`
3. **Testamos:** Verificar se os dados fazem sentido
4. **Documentamos:** Criar registro da mudança

---

**Criado em:** 24/11/2025
**Arquivos principais:**

- `lib/queries/base-cte.ts` (CRÍTICO - modifica aqui)
- `lib/queries/base-cte-light.ts` (IMPORTANTE - modifica aqui também)
