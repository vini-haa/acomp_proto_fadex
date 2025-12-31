# Guia Rápido - Dashboard de Protocolos FADEX

## 🚀 Início Rápido

### Iniciar Aplicação

```bash
cd "/home/vinicius/Documentos/portal_fadex/portal fadex/Protocolos_acomp"
npm run dev
```

### URLs de Acesso

- **Local**: http://localhost:3000
- **Rede**: http://192.168.3.28:3000

### Parar Aplicação

```bash
# Encontrar processo
ps aux | grep next

# Matar processo (substitua PID)
kill [PID]

# Ou Ctrl+C no terminal onde npm run dev está rodando
```

---

## 📊 Páginas Disponíveis

| Rota                    | Descrição              | Componentes Principais                         |
| ----------------------- | ---------------------- | ---------------------------------------------- |
| `/`                     | Dashboard principal    | KPIs, FluxoTemporal, Distribuição, Comparativo |
| `/protocolos`           | Listagem de protocolos | Filtros, Tabela paginada                       |
| `/protocolos/[id]`      | Detalhes do protocolo  | Cards de info, Timeline                        |
| `/alertas`              | Alertas críticos       | Cards de urgência, Lista detalhada             |
| `/analises/temporal`    | Análise temporal       | Gráfico de área com seletor                    |
| `/analises/por-assunto` | Top assuntos           | BarChart, PieChart                             |
| `/analises/por-projeto` | Top projetos           | BarChart, FluxoTemporal                        |
| `/analises/por-setor`   | Fluxo entre setores    | Sankey, Heatmap                                |

---

## 🔌 Endpoints API

### KPIs

```bash
GET /api/kpis
# Retorna: 7 KPIs principais
```

### Protocolos

```bash
# Listagem paginada
GET /api/protocolos?page=1&pageSize=20&sortBy=dtEntrada&sortOrder=desc

# Com filtros
GET /api/protocolos?page=1&pageSize=20&status=Em%20andamento&assunto=Nota

# Detalhes
GET /api/protocolos/12345

# Timeline
GET /api/protocolos/12345/timeline
```

### Alertas

```bash
GET /api/alertas
# Retorna: Protocolos com níveis de urgência
```

### Analytics

```bash
# Temporal
GET /api/analytics/temporal?periodo=30d
# Períodos: 7d, 30d, 90d, 12m

# Distribuição
GET /api/analytics/distribuicao

# Por Assunto
GET /api/analytics/por-assunto?limit=15

# Por Projeto
GET /api/analytics/por-projeto?limit=15

# Fluxo Setores
GET /api/analytics/fluxo-setores?limit=20

# Heatmap
GET /api/analytics/heatmap

# Comparativo
GET /api/analytics/comparativo
```

---

## 🧪 Testes

### Testar Todos os Endpoints

```bash
./test-all-endpoints.sh
```

### Testar Endpoint Específico

```bash
# KPIs
curl http://localhost:3000/api/kpis | jq

# Protocolos (primeiro protocolo)
curl "http://localhost:3000/api/protocolos?page=1&pageSize=1" | jq

# Alertas
curl http://localhost:3000/api/alertas | jq

# Temporal (30 dias)
curl "http://localhost:3000/api/analytics/temporal?periodo=30d" | jq
```

### Testar Página

```bash
# Verificar se página carrega (200 OK)
curl -I http://localhost:3000/
curl -I http://localhost:3000/protocolos
curl -I http://localhost:3000/alertas
```

---

## 🗄️ Banco de Dados

### Configuração Atual (.env.local)

```env
DB_SERVER=192.168.3.22
DB_PORT=1433
DB_DATABASE=fade1
DB_USER=vinicius
DB_PASSWORD='@V1n1#'
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### Testar Conexão

```bash
# Via API
curl http://localhost:3000/api/test-connection

# Via Script Node
node test-db-connection.js
```

### Query Principal

```sql
-- View usada por toda aplicação
SELECT * FROM vw_ProtocolosFinanceiro
WHERE codigo_setor_atual = 48 -- Financeiro
ORDER BY dt_entrada DESC;
```

---

## 🛠️ Comandos Úteis

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em dev mode (hot reload)
npm run dev

# Build para produção
npm run build

# Rodar produção
npm start

# Linting
npm run lint
```

### Limpeza de Cache

```bash
# Limpar cache do Next.js
rm -rf .next

# Limpar node_modules
rm -rf node_modules package-lock.json
npm install

# Limpar tudo
rm -rf .next node_modules package-lock.json
npm install
```

