# Project Overview - Protocolos Dashboard FADEX

## Stack de Tecnologias

### Frontend

| Tecnologia       | Versao | Proposito                      |
| ---------------- | ------ | ------------------------------ |
| **Next.js**      | 15.0.0 | Framework React com App Router |
| **React**        | 19.0.0 | Biblioteca UI                  |
| **TypeScript**   | 5.x    | Tipagem estatica               |
| **Tailwind CSS** | 3.4.1  | Estilizacao utilitaria         |
| **shadcn/ui**    | -      | Componentes UI (Radix UI)      |

### Graficos e Visualizacoes

| Biblioteca   | Versao | Uso                             |
| ------------ | ------ | ------------------------------- |
| **Nivo**     | 0.99.0 | Bar, Line, Pie, Heatmap, Sankey |
| **Recharts** | 2.15.0 | Graficos complementares         |

### Gerenciamento de Estado

| Biblioteca         | Versao  | Proposito         |
| ------------------ | ------- | ----------------- |
| **TanStack Query** | 5.62.15 | Cache e fetching  |
| **TanStack Table** | 8.20.5  | Tabelas avancadas |

### Backend/Database

| Tecnologia | Versao | Proposito            |
| ---------- | ------ | -------------------- |
| **mssql**  | 11.0.1 | Driver SQL Server    |
| **Zod**    | 3.24.1 | Validacao de schemas |

### Exportacao de Dados

| Biblioteca    | Versao | Formato       |
| ------------- | ------ | ------------- |
| **jsPDF**     | 3.0.4  | PDF           |
| **ExcelJS**   | 4.4.0  | Excel (.xlsx) |
| **PapaParse** | 5.5.3  | CSV           |

### Testes e Qualidade

| Ferramenta          | Versao | Proposito             |
| ------------------- | ------ | --------------------- |
| **Vitest**          | 4.0.16 | Test runner           |
| **Testing Library** | 16.3.1 | Testes de componentes |
| **ESLint**          | 8.x    | Linting               |
| **Prettier**        | 3.4.2  | Formatacao            |
| **Husky**           | 9.1.7  | Git hooks             |

---

## Estrutura de Diretorios

