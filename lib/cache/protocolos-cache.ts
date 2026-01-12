/**
 * Cache de Protocolos com atualização em segundo plano
 *
 * Estratégia:
 * - Mantém dados em memória
 * - Atualiza automaticamente a cada REFRESH_INTERVAL
 * - Usuário sempre lê do cache (resposta instantânea)
 * - Suporta filtros básicos no lado do cliente
 */

import { executeQuery } from "@/lib/db";
import { Protocolo } from "@/types";
import { buildProtocolosListQuery } from "@/lib/queries";
import { normalizarAssunto, ASSUNTOS_NORMALIZADOS } from "@/lib/constants";
import { logger } from "@/lib/logger";

// Configuração do cache
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos
const MAX_CACHED_RECORDS = 50000; // Máximo de registros em cache (aumentado para todos os protocolos)

interface CacheState {
  data: Protocolo[];
  lastUpdated: Date | null;
  isUpdating: boolean;
  error: Error | null;
  // Listas únicas para os filtros
  contasCorrentes: string[];
  setores: string[];
  assuntos: string[];
}

// Estado do cache (singleton)
let cache: CacheState = {
  data: [],
  lastUpdated: null,
  isUpdating: false,
  error: null,
  contasCorrentes: [],
  setores: [],
  assuntos: [],
};

// Timer para refresh automático
let refreshTimer: NodeJS.Timeout | null = null;

// Promise para aguardar cache ficar pronto
let cacheReadyPromise: Promise<void> | null = null;
let cacheReadyResolve: (() => void) | null = null;

/**
 * Aguarda o cache estar pronto (usado na primeira inicialização)
 */
export async function waitForCache(): Promise<void> {
  // Se já tem dados, retorna imediatamente
  if (cache.lastUpdated !== null) {
    return;
  }

  // Se está atualizando, aguarda a promise
  if (cacheReadyPromise) {
    await cacheReadyPromise;
    return;
  }
}

/**
 * Inicializa o cache e agenda atualizações automáticas
 */
export async function initializeCache(): Promise<void> {
  // Se já tem dados, retorna imediatamente
  if (cache.lastUpdated !== null) {
    return;
  }

  // Se já está sendo inicializado, aguarda
  if (cache.isUpdating && cacheReadyPromise) {
    logger.info("⏳ Aguardando cache ser inicializado...");
    await cacheReadyPromise;
    return;
  }

  // Cria promise para outras requisições aguardarem
  cacheReadyPromise = new Promise((resolve) => {
    cacheReadyResolve = resolve;
  });

  logger.info("🚀 Inicializando cache de protocolos...");
  await refreshCache();

  // Agenda refresh automático
  if (!refreshTimer) {
    refreshTimer = setInterval(() => {
      refreshCache();
    }, REFRESH_INTERVAL);

    logger.info(`⏰ Cache configurado para atualizar a cada ${REFRESH_INTERVAL / 60000} minutos`);
  }

  // Resolve a promise para liberar outras requisições
  if (cacheReadyResolve) {
    cacheReadyResolve();
    cacheReadyPromise = null;
    cacheReadyResolve = null;
  }
}

/**
 * Atualiza o cache em segundo plano
 */
export async function refreshCache(): Promise<void> {
  if (cache.isUpdating) {
    logger.info("⏳ Atualização do cache já em andamento...");
    return;
  }

  cache.isUpdating = true;
  const startTime = Date.now();

  try {
    logger.info("🔄 Atualizando cache de protocolos...");

    // Query sem filtros para pegar todos os registros
    const { query, params } = buildProtocolosListQuery({
      sortBy: "dt_entrada",
      sortOrder: "desc",
    });

    // Adiciona limite para não sobrecarregar a memória
    const limitedQuery = `
      ${query}
      OFFSET 0 ROWS
      FETCH NEXT ${MAX_CACHED_RECORDS} ROWS ONLY
    `;

    const data = await executeQuery<Protocolo>(limitedQuery, params);

    // Extrair listas únicas para os filtros
    const contasSet = new Set<string>();
    const setoresSet = new Set<string>();
    const assuntosSet = new Set<string>();

    // Calcular assuntoNormalizado para cada protocolo
    data.forEach((item) => {
      // Normalizar assunto
      item.assuntoNormalizado = normalizarAssunto(item.assunto);
      assuntosSet.add(item.assuntoNormalizado);

      if (item.contaCorrente) {
        contasSet.add(item.contaCorrente);
      }
      // Apenas setorDestinoAtual (setor atual real) para o filtro
      if (item.setorDestinoAtual) {
        setoresSet.add(item.setorDestinoAtual);
      }
    });

    cache.data = data;
    cache.contasCorrentes = Array.from(contasSet).sort();
    cache.setores = Array.from(setoresSet).sort();
    // Ordenar assuntos na ordem definida em ASSUNTOS_NORMALIZADOS
    cache.assuntos = ASSUNTOS_NORMALIZADOS.filter((a) => assuntosSet.has(a));

    logger.info(
      `📋 Filtros extraídos: ${cache.contasCorrentes.length} contas correntes, ${cache.setores.length} setores, ${cache.assuntos.length} assuntos`
    );
    cache.lastUpdated = new Date();
    cache.error = null;

    const duration = Date.now() - startTime;
    logger.success(`Cache atualizado: ${data.length} registros em ${duration}ms`);
  } catch (error) {
    cache.error = error instanceof Error ? error : new Error("Erro desconhecido");
    logger.error("❌ Erro ao atualizar cache:", error);
  } finally {
    cache.isUpdating = false;
  }
}

/**
 * Obtém dados do cache com filtros opcionais
 * Filtros são aplicados no lado do servidor (em memória)
 */