### Git (se necessário)

```bash
# Status
git status

# Adicionar mudanças
git add .

# Commit
git commit -m "feat: descrição da mudança"

# Ver histórico
git log --oneline
```

---

## 🐛 Troubleshooting

### Erro: Porta 3000 já está em uso

```bash
# Encontrar processo usando porta 3000
lsof -i :3000

# Matar processo
kill -9 [PID]

# Ou usar outra porta
PORT=3001 npm run dev
```

### Erro: Não consegue conectar ao banco

```bash
# 1. Verificar se banco está acessível
ping 192.168.3.22

# 2. Testar conexão SQL
node test-db-connection.js

# 3. Verificar .env.local
cat .env.local
```

### Erro: Módulo não encontrado

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Página não carrega ou tela branca

```bash
# 1. Verificar console do navegador (F12)
# 2. Verificar logs do terminal onde npm run dev está rodando
# 3. Limpar cache do Next.js
rm -rf .next
npm run dev
```

### Dados não aparecem nos gráficos

```bash
# 1. Verificar API no navegador
# http://localhost:3000/api/analytics/temporal?periodo=30d

# 2. Verificar logs do servidor
# Procurar por "❌ Erro ao executar query"

# 3. Testar query diretamente no SQL Server
# Usar SQL Server Management Studio
```

---

## 📝 Logs

### Ver Logs da Aplicação

```bash
# Logs aparecem no terminal onde npm run dev está rodando
# Para salvar em arquivo:
npm run dev > app.log 2>&1
```

### Logs Importantes

```
✅ Conexão com SQL Server estabelecida
   → Conexão OK

❌ Erro ao executar query: [...]
   → Problema com SQL

GET /api/kpis 200 in 1580ms
   → Request bem-sucedido (200) em 1.58s

GET /api/kpis 500 in 100ms
   → Request com erro (500)

✓ Compiled /page in 4.4s
   → Página compilada com sucesso
```

---

## 🔐 Variáveis de Ambiente

### Arquivo: `.env.local`

```env
# Database Connection
DB_SERVER=192.168.3.22
DB_PORT=1433
DB_DATABASE=fade1
DB_USER=vinicius
DB_PASSWORD='@V1n1#'
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Optional: Debug SQL queries
# DEBUG=mssql:*
```

**⚠️ IMPORTANTE**: Nunca commitar `.env.local` para repositório Git!

---

## 📦 Estrutura de Arquivos Importantes

```
📁 Protocolos_acomp/
├── 📄 .env.local              ← Configuração do banco
├── 📄 package.json            ← Dependências
├── 📄 next.config.ts          ← Config Next.js
├── 📄 tailwind.config.ts      ← Config Tailwind
├── 📄 tsconfig.json           ← Config TypeScript
│
├── 📁 app/
│   ├── 📁 (dashboard)/        ← Páginas principais
│   └── 📁 api/                ← API Routes
│
├── 📁 components/
│   ├── 📁 dashboard/          ← Componentes do dashboard
│   ├── 📁 charts/             ← Gráficos
│   ├── 📁 tables/             ← Tabelas
│   └── 📁 ui/                 ← shadcn/ui components
│
├── 📁 hooks/                  ← React Query hooks
├── 📁 lib/                    ← Utilitários e DB
├── 📁 types/                  ← TypeScript types
│
├── 📄 DOCUMENTACAO_TECNICA.md ← Documentação completa
├── 📄 ARQUITETURA.md          ← Diagrama de arquitetura
└── 📄 GUIA_RAPIDO.md          ← Este arquivo
```

---

## 🎨 Componentes UI Principais