```
.
├── app
│   ├── api
│   │   ├── admin
│   │   ├── analytics
│   │   ├── health
│   │   ├── kpis
│   │   ├── protocolos
│   │   ├── setores
│   │   ├── test-connection
│   │   └── test-queries
│   ├── (dashboard)
│   │   ├── analises
│   │   ├── configuracoes
│   │   ├── protocolos
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── error.tsx
│   ├── globals.css
│   ├── icon.svg
│   └── layout.tsx
├── components
│   ├── charts
│   │   ├── AssuntoBarChart.tsx
│   │   ├── ChartContainer.tsx
│   │   ├── ComparativoChart.tsx
│   │   ├── DistribuicaoFaixaChart.tsx
│   │   ├── FluxoTemporalChart.tsx
│   │   ├── HeatmapChart.tsx
│   │   ├── index.ts
│   │   ├── ProjetoBarChart.tsx
│   │   ├── SetorSankeyChart.tsx
│   │   └── StatsGrid.tsx
│   ├── dashboard
│   │   ├── CacheWarmer.tsx
│   │   ├── Header.tsx
│   │   ├── KPICards.tsx
│   │   ├── KPICard.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatusBadge.tsx
│   ├── export
│   │   └── ExportButton.tsx
│   ├── filters
│   │   ├── ProtocoloFilters
│   │   └── ProtocoloFilters.tsx
│   ├── protocolo
│   │   ├── DadosEnriquecidos.tsx
│   │   ├── index.ts
│   │   ├── LancamentosFinanceiros.tsx
│   │   ├── RelacionamentosProtocolo.tsx
│   │   ├── ResumoTramitacao.tsx
│   │   └── VinculosProtocolo.tsx
│   ├── providers
│   │   ├── query-provider.tsx
│   │   └── theme-provider.tsx
│   ├── tables
│   │   ├── AssuntoTable.tsx
│   │   ├── columns.tsx
│   │   └── ProtocolosTable.tsx
│   ├── timeline
│   │   └── ProtocoloTimeline.tsx
│   ├── ui
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── command.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── toaster.tsx
│   │   ├── toast.tsx
│   │   └── tooltip.tsx
│   └── ErrorBoundary.tsx
├── coverage
│   ├── lcov-report
│   ├── clover.xml
│   ├── coverage-final.json
│   └── lcov.info
├── database
│   ├── ANALISE_RISCOS.md
│   ├── create_performance_indexes.sql
│   ├── create-view.js
│   ├── create_view_protocolos_financeiro.sql
│   ├── create_view_safe.sql
│   ├── indices-recomendados.sql
│   ├── queries_setores_debug.sql
│   └── remove_view.sql
├── docs
│   ├── changelog
│   └── [documentacao tecnica]
├── hooks
│   ├── useAnalytics.ts
│   ├── useCachedProtocolos.ts
│   ├── useKPIs.ts
│   ├── usePreferences.ts
│   ├── useProtocolos.ts
│   ├── useSetores.ts
│   ├── useTimeline.ts
│   └── use-toast.ts
├── lib
│   ├── cache
│   │   └── protocolos-cache.ts
│   ├── config
│   │   └── performance.ts
│   ├── constants
│   │   ├── assuntos.ts
│   │   ├── cache.ts
│   │   ├── index.ts
│   │   ├── setores.ts
│   │   ├── situacoes.ts
│   │   └── sql-helpers.ts
│   ├── export
│   │   ├── csv.ts
│   │   ├── excel.ts
│   │   ├── index.ts
│   │   └── pdf.ts
│   ├── queries
│   │   ├── analytics
│   │   ├── analytics.ts
│   │   ├── base-cte-light.ts
│   │   ├── base-cte.ts
│   │   ├── filter-builder.ts
│   │   ├── index.ts
│   │   ├── kpis-optimized.ts
│   │   ├── movimentacoes.ts
│   │   ├── protocolo-enriquecido.ts
│   │   └── protocolos.ts
│   ├── schemas
│   │   ├── analytics.ts
│   │   ├── index.ts
│   │   └── protocolos.ts
│   ├── __tests__
│   ├── validation
│   │   └── protocolo.ts
│   ├── constants.ts
│   ├── db.ts
│   ├── errors.ts
│   ├── formatting.ts
│   ├── index.ts
│   ├── logger.ts
│   ├── object-helpers.ts
│   ├── performance.ts
│   └── utils.ts
├── public
│   └── version.json
├── scripts
│   ├── dev.sh
│   └── generate-version.js
├── __tests__
│   └── lib
├── types
│   ├── analytics.ts
│   ├── api.ts
│   ├── filters.ts
│   ├── index.ts
│   └── protocolo.ts
└── [arquivos de configuracao]

52 diretorios, 190 arquivos
```

---

## Arquivos de Configuracao

### package.json

```json
{
  "name": "protocolos-dashboard-dev",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "bash scripts/dev.sh",
    "dev:quick": "next dev -p 3001",
    "prebuild": "node scripts/generate-version.js",
    "build": "next build",
    "start": "next start -p 3001",
    "analyze": "ANALYZE=true next build",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx --max-warnings 50",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "prepare": "husky"
  },
  "dependencies": {
    "@nivo/bar": "^0.99.0",
    "@nivo/core": "^0.99.0",
    "@nivo/heatmap": "^0.99.0",
    "@nivo/line": "^0.99.0",
    "@nivo/pie": "^0.99.0",
    "@nivo/sankey": "^0.99.0",
    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toast": "^1.2.15",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tanstack/react-query": "^5.62.15",
    "@tanstack/react-table": "^8.20.5",
    "@vercel/analytics": "^1.6.1",
    "@vercel/speed-insights": "^1.3.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "dotenv": "^17.2.3",
    "exceljs": "^4.4.0",
    "jspdf": "^3.0.4",
    "jspdf-autotable": "^5.0.2",
    "lucide-react": "^0.468.0",
    "mssql": "^11.0.1",
    "next": "^15.0.0",
    "next-themes": "^0.4.6",
    "papaparse": "^5.5.3",
    "react": "^19.0.0",
    "react-day-picker": "^9.4.4",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.0",
    "sonner": "^1.7.3",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^16.1.1",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.1",
    "@testing-library/user-event": "^14.6.1",
    "@types/mssql": "^9.1.5",
    "@types/node": "^20",
    "@types/papaparse": "^5.5.1",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^5.1.2",
    "autoprefixer": "^10.4.20",
    "eslint": "^8",
    "eslint-config-next": "^15.0.0",
    "husky": "^9.1.7",
    "jsdom": "^27.4.0",
    "lint-staged": "^16.2.7",
    "postcss": "^8.4.47",
    "prettier": "^3.4.2",
    "tailwindcss": "^3.4.1",
    "typescript": "^5",
    "vitest": "^4.0.16"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings 10", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

---

### next.config.ts

```typescript
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Origens permitidas para desenvolvimento (configuravel via env)
const devOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(",") || [];

