import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";

interface Setor {
  codigo: number;
  descr: string;
}

/**
 * Setores relevantes para análise no Dashboard
 * Baseado nos setores que aparecem no filtro da página de protocolos
 * NOTA: ARQUIVO (52) foi removido pois é setor de finalização, não de análise
 */
const SETORES_PERMITIDOS = [
  43, // ASSESSORIA TÉCNICA / TI
  48, // GERENCIA DE FINANÇAS E CONTABILIDADE
  45, // GERÊNCIA ADMINISTRATIVA
  40, // GERÊNCIA DE PROJETOS
  56, // PORTAL DO COORDENADOR
  44, // SECRETARIA
];

/**
 * GET /api/setores
 * Retorna lista de setores disponíveis para análise no Dashboard
 * Filtra apenas os setores relevantes (mesmos do filtro de protocolos)
 */
export const GET = withErrorHandling(async () => {
  const codigosIn = SETORES_PERMITIDOS.join(",");

  const query = `
    SELECT
      s.codigo,
      s.descr
    FROM setor s
    WHERE s.deletado IS NULL
      AND s.codigo IN (${codigosIn})
    ORDER BY s.descr
  `;

  const result = await executeQuery<Setor>(query);

  return NextResponse.json({
    data: result,
    success: true,
  });
});

export const revalidate = 3600; // 1 hora - setores raramente mudam
