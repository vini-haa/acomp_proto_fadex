# Guia de Testes - Dashboard Protocolos FADEX

## 🎯 Fase 2: Backend e API - COMPLETA

### Componentes Implementados

✅ **Infraestrutura:**

- Módulo de conexão SQL Server com pool (`lib/db.ts`)
- Sistema de tratamento de erros (`lib/errors.ts`)
- Tipos TypeScript completos (`types/`)
- Schemas Zod para validação (`lib/schemas/`)
- Queries SQL organizadas (`lib/queries/`)

✅ **API Routes (12 endpoints):**

- 1 endpoint de KPIs
- 4 endpoints de protocolos
- 6 endpoints de analytics
- 1 endpoint de alertas

---

## 📋 Checklist de Testes

### ⚠️ Pré-requisitos

Antes de testar as APIs, certifique-se de:

1. **Banco de Dados Configurado:**

   ```bash
   # Execute o script SQL
   # database/create_view_protocolos_financeiro.sql
   ```

2. **Variáveis de Ambiente:**

   ```bash
   # Edite .env.local com suas credenciais
   DB_SERVER=seu_servidor
   DB_DATABASE=FADEX
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   ```

3. **Servidor em Execução:**
   ```bash
   npm run dev
   ```

---

## 🔍 Testes de API Routes

### Método 1: Navegador (GET requests simples)

Abra o navegador e acesse as URLs abaixo:

#### 1. **GET /api/kpis**

```
http://localhost:3000/api/kpis
```

**Espera-se:**

- Status: 200
- JSON com 7 KPIs (totalEmAndamento, finalizadosMesAtual, etc.)

---

#### 2. **GET /api/protocolos**

```
http://localhost:3000/api/protocolos
```

**Espera-se:**

- Status: 200
- JSON com array de protocolos + informações de paginação
- Campos: codprot, numeroDocumento, assunto, statusProtocolo, etc.

**Testando filtros:**

```
http://localhost:3000/api/protocolos?status=Em%20Andamento
http://localhost:3000/api/protocolos?page=2&pageSize=10
http://localhost:3000/api/protocolos?faixaTempo=01.%20Até%205%20dias
```

---

#### 3. **GET /api/protocolos/[id]**

```
http://localhost:3000/api/protocolos/123
```

**Espera-se:**

- Status: 200 (se existir) ou 404 (se não existir)
- JSON com detalhes completos do protocolo

**Substitua 123 por um ID válido do seu banco**

---

#### 4. **GET /api/protocolos/[id]/timeline**

```
http://localhost:3000/api/protocolos/123/timeline
```

**Espera-se:**

- Status: 200
- Array de movimentações ordenadas por data
- Campos: dataMovimentacao, setorOrigem, setorDestino, tipoMovimentacao

---

#### 5. **GET /api/analytics/temporal**

```
http://localhost:3000/api/analytics/temporal
```

**Espera-se:**

- Status: 200
- Array de períodos (últimos 12 meses)
- Campos: periodo, qtdEntradas, qtdSaidas, saldoPeriodo, saldoAcumulado

---

#### 6. **GET /api/analytics/distribuicao**

```
http://localhost:3000/api/analytics/distribuicao
```

**Espera-se:**

- Status: 200
- Array com distribuição por faixa de tempo
- Campos: faixaTempo, statusProtocolo, quantidade, percentual

---

#### 7. **GET /api/analytics/por-assunto**

```
http://localhost:3000/api/analytics/por-assunto
```

**Espera-se:**

- Status: 200
- Array de assuntos com estatísticas
- Campos: assunto, totalProtocolos, emAndamento, finalizados, mediaDiasFinalizado

---

#### 8. **GET /api/analytics/por-projeto**

```
http://localhost:3000/api/analytics/por-projeto
```

**Espera-se:**

- Status: 200
- Array de projetos/convênios com estatísticas
- Campos: numconv, projeto, instituicao, totalProtocolos, mediaDias

---

#### 9. **GET /api/analytics/fluxo-setores**

```
http://localhost:3000/api/analytics/fluxo-setores
```

**Espera-se:**

- Status: 200
- Array com fluxo entre setores
- Campos: setorOrigem, setorDestino, quantidade, mediaDias, rapidos, demorados

---

#### 10. **GET /api/analytics/heatmap**

```
http://localhost:3000/api/analytics/heatmap
```

**Espera-se:**

- Status: 200
- Array com dados de dia/hora
- Campos: diaSemana, diaSemanaNum, hora, quantidade

---

#### 11. **GET /api/analytics/comparativo**

```
http://localhost:3000/api/analytics/comparativo
```

**Espera-se:**

- Status: 200
- Array com 2 itens (atual e ano_anterior)
- Campos: periodo, total, finalizados, mediaDias, varTotalPct, varMediaDiasPct

---

#### 12. **GET /api/alertas**

```
http://localhost:3000/api/alertas
```