const nextConfig: NextConfig = {
  // Apenas inclui allowedDevOrigins se houver origens configuradas
  ...(devOrigins.length > 0 && { allowedDevOrigins: devOrigins }),

  // Headers de seguranca
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
```

---

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

---

### postcss.config.mjs

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

---

### vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", ".next/", "**/*.d.ts", "**/*.config.*", "**/types/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

---

### .eslintrc.json

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "ignorePatterns": ["next-env.d.ts", "node_modules/", ".next/", "coverage/"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-require-imports": "off",
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "react/jsx-no-target-blank": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

---

### components.json (shadcn/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## Variaveis de Ambiente

Criar arquivo `.env.local` com:

```env
# Banco de Dados SQL Server
DB_SERVER=192.168.x.x
DB_PORT=1433
DB_DATABASE=fade1
DB_USER=sagi
DB_PASSWORD=***
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Desenvolvimento
ALLOWED_DEV_ORIGINS=http://localhost:3000,http://localhost:3001

# Analise de bundle (opcional)
ANALYZE=false
```

---

## Scripts Disponiveis

| Comando                 | Descricao                          |
| ----------------------- | ---------------------------------- |
| `npm run dev`           | Inicia servidor de desenvolvimento |
| `npm run dev:quick`     | Inicia dev na porta 3001 (rapido)  |
| `npm run build`         | Build de producao                  |
| `npm run start`         | Inicia build de producao           |
| `npm run analyze`       | Analisa bundle size                |
| `npm run type-check`    | Verifica tipos TypeScript          |
| `npm run lint`          | Executa ESLint                     |
| `npm run lint:fix`      | Corrige problemas de lint          |
| `npm run format`        | Formata codigo com Prettier        |
| `npm run test`          | Executa testes                     |
| `npm run test:watch`    | Testes em modo watch               |
| `npm run test:coverage` | Testes com cobertura               |

---

## Endpoints da API

| Endpoint                       | Metodo | Descricao                    |
| ------------------------------ | ------ | ---------------------------- |
| `/api/protocolos`              | GET    | Lista paginada de protocolos |
| `/api/protocolos/[id]`         | GET    | Detalhes de um protocolo     |
| `/api/protocolos/cached`       | GET    | Protocolos em cache          |
| `/api/protocolos/estagnados`   | GET    | Protocolos parados >365 dias |
| `/api/kpis`                    | GET    | Indicadores principais       |
| `/api/analytics/temporal`      | GET    | Serie temporal               |
| `/api/analytics/heatmap`       | GET    | Heatmap dia/hora             |
| `/api/analytics/fluxo-setores` | GET    | Fluxo entre setores          |
| `/api/analytics/por-assunto`   | GET    | Agrupado por assunto         |
| `/api/analytics/por-projeto`   | GET    | Agrupado por projeto         |
| `/api/setores`                 | GET    | Lista de setores             |
| `/api/health`                  | GET    | Health check                 |
| `/api/admin/qualidade-dados`   | GET    | Analise de qualidade         |

---

_Gerado em: 12/01/2026_
