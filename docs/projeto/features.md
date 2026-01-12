# Funcionalidades - Protocolos Dashboard FADEX

## 1. Paginas/Telas

### 1.1 Dashboard Principal (`/`)

**Funcionalidades:**

- Filtro de Setor (com opcao "Todos os Setores" - visao macro)
- Filtro de Periodo de Analise (Mes Atual, 30d, 90d, 6m, Ano Atual, Ultimo Ano, Todos)
- KPIs em tempo real:
  - Total Em Andamento
  - Novos no Mes
  - Media de Permanencia (min/max)
  - Alertas por faixa de tempo
- Grafico de Fluxo Temporal (entradas vs saidas)
- Grafico Comparativo (ano a ano)
- Exportacao em Excel e PDF

---

### 1.2 Listagem de Protocolos (`/protocolos`)

**Funcionalidades:**

- Tabela paginada (20 itens por pagina)
- Filtros avancados:
  - Status (Em Andamento, Finalizado, Historico)
  - Numero do Documento
  - Numero do Convenio
  - Faixa de Tempo
  - Setor Atual
  - Assunto
  - Conta Corrente
  - Dia da Semana
  - Hora
- Toggle "Excluir Lote de Pagamento"
- Ordenacao por multiplas colunas
- Exportacao (CSV, Excel, PDF)
- Cache instantaneo para resposta rapida

**Colunas da Tabela:**
| Coluna | Descricao |
|--------|-----------|
| Numero | Numero do documento |
| Assunto | Tipo/assunto do protocolo |
| Remetente | Origem do documento |
| Status | Em Andamento/Finalizado/Historico |
| Setor Atual | Setor onde esta o protocolo |
| Data Entrada | Data de entrada no sistema |
| Dias | Tempo de tramitacao |

---

### 1.3 Detalhe do Protocolo (`/protocolos/[id]`)

**Abas Disponiveis:**

1. **Historico**
   - Timeline completa de movimentacoes
   - Setor origem → Setor destino
   - Data e hora de cada movimentacao
   - Usuario que enviou/recebeu

2. **Financeiro**
   - Lancamentos financeiros vinculados
   - Valor bruto e liquido
   - Status (liberado, cancelado)
   - Nota fiscal

3. **Relacionamentos**
   - Protocolos filhos (derivados)
   - Protocolos mae (origem)
   - Arvore hierarquica

4. **Tramitacao**
   - Resumo de tempo por setor
   - Idade total do protocolo
   - Quantidade de movimentacoes
   - Setores visitados

5. **Detalhes**
   - Dados basicos do protocolo
   - Situacao atual
   - Informacoes do cadastro

**Cards de Resumo:**

- Protocolo (numero, data)
- Status atual
- Assunto
- Remetente/Interessado
- Usuario que cadastrou
- Projeto/Convenio
- Conta Corrente

---

### 1.4 Analise por Assunto (`/analises/por-assunto`)

**Funcionalidades:**

- Tabela agrupada por assunto
- Metricas por assunto:
  - Total de protocolos
  - Em Andamento
  - Finalizados
  - Media de dias
  - Min/Max dias
  - Desvio padrao

---

### 1.5 Analise por Projeto (`/analises/por-projeto`)

**Funcionalidades:**

- Grafico de barras: Top projetos
- Heatmap interativo: Dia da semana x Hora
- Clique no heatmap navega para movimentacoes filtradas

---

### 1.6 Movimentacoes por Dia/Hora (`/protocolos/movimentacoes`)

**Funcionalidades:**

- Acesso via clique no heatmap
- Filtros: Dia da semana, Hora do dia
- Dados dos ultimos 6 meses
- Tabela com detalhes das movimentacoes

---

### 1.7 Configuracoes (`/configuracoes`)

**Opcoes Configuraveis:**

| Categoria  | Opcoes                                  |
| ---------- | --------------------------------------- |
| Dashboard  | Periodo padrao, Auto-refresh, Intervalo |
| Tabelas    | Registros por pagina, Ordenacao         |
| Graficos   | Animacoes, Legendas                     |
| Exportacao | Formato padrao, Timestamp               |

---

## 2. Componentes de Funcionalidade

### 2.1 Sistema de Filtros

**Filtros Disponiveis:**

| Filtro           | Tipo           | Descricao                               |
| ---------------- | -------------- | --------------------------------------- |
| Status           | Select         | Em Andamento, Finalizado, Historico     |
| Numero Documento | Input          | Busca por prefixo                       |
| Numero Convenio  | Input numerico | Filtro por projeto                      |
| Faixa de Tempo   | Select         | Ate 15d, 15-30d, 30-90d, 90-180d, >180d |
| Setor Atual      | Select         | Dropdown dinamico                       |
| Assunto          | Select         | Dropdown dinamico                       |
| Conta Corrente   | Select         | Dropdown dinamico                       |
| Dia da Semana    | Select         | 1 (Dom) a 7 (Sab)                       |
| Hora             | Select         | 0 a 23                                  |
| Excluir Lote     | Toggle         | Exclui "LOTE DE PAGAMENTOS"             |

