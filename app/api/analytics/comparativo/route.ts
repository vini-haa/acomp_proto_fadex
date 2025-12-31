import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { ComparativoItem } from "@/types";
import { withErrorHandling } from "@/lib/errors";
import { TODOS_SETORES, SETORES } from "@/lib/constants/setores";

// Setores de entrada na fundação (Projetos e Secretaria)
const SETORES_ENTRADA = SETORES.ENTRADA;

/**
 * GET /api/analytics/comparativo
 * Retorna comparativo Year-over-Year (mês atual vs mesmo mês ano anterior)
 * Filtra por setor se o parâmetro for fornecido
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const setorParam = searchParams.get("setor") || "48"; // Setor financeiro como padrão
  const setor = parseInt(setorParam, 10);

  let query: string;

  if (setor === TODOS_SETORES) {
    // Visão MACRO: conta a primeira vez que protocolos entraram em Projetos/Secretaria
    const setoresEntradaIn = SETORES_ENTRADA.join(",");
    query = `
      WITH PrimeiraEntrada AS (
          -- Entrada na fundação: primeira vez que o protocolo chegou em Projetos ou Secretaria
          SELECT
              m.codprot,
              MIN(m.data) AS data_entrada
          FROM scd_movimentacao m
          WHERE m.Deletado IS NULL
            AND m.codsetordestino IN (${setoresEntradaIn})
          GROUP BY m.codprot
      )
      SELECT
          YEAR(pe.data_entrada) AS ano,
          MONTH(pe.data_entrada) AS mes,
          DATENAME(MONTH, pe.data_entrada) AS mesNome,
          COUNT(*) AS quantidade
      FROM PrimeiraEntrada pe
      WHERE pe.data_entrada >= DATEADD(YEAR, -3, GETDATE())
      GROUP BY
          YEAR(pe.data_entrada),
          MONTH(pe.data_entrada),
          DATENAME(MONTH, pe.data_entrada)
      ORDER BY ano, mes;
    `;
  } else {
    // Query que conta protocolos que entraram no setor por mês/ano
    query = `
      SELECT
          YEAR(m.data) AS ano,
          MONTH(m.data) AS mes,
          DATENAME(MONTH, m.data) AS mesNome,
          COUNT(DISTINCT m.codprot) AS quantidade
      FROM scd_movimentacao m
      WHERE m.codsetordestino = ${setor}
        AND m.data >= DATEADD(YEAR, -3, GETDATE())
        AND m.Deletado IS NULL
      GROUP BY
          YEAR(m.data),
          MONTH(m.data),
          DATENAME(MONTH, m.data)
      ORDER BY ano, mes;
    `;
  }

  const result = await executeQuery<ComparativoItem>(query);

  return NextResponse.json({
    data: result,
    success: true,
  });
});

export const revalidate = 300; // 5 minutos