### shadcn/ui Components

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
```

### Custom Components

```typescript
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProtocolosTable } from "@/components/tables/ProtocolosTable";
import { ProtocoloFilters } from "@/components/filters/ProtocoloFilters";
```

---

## 📊 KPIs Disponíveis

1. **Total Em Andamento** - Protocolos ativos no setor
2. **Total Finalizados (Últimos 30 dias)** - Protocolos concluídos
3. **Média de Dias no Financeiro** - Tempo médio de permanência
4. **Protocolos Críticos (>30 dias)** - Alertas de atraso
5. **Taxa de Finalização Mensal** - Percentual de conclusão
6. **Protocolos Recebidos (Últimos 7 dias)** - Entradas recentes
7. **Tempo Médio de Finalização** - Duração média até conclusão

---

## 🎯 Níveis de Urgência (Alertas)

| Nível | Label   | Cor      | Emoji | Critério          |
| ----- | ------- | -------- | ----- | ----------------- |
| 4     | Crítico | Vermelho | 🔴    | >60 dias no setor |
| 3     | Alto    | Laranja  | 🟠    | 46-60 dias        |
| 2     | Médio   | Amarelo  | 🟡    | 31-45 dias        |
| 1     | Baixo   | Azul     | 🔵    | 21-30 dias        |

---

## ⚡ Performance

### Tempos de Resposta Esperados

```
/api/kpis             → 1-2s
/api/protocolos       → 3-4s (paginado)
/api/alertas          → 5s
/api/analytics/*      → 1-6s (varia por query)
```

### Cache Strategy

```
KPIs              → Cache: 5 min, Auto-refresh: 5 min
Protocolos        → Cache: 1 min, Manual refresh
Alertas           → Cache: 1 min, Auto-refresh: 1 min
Analytics         → Cache: 30s-5min (varia)
```

---

## 🔄 Auto-Refresh

### Páginas com Auto-Refresh

- **Alertas**: Atualiza a cada 1 minuto
- **KPIs**: Atualiza a cada 5 minutos

### Desabilitar Auto-Refresh

Editar o hook correspondente e remover `refetchInterval`:

```typescript
// hooks/useAlertas.ts
export function useAlertas() {
  return useQuery<AlertaItem[]>({
    queryKey: ["alertas"],
    queryFn: async () => {
      /* ... */
    },
    staleTime: 60 * 1000,
    // refetchInterval: 60 * 1000, // ← Comentar esta linha
  });
}
```

---

## 🌐 Navegação

### Sidebar

```
📊 Dashboard          → /
📋 Protocolos         → /protocolos
🚨 Alertas           → /alertas
📈 Análises
   ├─ Temporal        → /analises/temporal
   ├─ Por Assunto     → /analises/por-assunto
   ├─ Por Projeto     → /analises/por-projeto
   └─ Por Setor       → /analises/por-setor
```

---

## 🆘 Suporte

### Documentação Completa

- `DOCUMENTACAO_TECNICA.md` - Referência técnica completa
- `ARQUITETURA.md` - Diagramas e fluxos de dados
- `README.md` - Overview do projeto
- `TESTING.md` - Guia de testes

### Logs de Desenvolvimento

- Logs aparecem no terminal onde `npm run dev` está rodando
- Console do navegador (F12) para erros client-side
- Network tab (F12) para ver requisições HTTP

### Contato

- Desenvolvido por: Claude (Anthropic)
- Para: Vinicius - FADEX
- Ambiente: Homologação (192.168.3.22)

---

## ✅ Checklist de Deploy

### Antes de Deploy em Produção

- [ ] Atualizar variáveis de ambiente (.env.production)
- [ ] Rodar `npm run build` sem erros
- [ ] Testar todos endpoints (test-all-endpoints.sh)
- [ ] Validar conexão com banco de produção
- [ ] Configurar HTTPS
- [ ] Configurar domínio
- [ ] Setup de monitoramento (logs, APM)
- [ ] Backup de banco de dados
- [ ] Documentar processo de deploy
- [ ] Treinar equipe no uso do sistema

---

## 📱 Responsividade

O sistema é responsivo e funciona em:

- ✅ Desktop (1920x1080 e superiores)
- ✅ Laptop (1366x768)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667) - com limitações em gráficos complexos

---

## 🎨 Tema (Dark/Light)

O sistema suporta dark mode via next-themes.
Toggle no canto superior direito do Header.

Cores definidas em: `app/globals.css`

---

## 🔍 Debug Mode

### Habilitar Debug SQL

Adicionar ao `.env.local`:

```env
DEBUG=mssql:*
```

### React Query DevTools

Já está habilitado em desenvolvimento.
Ícone aparece no canto inferior da tela.

---

## 📚 Recursos Adicionais

### Documentação de Bibliotecas

- [Next.js](https://nextjs.org/docs)
- [React Query](https://tanstack.com/query/latest)
- [Recharts](https://recharts.org/)
- [Nivo](https://nivo.rocks/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### SQL Server

- [T-SQL Reference](https://docs.microsoft.com/sql/t-sql/)
- [Window Functions](https://docs.microsoft.com/sql/t-sql/queries/select-over-clause-transact-sql)

---

**Última atualização**: 21/11/2025
**Versão**: 1.0.0
**Status**: ✅ Produção