---

### 2.2 Graficos

| Grafico        | Tipo    | Biblioteca | Uso                 |
| -------------- | ------- | ---------- | ------------------- |
| Fluxo Temporal | Area    | Recharts   | Entradas vs Saidas  |
| Comparativo    | Bar     | Recharts   | Ano a ano           |
| Heatmap        | Heatmap | Nivo       | Dia x Hora          |
| Por Assunto    | Bar     | Nivo       | Top assuntos        |
| Por Projeto    | Bar     | Nivo       | Top projetos        |
| Fluxo Setores  | Sankey  | Nivo       | Fluxo entre setores |
| Distribuicao   | Pie     | Nivo       | Por faixa de tempo  |

---

### 2.3 Exportacao

**Formatos Suportados:**

| Formato | Biblioteca        | Extensao |
| ------- | ----------------- | -------- |
| CSV     | PapaParse         | .csv     |
| Excel   | ExcelJS           | .xlsx    |
| PDF     | jsPDF + AutoTable | .pdf     |

**Recursos:**

- Exportacao sob demanda
- Timestamp opcional no nome do arquivo
- Toast de confirmacao

---

### 2.4 Timeline de Movimentacoes

**Recursos:**

- Visualizacao cronologica
- Icones por tipo de setor
- Informacoes de usuario (enviou/recebeu)
- Tempo entre movimentacoes

---

## 3. APIs/Endpoints

### 3.1 Protocolos

| Endpoint                           | Metodo | Descricao                       |
| ---------------------------------- | ------ | ------------------------------- |
| `/api/protocolos`                  | GET    | Lista paginada com filtros      |
| `/api/protocolos/cached`           | GET    | Lista do cache (instantaneo)    |
| `/api/protocolos/cached/status`    | GET    | Status do cache                 |
| `/api/protocolos/[id]`             | GET    | Detalhe basico                  |
| `/api/protocolos/[id]/completo`    | GET    | Dados enriquecidos (17 queries) |
| `/api/protocolos/[id]/timeline`    | GET    | Historico de movimentacoes      |
| `/api/protocolos/[id]/vinculos`    | GET    | Relacionamentos mae/filho       |
| `/api/protocolos/por-movimentacao` | GET    | Filtrado por dia/hora           |
| `/api/protocolos/estagnados`       | GET    | Protocolos >365 dias parados    |

---

### 3.2 KPIs

| Endpoint    | Metodo | Descricao       |
| ----------- | ------ | --------------- |
| `/api/kpis` | GET    | KPIs principais |

**Parametros:**

- `periodo`: mes_atual, 30d, 90d, 6m, 1y, ytd, all
- `setor`: codigo do setor (0 = todos)

**Resposta:**

```json
{
  "totalEmAndamento": 150,
  "novosMesAtual": 42,
  "mediaDiasFinanceiro": 12.5,
  "minDiasFinanceiro": 1,
  "maxDiasFinanceiro": 85,
  "emDiaMenos15Dias": 100,
  "urgentes15a30Dias": 35,
  "criticosMais30Dias": 15
}
```

---

### 3.3 Analytics

| Endpoint                       | Metodo | Descricao            |
| ------------------------------ | ------ | -------------------- |
| `/api/analytics/temporal`      | GET    | Serie temporal       |
| `/api/analytics/por-assunto`   | GET    | Agrupado por assunto |
| `/api/analytics/por-projeto`   | GET    | Agrupado por projeto |
| `/api/analytics/distribuicao`  | GET    | Por faixa de tempo   |
| `/api/analytics/heatmap`       | GET    | Dia x Hora           |
| `/api/analytics/fluxo-setores` | GET    | Fluxo Sankey         |
| `/api/analytics/comparativo`   | GET    | Comparativo anual    |

---

### 3.4 Outros

| Endpoint                     | Metodo | Descricao                 |
| ---------------------------- | ------ | ------------------------- |
| `/api/setores`               | GET    | Lista de setores          |
| `/api/admin/qualidade-dados` | GET    | Estatisticas de qualidade |
| `/api/health`                | GET    | Health check              |
| `/api/test-connection`       | GET    | Teste de conexao BD       |

---

## 4. Regras de Negocio

### 4.1 Status do Protocolo

| Status       | Descricao               | Cor   |
| ------------ | ----------------------- | ----- |
| Em Andamento | Protocolo em tramitacao | Azul  |
| Finalizado   | Protocolo concluido     | Verde |
| Historico    | Protocolo arquivado     | Cinza |

---

### 4.2 Faixas de Tempo