**Espera-se:**

- Status: 200
- Array de protocolos críticos ordenados por urgência
- Campos: codprot, numeroDocumento, diasNoFinanceiro, nivelUrgencia, descricaoUrgencia, corStatus

---

### Método 2: cURL (Terminal)

```bash
# Teste básico de KPIs
curl http://localhost:3000/api/kpis

# Teste com filtros
curl "http://localhost:3000/api/protocolos?status=Em%20Andamento&page=1&pageSize=5"

# Teste de protocolo específico (substitua 123 por ID válido)
curl http://localhost:3000/api/protocolos/123

# Teste de alertas
curl http://localhost:3000/api/alertas
```

---

### Método 3: Postman / Thunder Client / Insomnia

1. Importe a coleção abaixo:

```json
{
  "name": "Dashboard Protocolos FADEX",
  "requests": [
    {
      "name": "GET KPIs",
      "method": "GET",
      "url": "http://localhost:3000/api/kpis"
    },
    {
      "name": "GET Protocolos",
      "method": "GET",
      "url": "http://localhost:3000/api/protocolos"
    },
    {
      "name": "GET Protocolo por ID",
      "method": "GET",
      "url": "http://localhost:3000/api/protocolos/123"
    },
    {
      "name": "GET Timeline",
      "method": "GET",
      "url": "http://localhost:3000/api/protocolos/123/timeline"
    },
    {
      "name": "GET Analytics - Temporal",
      "method": "GET",
      "url": "http://localhost:3000/api/analytics/temporal"
    },
    {
      "name": "GET Analytics - Distribuição",
      "method": "GET",
      "url": "http://localhost:3000/api/analytics/distribuicao"
    },
    {
      "name": "GET Analytics - Por Assunto",
      "method": "GET",
      "url": "http://localhost:3000/api/analytics/por-assunto"
    },
    {
      "name": "GET Analytics - Por Projeto",
      "method": "GET",
      "url": "http://localhost:3000/api/analytics/por-projeto"
    },
    {
      "name": "GET Analytics - Fluxo Setores",
      "method": "GET",
      "url": "http://localhost:3000/api/analytics/fluxo-setores"
    },
    {
      "name": "GET Analytics - Heatmap",
      "method": "GET",
      "url": "http://localhost:3000/api/analytics/heatmap"
    },
    {
      "name": "GET Analytics - Comparativo",
      "method": "GET",
      "url": "http://localhost:3000/api/analytics/comparativo"
    },
    {
      "name": "GET Alertas",
      "method": "GET",
      "url": "http://localhost:3000/api/alertas"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Erro: "Falha na conexão com o banco de dados"

- Verifique se o SQL Server está rodando
- Confirme as credenciais no `.env.local`
- Teste a conexão manualmente com SQL Server Management Studio

### Erro: "View 'vw_ProtocolosFinanceiro' não encontrada"

- Execute o script `database/create_view_protocolos_financeiro.sql`
- Verifique se o usuário tem permissão para acessar a view

### Erro 404 em rotas da API

- Confirme que o servidor está rodando (`npm run dev`)
- Verifique a URL (porta correta, caminho correto)

### Dados vazios nas respostas

- A view pode não ter dados para o período consultado
- Ajuste os filtros de data nas queries se necessário

---

## ✅ Páginas Testáveis Atualmente

### Páginas Funcionais:

- ✅ **/** - Dashboard principal (exibe mensagem de boas-vindas)

### Páginas com 404 (a serem implementadas na Fase 3-5):

- ❌ **/protocolos** - Listagem de protocolos
- ❌ **/protocolos/[id]** - Detalhe do protocolo
- ❌ **/alertas** - Alertas críticos
- ❌ **/analises/temporal** - Análise temporal
- ❌ **/analises/por-assunto** - Análise por assunto
- ❌ **/analises/por-projeto** - Análise por projeto
- ❌ **/analises/por-setor** - Fluxo entre setores

### APIs Funcionais (testáveis via navegador/curl/Postman):

- ✅ **GET /api/kpis**
- ✅ **GET /api/protocolos**
- ✅ **GET /api/protocolos/[id]**
- ✅ **GET /api/protocolos/[id]/timeline**
- ✅ **GET /api/analytics/temporal**
- ✅ **GET /api/analytics/distribuicao**
- ✅ **GET /api/analytics/por-assunto**
- ✅ **GET /api/analytics/por-projeto**
- ✅ **GET /api/analytics/fluxo-setores**
- ✅ **GET /api/analytics/heatmap**
- ✅ **GET /api/analytics/comparativo**
- ✅ **GET /api/alertas**

---

## 🚀 Próximos Passos

**Fase 3: Dashboard KPIs**

- Consumir API `/api/kpis` no frontend
- Criar 7 cards de KPIs
- Hooks customizados (useKPIs)
- Loading states e error handling

---

**Desenvolvido para o Setor Financeiro FADEX** 💙
