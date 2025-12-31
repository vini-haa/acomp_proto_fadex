# Guia de Contribuição

Obrigado por contribuir com o Dashboard de Acompanhamento de Protocolos!

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18+ (recomendado: 20.x)
- pnpm ou npm
- Acesso ao SQL Server (fade1)
- Git

### Setup Inicial

```bash
# Clone o repositório
git clone https://github.com/vini-haa/acomp_proto_fadex.git
cd acomp_proto_fadex

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:3001`.

---

## Fluxo de Trabalho

### 1. Crie uma Branch

```bash
# Para novas features
git checkout -b feature/nome-da-feature

# Para correções de bugs
git checkout -b fix/descricao-do-bug

# Para melhorias de documentação
git checkout -b docs/descricao
```

### 2. Faça suas Alterações

- Siga os [Padrões de Código](#padrões-de-código)
- Escreva código limpo e tipado
- Adicione testes quando aplicável

### 3. Commit suas Mudanças

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Tipos de commit
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Documentação
style:    Formatação (não afeta código)
refactor: Refatoração
perf:     Melhoria de performance
test:     Adição/correção de testes
chore:    Tarefas de build/config

# Exemplos
git commit -m "feat: adiciona filtro por data na listagem"
git commit -m "fix: corrige paginação em protocolos"
git commit -m "docs: atualiza README com novos endpoints"
```

### 4. Pre-commit Hooks

O projeto usa Husky + lint-staged. Antes de cada commit:

1. **ESLint** verifica erros de código
2. **Prettier** formata os arquivos

Se o commit falhar, corrija os erros apontados e tente novamente.

### 5. Abra um Pull Request

- Descreva claramente as mudanças
- Referencie issues relacionadas
- Aguarde a revisão de código

---

## Padrões de Código

### TypeScript

```typescript
// SEMPRE tipar explicitamente
interface Props {
  title: string;
  count: number;
  onAction: (id: number) => void;
}

// NUNCA usar 'any'
// ❌ const data: any = fetchData();
// ✅ const data: Protocolo[] = fetchData();

// Preferir 'unknown' quando tipo é desconhecido
function parseJSON(text: string): unknown {
  return JSON.parse(text);
}
```

### Componentes React

```typescript
"use client";

import { memo, useMemo, useCallback } from "react";

interface KPICardProps {
  title: string;
  value: number;
}

// Componentes memoizados para performance
export const KPICard = memo(function KPICard({ title, value }: KPICardProps) {
  const formattedValue = useMemo(
    () => value.toLocaleString("pt-BR"),
    [value]
  );

  return (
    <div>
      <h3>{title}</h3>
      <span>{formattedValue}</span>
    </div>
  );
});
```

### API Routes

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateParams, Schema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    // 1. Validar parâmetros
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const validation = validateParams(Schema, params);

    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    // 2. Executar query
    const data = await queryDatabase(validation.data);

    // 3. Retornar resposta
    return NextResponse.json(data);
  } catch (error) {
    logger.error("Erro na API:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
```

### SQL

```typescript
// SEMPRE usar queries parametrizadas
// ❌ NUNCA faça isso:
// const query = `SELECT * FROM protocolos WHERE id = ${id}`;

// ✅ SEMPRE faça isso:
const result = await pool
  .request()
  .input("id", sql.Int, id)
  .query("SELECT * FROM protocolos WHERE id = @id");
```

---

## Estrutura de Arquivos

### Onde colocar novos arquivos

| Tipo               | Diretório               | Exemplo                               |
| ------------------ | ----------------------- | ------------------------------------- |
| Página             | `app/(dashboard)/`      | `app/(dashboard)/relatorios/page.tsx` |
| API Route          | `app/api/`              | `app/api/relatorios/route.ts`         |
| Componente UI      | `components/ui/`        | `components/ui/badge.tsx`             |
| Componente Feature | `components/[feature]/` | `components/dashboard/KPICard.tsx`    |
| Hook               | `hooks/`                | `hooks/useRelatorios.ts`              |
| Query SQL          | `lib/queries/`          | `lib/queries/relatorios.ts`           |
| Schema Zod         | `lib/validation/`       | `lib/validation/relatorios.ts`        |
| Tipo               | `types/`                | `types/relatorio.ts`                  |

### Convenções de Nomenclatura

| Tipo              | Convenção       | Exemplo             |
| ----------------- | --------------- | ------------------- |
| Componentes       | PascalCase      | `KPICard.tsx`       |
| Hooks             | camelCase + use | `useKPIs.ts`        |
| Utilitários       | camelCase       | `formatCurrency.ts` |
| Types/Interfaces  | PascalCase      | `Protocolo`         |
| Constantes        | SCREAMING_SNAKE | `TODOS_SETORES`     |
| Arquivos de route | lowercase       | `route.ts`          |

---

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev           # Inicia servidor em localhost:3001

# Build
npm run build         # Build de produção
npm run start         # Inicia build de produção

# Qualidade
npm run lint          # Verifica erros de lint
npm run lint:fix      # Corrige erros automaticamente
npm run format        # Formata código com Prettier
npm run type-check    # Verifica tipos TypeScript

# Testes
npm test              # Executa testes
npm run test:coverage # Testes com cobertura
```

---

## Checklist de PR

Antes de abrir um Pull Request, verifique:

- [ ] O código compila sem erros (`npm run build`)
- [ ] Lint passa (`npm run lint`)
- [ ] Tipos estão corretos (`npm run type-check`)
- [ ] Não há `console.log` de debug
- [ ] Não há credenciais hardcoded
- [ ] Queries SQL são parametrizadas
- [ ] Componentes pesados são memoizados
- [ ] Erros são tratados adequadamente

---

## Resolução de Problemas

### Erro de conexão com banco

1. Verifique se as credenciais em `.env` estão corretas
2. Teste a conectividade: `curl http://localhost:3001/api/health`
3. Verifique se o SQL Server está acessível na rede

### Porta 3001 em uso

```bash
lsof -ti:3001 | xargs kill -9
npm run dev
```

### Cache do Next.js corrompido

```bash
rm -rf .next
npm run dev
```

### Pre-commit hooks falhando

```bash
# Ver erros detalhados
npm run lint

# Corrigir automaticamente
npm run lint:fix

# Formatar código
npm run format
```

---

## Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zod](https://zod.dev)
- [Recharts](https://recharts.org)

---

## Dúvidas?

Abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.