| Faixa | Dias   | Classificacao |
| ----- | ------ | ------------- |
| 1     | 0-15   | Em dia        |
| 2     | 15-30  | Urgente       |
| 3     | 30-90  | Critico       |
| 4     | 90-180 | Muito critico |
| 5     | >180   | Estagnado     |

---

### 4.3 Setores Especiais

| Setor             | Codigo | Funcao                   |
| ----------------- | ------ | ------------------------ |
| Financeiro        | 48     | Processamento financeiro |
| Arquivo           | 52     | Destino final            |
| Juridico          | 5      | Analise juridica         |
| Gerencia Projetos | 40     | Porta de entrada         |
| Secretaria        | 44     | Porta de entrada         |

---

### 4.4 Inferencia de Situacao

Quando `codSituacaoProt = NULL`, o sistema infere:

| Setor Destino                     | Situacao Inferida       |
| --------------------------------- | ----------------------- |
| 25, 51, 52, 53, 54, 55 (Arquivos) | Arquivado               |
| 5 (Juridico)                      | Encaminhado ao Juridico |
| 40 (Gerencia Projetos)            | Em Analise              |
| Outros                            | Recebido                |

---

### 4.5 Exclusao de Lote de Pagamento

Por padrao, protocolos com assunto "LOTE DE PAGAMENTOS" sao excluidos das listagens para evitar poluicao visual (sao protocolos internos do sistema).

---

### 4.6 Protocolo Estagnado

Protocolo e considerado **estagnado** quando:

- Mais de 365 dias sem movimentacao
- Status ainda "Em Andamento"

---

### 4.7 Relacionamentos de Protocolo

| Tipo       | Descricao                         |
| ---------- | --------------------------------- |
| Filho      | Protocolo derivado de outro       |
| Mae        | Protocolo que originou outros     |
| Financeiro | Vinculo com lancamento financeiro |

---

## 5. Cache e Performance

### 5.1 Niveis de Cache

| Nivel      | staleTime | gcTime | Uso                  |
| ---------- | --------- | ------ | -------------------- |
| REAL_TIME  | 5 min     | 10 min | KPIs, contadores     |
| STANDARD   | 2 min     | 5 min  | Listas, filtros      |
| ANALYTICS  | 10 min    | 20 min | Graficos             |
| HISTORICAL | 30 min    | 60 min | Heatmap, comparativo |

---

### 5.2 Cache do Servidor

- **Capacidade**: 50.000 protocolos
- **Refresh**: Automatico a cada 5 minutos
- **Inicializacao**: Primeira requisicao carrega dados
- **Filtro**: Aplicado em memoria (instantaneo)

---

### 5.3 Otimizacoes

- `COUNT(*) OVER()` para evitar 2 queries
- Lazy loading de graficos
- Queries paralelas no detalhe do protocolo
- Indices otimizados no SQL Server

---

## 6. Validacao de Dados

### 6.1 Filtros (Zod Schema)

```typescript
{
  status: "Em Andamento" | "Finalizado" | "Historico",
  numeroDocumento: string (opcional),
  numconv: number positivo (opcional),
  faixaTempo: string (opcional),
  setorAtual: number positivo (opcional),
  page: number (default: 1),
  pageSize: number (max: 50000, default: 20),
  sortOrder: "asc" | "desc"
}
```

---

### 6.2 Tratamento de Erros

Todos os endpoints retornam erro padronizado:

```json
{
  "success": false,
  "error": "Mensagem de erro",
  "statusCode": 400,
  "details": []
}
```

---

## 7. Hooks Customizados

| Hook                       | Funcao                         |
| -------------------------- | ------------------------------ |
| `useKPIs()`                | Busca KPIs com periodo e setor |
| `useProtocolos()`          | Lista de protocolos            |
| `useCachedProtocolos()`    | Lista do cache                 |
| `useFluxoTemporal()`       | Dados do grafico temporal      |
| `useDistribuicaoFaixa()`   | Distribuicao por faixa         |
| `useAnalyticsPorAssunto()` | Top assuntos                   |
| `useAnalyticsPorProjeto()` | Top projetos                   |
| `useFluxoSetores()`        | Fluxo Sankey                   |
| `useHeatmap()`             | Dados do heatmap               |
| `useComparativo()`         | Comparativo anual              |
| `useSetores()`             | Lista de setores               |
| `useTimeline()`            | Timeline de movimentacoes      |
| `usePreferences()`         | Preferencias do usuario        |

---

## 8. Seguranca

### 8.1 Implementado

- Validacao Zod em todos endpoints
- Parametrizacao SQL (previne injection)
- Headers de seguranca (X-Frame-Options, etc)
- Exclusao logica (deletado = 0)

### 8.2 Nao Implementado

- Autenticacao de usuarios
- Controle de acesso por perfil
- Rate limiting
- Auditoria de acesso

---

_Documentacao gerada em: 12/01/2026_
