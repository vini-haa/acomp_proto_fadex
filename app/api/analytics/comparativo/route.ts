import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { ComparativoItem } from "@/types";
import { withErrorHandling } from "@/lib/errors";
import { TODOS_SETORES, SETORES } from "@/lib/constants/setores";
import { logger } from "@/lib/logger";

// Setores de entrada na fundação (Projetos e Secretaria)
const SETORES_ENTRADA = SETORES.ENTRADA;

// ═══════════════════════════════════════════════════════════════════════════
// CACHE LOCAL - Reduz tempo de 4-21s para <500ms em requisições subsequentes
// ═══════════════════════════════════════════════════════════════════════════
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos
interface CacheEntry {
  data: (ComparativoItem & { dia: number })[];
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();

function getCacheKey(setor: number): string {
  return `comparativo_${setor}`;
}

function getFromCache(setor: number): (ComparativoItem & { dia: number })[] | null {
  const key = getCacheKey(setor);
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    logger.info(`📦 Cache hit para comparativo setor=${setor}`);
    return entry.data;
  }
  return null;
}

function setCache(setor: number, data: (ComparativoItem & { dia: number })[]): void {
  const key = getCacheKey(setor);
  cache.set(key, { data, timestamp: Date.now() });
  logger.info(`💾 Cache salvo para comparativo setor=${setor} (${data.length} registros)`);
}

/**
 * GET /api/analytics/comparativo
 * Retorna comparativo Year-over-Year (mês atual vs mesmo mês ano anterior)
 * Filtra por setor se o parâmetro for fornecido
 *
 * OTIMIZAÇÕES (2026-01-28):
 * 1. Cache local de 10 minutos (reduz 95% das requisições ao banco)
 * 2. Agregação por MÊS em vez de por DIA (reduz 30x o volume de dados)
 * 3. Limita a 2 anos (suficiente para YoY)
 * 4. Usa índice IX_mov_data_setor_prot
 *
 * IMPORTANTE: Para comparação YTD (Year-to-Date), retornamos também
 * informações sobre a data atual para que o frontend possa calcular
 * comparações justas entre o ano atual (parcial) e o ano anterior (mesmo período)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const setorParam = searchParams.get("setor") || "48"; // Setor financeiro como padrão
  const setor = parseInt(setorParam, 10);

  // Verificar cache primeiro
  const cachedData = getFromCache(setor);
  if (cachedData) {
    const hoje = new Date();
    return NextResponse.json({
      data: cachedData,
      ytdInfo: {
        anoAtual: hoje.getFullYear(),
        mesAtual: hoje.getMonth() + 1,
        diaAtual: hoje.getDate(),
        dataReferencia: hoje.toISOString().split("T")[0],
      },
      success: true,
      fromCache: true,
    });
  }

  let query: string;

  if (setor === TODOS_SETORES) {
    // Visão MACRO: conta a primeira vez que protocolos entraram em Projetos/Secretaria
    // OTIMIZAÇÃO: Agregação por MÊS (antes era por DIA - 30x mais dados)
    const setoresEntradaIn = SETORES_ENTRADA.join(",");
    query = `
      WITH PrimeiraEntrada AS (
          -- Entrada na fundação: primeira vez que o protocolo chegou em Projetos ou Secretaria
          SELECT
              m.codprot,
              MIN(m.data) AS data_entrada
          FROM scd_movimentacao m WITH (NOLOCK)
          WHERE (m.Deletado IS NULL OR m.Deletado = 0)
            AND m.codsetordestino IN (${setoresEntradaIn})
            AND m.data >= '2024-01-01'
          GROUP BY m.codprot
      )
      SELECT
          YEAR(pe.data_entrada) AS ano,
          MONTH(pe.data_entrada) AS mes,
          DATENAME(MONTH, pe.data_entrada) AS mesNome,
          1 AS dia,
          COUNT(*) AS quantidade
      FROM PrimeiraEntrada pe
      GROUP BY
          YEAR(pe.data_entrada),
          MONTH(pe.data_entrada),
          DATENAME(MONTH, pe.data_entrada)
      ORDER BY ano, mes;
    `;
  } else {
    // Query que conta protocolos que entraram no setor por mês/ano
    // OTIMIZAÇÃO: Agregação por MÊS em vez de DIA
    query = `
      SELECT
          YEAR(m.data) AS ano,
          MONTH(m.data) AS mes,
          DATENAME(MONTH, m.data) AS mesNome,
          1 AS dia,
          COUNT(DISTINCT m.codprot) AS quantidade
      FROM scd_movimentacao m WITH (NOLOCK)
      WHERE m.codsetordestino = ${setor}
        AND m.data >= '2024-01-01'
        AND (m.Deletado IS NULL OR m.Deletado = 0)
      GROUP BY
          YEAR(m.data),
          MONTH(m.data),
          DATENAME(MONTH, m.data)
      ORDER BY ano, mes;
    `;
  }

  const result = await executeQuery<ComparativoItem & { dia: number }>(query);

  // Salvar no cache
  setCache(setor, result);

  // Informações para cálculo YTD no frontend
  const hoje = new Date();
  const ytdInfo = {
    anoAtual: hoje.getFullYear(),
    mesAtual: hoje.getMonth() + 1, // 1-12
    diaAtual: hoje.getDate(),
    dataReferencia: hoje.toISOString().split("T")[0], // YYYY-MM-DD
  };

  return NextResponse.json({
    data: result,
    ytdInfo,
    success: true,
    fromCache: false,
  });
});

export const revalidate = 300; // 5 minutos