export function getCachedProtocolos(filters?: {
  status?: string;
  numeroDocumento?: string;
  faixaTempo?: string;
  contaCorrente?: string;
  setorAtual?: string;
  numconv?: string;
  assunto?: string; // Assunto normalizado (rubrica)
  diaSemana?: number; // 1=Domingo, 2=Segunda, ... 7=Sábado
  hora?: number; // 0-23
  excluirLotePagamento?: boolean; // Excluir "LOTE DE PAGAMENTOS" (padrão: true)
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): {
  data: Protocolo[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  cacheInfo: {
    lastUpdated: Date | null;
    isStale: boolean;
    totalCached: number;
  };
  filterOptions: {
    contasCorrentes: string[];
    setores: string[];
    assuntos: string[];
  };
} {
  let filtered = [...cache.data];

  // Aplica filtros em memória

  // Excluir LOTE DE PAGAMENTOS (padrão: true)
  const excluirLotes = filters?.excluirLotePagamento !== false;
  if (excluirLotes) {
    filtered = filtered.filter((p) => {
      const assunto = p.assunto?.toUpperCase() || "";
      // Exclui se for exatamente "LOTE DE PAGAMENTOS" ou se contiver ambas as palavras
      const isLotePagamento =
        assunto === "LOTE DE PAGAMENTOS" ||
        (assunto.includes("LOTE") && assunto.includes("PAGAMENTO"));
      return !isLotePagamento;
    });
  }

  if (filters?.status) {
    filtered = filtered.filter((p) => p.statusProtocolo === filters.status);
  }

  if (filters?.numeroDocumento) {
    const search = filters.numeroDocumento.toLowerCase();
    filtered = filtered.filter((p) => p.numeroDocumento?.toLowerCase().startsWith(search));
  }

  if (filters?.faixaTempo) {
    filtered = filtered.filter((p) => p.faixaTempo === filters.faixaTempo);
  }

  if (filters?.contaCorrente) {
    // Remove dígito verificador se presente (ex: "11797-8" -> "11797")
    const ccSearch = filters.contaCorrente.split("-")[0];
    // Pesquisa parcial - CC começa com o valor digitado
    filtered = filtered.filter((p) => p.contaCorrente?.startsWith(ccSearch));
  }

  if (filters?.setorAtual) {
    filtered = filtered.filter((p) => p.setorDestinoAtual === filters.setorAtual);
  }

  if (filters?.numconv) {
    filtered = filtered.filter((p) => p.numconv?.toString() === filters.numconv);
  }

  if (filters?.assunto) {
    filtered = filtered.filter((p) => p.assuntoNormalizado === filters.assunto);
  }

  if (filters?.diaSemana !== undefined) {
    filtered = filtered.filter((p) => {
      // Usa campo calculado pelo SQL Server (evita problemas de fuso horário)
      // diaSemanaNum: 1=Domingo, 2=Segunda... (DATEPART WEEKDAY do SQL Server)
      return p.diaSemanaNum === filters.diaSemana;
    });
  }

  if (filters?.hora !== undefined) {
    filtered = filtered.filter((p) => {
      // Usa campo calculado pelo SQL Server (evita problemas de fuso horário)
      return p.horaEntrada === filters.hora;
    });
  }

  // Ordenação
  const sortBy = filters?.sortBy || "dtEntrada";
  const sortOrder = filters?.sortOrder || "desc";

  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof Protocolo];
    const bVal = b[sortBy as keyof Protocolo];

    if (aVal === null || aVal === undefined) {
      return 1;
    }
    if (bVal === null || bVal === undefined) {
      return -1;
    }

    if (aVal < bVal) {
      return sortOrder === "asc" ? -1 : 1;
    }
    if (aVal > bVal) {
      return sortOrder === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Paginação
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;
  const paginatedData = filtered.slice(offset, offset + pageSize);

  // Verifica se o cache está "stale" (mais de 10 minutos)
  const isStale = cache.lastUpdated
    ? Date.now() - cache.lastUpdated.getTime() > 10 * 60 * 1000
    : true;

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    cacheInfo: {
      lastUpdated: cache.lastUpdated,
      isStale,
      totalCached: cache.data.length,
    },
    filterOptions: {
      contasCorrentes: cache.contasCorrentes,
      setores: cache.setores,
      assuntos: cache.assuntos,
    },
  };
}

/**
 * Busca um protocolo específico por número de documento
 * Usa o cache se disponível, senão faz query direta
 */
export function getCachedProtocoloByNumero(numeroDocumento: string): Protocolo | null {
  const found = cache.data.find(
    (p) => p.numeroDocumento?.toLowerCase() === numeroDocumento.toLowerCase()
  );
  return found || null;
}

/**
 * Retorna informações sobre o estado do cache
 */
export function getCacheStatus(): {
  initialized: boolean;
  lastUpdated: Date | null;
  recordCount: number;
  isUpdating: boolean;
  error: string | null;
} {
  return {
    initialized: cache.lastUpdated !== null,
    lastUpdated: cache.lastUpdated,
    recordCount: cache.data.length,
    isUpdating: cache.isUpdating,
    error: cache.error?.message || null,
  };
}

/**
 * Força uma atualização imediata do cache
 */
export async function forceRefresh(): Promise<void> {
  await refreshCache();
}

/**
 * Limpa o cache e para as atualizações automáticas
 */
export function clearCache(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  cache = {
    data: [],
    lastUpdated: null,
    isUpdating: false,
    error: null,
    contasCorrentes: [],
    setores: [],
    assuntos: [],
  };
  logger.info("🗑️ Cache limpo");
}
