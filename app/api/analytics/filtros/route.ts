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
  codSituacaoProjeto: number | null;
}

interface Setor {
  codigo: number;
  descr: string;
}

interface Colaborador {
  codigo: number;
  nome: string;
  login: string;
  codSetor: number | null;
  qtdMovimentacoes: number;
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

  // Query para projetos (todos os status, ordenados por data de cadastro)
  const projetosQuery = `
    SELECT TOP 200
      c.numconv,
      c.titulo,
      c.CodSituacaoProjeto AS codSituacaoProjeto
    FROM convenio c
    WHERE c.deletado IS NULL
      AND c.titulo IS NOT NULL
    ORDER BY c.datacad DESC
  `;

  // Query para setores ativos (mesmos usados no heatmap)
  const setoresQuery = `
    SELECT
      s.codigo,
      s.descr
    FROM setor s
    WHERE s.deletado IS NULL
      AND (s.descr LIKE '-%' OR UPPER(s.descr) LIKE 'ARQUIVO%')
      AND s.descr NOT LIKE '%DESABILITADO%'
    ORDER BY s.descr
  `;

  // Query para colaboradores ATIVOS que fizeram movimentações nos últimos 12 meses
  // Filtra apenas usuários não bloqueados e não deletados
  // Inclui o setor do usuário para filtro em cascata
  const colaboradoresQuery = `
    WITH UsuariosAtivos AS (
      SELECT
        codUsuario AS codigo,
        COUNT(*) AS qtdMovimentacoes
      FROM scd_movimentacao
      WHERE (Deletado IS NULL OR Deletado = 0)
        AND codUsuario IS NOT NULL
        AND codUsuario != 0
        AND data >= DATEADD(MONTH, -12, GETDATE())
      GROUP BY codUsuario
      HAVING COUNT(*) > 0
    )
    SELECT
      ua.codigo AS codigo,
      COALESCE(u.Nome, 'Usuário ' + CAST(ua.codigo AS VARCHAR)) AS nome,
      COALESCE(u.Login, '') AS login,
      u.codSetor AS codSetor,
      ua.qtdMovimentacoes AS qtdMovimentacoes
    FROM UsuariosAtivos ua
    LEFT JOIN usuario u ON u.codigo = ua.codigo
    WHERE u.Nome IS NOT NULL
      AND u.Nome != ''
      AND (u.bloqueado IS NULL OR u.bloqueado = 0)
      AND (u.DELETADO IS NULL OR u.DELETADO = 0)
    ORDER BY u.Nome
  `;

  const [instituicoes, estados, situacoes, projetos, setores, colaboradores] = await Promise.all([
    executeQuery<Instituicao>(instituicoesQuery),
    executeQuery<Estado>(estadosQuery),
    executeQuery<Situacao>(situacoesQuery),
    executeQuery<Projeto>(projetosQuery),
    executeQuery<Setor>(setoresQuery),
    executeQuery<Colaborador>(colaboradoresQuery),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      instituicoes,
      estados,
      situacoes,
      projetos,
      setores,
      colaboradores,
    },
  });
});

// Cache de 1 hora
export const revalidate = 3600;
