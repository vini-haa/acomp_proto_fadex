import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";

interface Instituicao {
  codigo: number;
  descricao: string;
  sigla: string;
  qtdConvenios: number;
}

interface Estado {
  uf: string;
  qtdConvenios: number;
}

interface Situacao {
  codigo: number;
  descricao: string;
  qtdConvenios: number;
}

interface Projeto {
  numconv: number;
  titulo: string;
}

/**
 * GET /api/analytics/filtros
 * Retorna opções de filtros para o heatmap
 */
export const GET = withErrorHandling(async () => {
  // Query para instituições com convênios
  const instituicoesQuery = `
    SELECT
      i.CODIGO AS codigo,
      i.DESCRICAO AS descricao,
      ISNULL(i.sigla, '') AS sigla,
      COUNT(c.numconv) AS qtdConvenios
    FROM instituicao i
    INNER JOIN convenio c ON c.codinst = i.CODIGO AND c.deletado IS NULL
    WHERE i.DELETADO IS NULL
    GROUP BY i.CODIGO, i.DESCRICAO, i.sigla
    HAVING COUNT(c.numconv) > 0
    ORDER BY qtdConvenios DESC
  `;

  // Query para estados
  const estadosQuery = `
    SELECT
      UF AS uf,
      COUNT(*) AS qtdConvenios
    FROM convenio
    WHERE deletado IS NULL
      AND UF IS NOT NULL
      AND UF != ''
    GROUP BY UF
    ORDER BY qtdConvenios DESC
  `;

  // Query para situações de projeto
  const situacoesQuery = `
    SELECT
      sp.codigo,
      sp.descricao,
      COUNT(c.numconv) AS qtdConvenios
    FROM situacaoProjeto sp
    INNER JOIN convenio c ON c.CodSituacaoProjeto = sp.codigo AND c.deletado IS NULL
    WHERE sp.Deletado IS NULL
    GROUP BY sp.codigo, sp.descricao
    HAVING COUNT(c.numconv) > 0
    ORDER BY qtdConvenios DESC
  `;

  // Query para projetos em execução (mais recentes)
  const projetosQuery = `
    SELECT TOP 50
      c.numconv,
      c.titulo
    FROM convenio c
    WHERE c.deletado IS NULL
      AND c.CodSituacaoProjeto = 2  -- Em execução
      AND c.titulo IS NOT NULL
    ORDER BY c.datacad DESC
  `;

  const [instituicoes, estados, situacoes, projetos] = await Promise.all([
    executeQuery<Instituicao>(instituicoesQuery),
    executeQuery<Estado>(estadosQuery),
    executeQuery<Situacao>(situacoesQuery),
    executeQuery<Projeto>(projetosQuery),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      instituicoes,
      estados,
      situacoes,
      projetos,
    },
  });
});

// Cache de 1 hora
export const revalidate = 3600;
