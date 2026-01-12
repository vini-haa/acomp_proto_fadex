import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";
import { withBaseCTE } from "@/lib/queries/base-cte";

/**
 * Interface para estatísticas de qualidade de dados
 */
interface EstatisticasQualidade {
  // Totais gerais
  totalProtocolos: number;
  totalMovimentacoes: number;

  // Situação dos protocolos (codSituacaoProt)
  situacao: {
    totalSemSituacao: number;
    totalComSituacao: number;
    percentualSemSituacao: number;
    porSituacao: Array<{
      codSituacao: number | null;
      descricao: string;
      quantidade: number;
      percentual: number;
    }>;
  };

  // Setores
  setores: {
    totalSetores: number;
    setoresAtivos: number;
    setoresDesabilitados: number;
    setoresComProtocolos: number;
    setoresDesabilitadosComProtocolos: Array<{
      codigo: number;
      nome: string;
      quantidadeProtocolos: number;
    }>;
  };

  // Estagnação
  estagnacao: {
    totalEstagnados365Dias: number;
    totalEstagnados180Dias: number;
    totalEstagnados90Dias: number;
    percentualEstagnados: number;
  };

  // Dados faltantes
  dadosFaltantes: {
    protocolosSemAssunto: number;
    protocolosSemProjeto: number;
    protocolosSemRemetente: number;
    movimentacoesSemSetorOrigem: number;
    movimentacoesSemSetorDestino: number;
  };

  // Anomalias
  anomalias: {
    datasAnomalasFuturo: number;
    datasAnomalasPassado: number;
    lotePagamentosSemMovimentacao: number;
  };
}

/**
 * GET /api/admin/qualidade-dados
 * Retorna estatísticas de qualidade dos dados do sistema
 *
 * Baseado na análise do trace SQL que identificou:
 * - 94% dos protocolos sem situação preenchida (codSituacaoProt = NULL)
 * - 28 setores desabilitados ainda contendo protocolos
 * - 65.102 protocolos estagnados (>365 dias sem movimentação)
 * - 89 protocolos com datas anômalas
 */
export const GET = withErrorHandling(async () => {
  // Query 1: Totais gerais
  const queryTotais = `
    SELECT
        (SELECT COUNT(*) FROM documento WHERE deletado IS NULL) AS totalProtocolos,
        (SELECT COUNT(*) FROM scd_movimentacao WHERE Deletado IS NULL) AS totalMovimentacoes
  `;

  // Query 2: Estatísticas de situação
  const querySituacao = `
    SELECT
        (SELECT COUNT(*) FROM scd_movimentacao WHERE codSituacaoProt IS NULL AND Deletado IS NULL) AS totalSemSituacao,
        (SELECT COUNT(*) FROM scd_movimentacao WHERE codSituacaoProt IS NOT NULL AND Deletado IS NULL) AS totalComSituacao
  `;

  // Query 3: Distribuição por situação
  const queryPorSituacao = `
    SELECT
        m.codSituacaoProt AS codSituacao,
        COALESCE(sp.DESCRICAO, '(Sem Situação)') AS descricao,
        COUNT(*) AS quantidade
    FROM scd_movimentacao m
    LEFT JOIN situacaoProtocolo sp ON sp.CODIGO = m.codSituacaoProt
    WHERE m.Deletado IS NULL
    GROUP BY m.codSituacaoProt, sp.DESCRICAO
    ORDER BY quantidade DESC
  `;

  // Query 4: Estatísticas de setores (usa CTE)
  const querySetoresInner = `
    SELECT
        (SELECT COUNT(*) FROM setor) AS totalSetores,
        (SELECT COUNT(*) FROM setor WHERE deletado IS NULL AND descr NOT LIKE 'DESABILITADO%') AS setoresAtivos,
        (SELECT COUNT(*) FROM setor WHERE deletado = 1 OR descr LIKE 'DESABILITADO%') AS setoresDesabilitados,
        (SELECT COUNT(DISTINCT setor_atual) FROM vw_ProtocolosFinanceiro WHERE status_protocolo = 'Em Andamento') AS setoresComProtocolos
  `;
  const querySetores = withBaseCTE(querySetoresInner);

  // Query 5: Setores desabilitados com protocolos (usa CTE)
  const querySetoresDesabilitadosInner = `
    SELECT
        s.codigo,
        s.descr AS nome,
        COUNT(*) AS quantidadeProtocolos
    FROM vw_ProtocolosFinanceiro vp
    INNER JOIN setor s ON s.codigo = vp.setor_atual
    WHERE vp.status_protocolo = 'Em Andamento'
      AND (s.deletado = 1 OR s.descr LIKE 'DESABILITADO%')
    GROUP BY s.codigo, s.descr
    ORDER BY quantidadeProtocolos DESC
  `;
  const querySetoresDesabilitados = withBaseCTE(querySetoresDesabilitadosInner);

  // Query 6: Estatísticas de estagnação (usa CTE)
  const queryEstagnacaoInner = `
    SELECT
        SUM(CASE WHEN DATEDIFF(DAY, dt_ultima_movimentacao, GETDATE()) > 365 THEN 1 ELSE 0 END) AS totalEstagnados365Dias,
        SUM(CASE WHEN DATEDIFF(DAY, dt_ultima_movimentacao, GETDATE()) > 180 THEN 1 ELSE 0 END) AS totalEstagnados180Dias,
        SUM(CASE WHEN DATEDIFF(DAY, dt_ultima_movimentacao, GETDATE()) > 90 THEN 1 ELSE 0 END) AS totalEstagnados90Dias,
        COUNT(*) AS totalEmAndamento
    FROM vw_ProtocolosFinanceiro
    WHERE status_protocolo = 'Em Andamento'
  `;
  const queryEstagnacao = withBaseCTE(queryEstagnacaoInner);

  // Query 7: Dados faltantes
  const queryDadosFaltantes = `
    SELECT
        (SELECT COUNT(*) FROM documento WHERE (assunto IS NULL OR assunto = '') AND deletado IS NULL) AS protocolosSemAssunto,
        (SELECT COUNT(*) FROM documento WHERE numconv IS NULL AND deletado IS NULL) AS protocolosSemProjeto,
        (SELECT COUNT(*) FROM documento WHERE (remetente IS NULL OR remetente = '') AND deletado IS NULL) AS protocolosSemRemetente,
        (SELECT COUNT(*) FROM scd_movimentacao WHERE codSetorOrigem IS NULL AND Deletado IS NULL) AS movimentacoesSemSetorOrigem,
        (SELECT COUNT(*) FROM scd_movimentacao WHERE codSetorDestino IS NULL AND Deletado IS NULL) AS movimentacoesSemSetorDestino
  `;

  // Query 8: Anomalias
  const queryAnomalias = `
    SELECT
        (SELECT COUNT(*) FROM documento WHERE YEAR(data) > 2030 AND deletado IS NULL) AS datasAnomalasFuturo,
        (SELECT COUNT(*) FROM documento WHERE YEAR(data) < 1990 AND deletado IS NULL) AS datasAnomalasPassado,
        (SELECT COUNT(*) FROM documento d
         WHERE (d.assunto LIKE '%LOTE%PAGAMENTO%' OR d.assunto = 'LOTE DE PAGAMENTOS')
           AND NOT EXISTS (SELECT 1 FROM scd_movimentacao m WHERE m.codprot = d.codigo AND m.Deletado IS NULL)
           AND d.deletado IS NULL) AS lotePagamentosSemMovimentacao
  `;

  // Executar todas as queries em paralelo
  const [
    totaisResult,
    situacaoResult,
    porSituacaoResult,
    setoresResult,
    setoresDesabilitadosResult,
    estagnacaoResult,
    dadosFaltantesResult,
    anomaliasResult,
  ] = await Promise.all([
    executeQuery<{ totalProtocolos: number; totalMovimentacoes: number }>(queryTotais),
    executeQuery<{ totalSemSituacao: number; totalComSituacao: number }>(querySituacao),
    executeQuery<{ codSituacao: number | null; descricao: string; quantidade: number }>(
      queryPorSituacao
    ),
    executeQuery<{
      totalSetores: number;
      setoresAtivos: number;
      setoresDesabilitados: number;
      setoresComProtocolos: number;
    }>(querySetores),
    executeQuery<{ codigo: number; nome: string; quantidadeProtocolos: number }>(
      querySetoresDesabilitados
    ),
    executeQuery<{
      totalEstagnados365Dias: number;
      totalEstagnados180Dias: number;
      totalEstagnados90Dias: number;
      totalEmAndamento: number;
    }>(queryEstagnacao),
    executeQuery<{
      protocolosSemAssunto: number;
      protocolosSemProjeto: number;
      protocolosSemRemetente: number;
      movimentacoesSemSetorOrigem: number;
      movimentacoesSemSetorDestino: number;
    }>(queryDadosFaltantes),
    executeQuery<{
      datasAnomalasFuturo: number;
      datasAnomalasPassado: number;
      lotePagamentosSemMovimentacao: number;
    }>(queryAnomalias),
  ]);

  const totais = totaisResult[0];
  const situacaoStats = situacaoResult[0];
  const setoresStats = setoresResult[0];
  const estagnacaoStats = estagnacaoResult[0];
  const dadosFaltantes = dadosFaltantesResult[0];
  const anomalias = anomaliasResult[0];

  // Calcular percentuais
  const totalMovimentacoes = situacaoStats.totalSemSituacao + situacaoStats.totalComSituacao;
  const percentualSemSituacao =
    totalMovimentacoes > 0
      ? Math.round((situacaoStats.totalSemSituacao / totalMovimentacoes) * 10000) / 100
      : 0;

  const percentualEstagnados =
    estagnacaoStats.totalEmAndamento > 0
      ? Math.round(
          (estagnacaoStats.totalEstagnados365Dias / estagnacaoStats.totalEmAndamento) * 10000
        ) / 100
      : 0;

  // Adicionar percentual a cada situação
  const porSituacaoComPercentual = porSituacaoResult.map((s) => ({
    ...s,
    percentual:
      totalMovimentacoes > 0 ? Math.round((s.quantidade / totalMovimentacoes) * 10000) / 100 : 0,
  }));

  const estatisticas: EstatisticasQualidade = {
    totalProtocolos: totais.totalProtocolos,
    totalMovimentacoes: totais.totalMovimentacoes,
    situacao: {
      totalSemSituacao: situacaoStats.totalSemSituacao,
      totalComSituacao: situacaoStats.totalComSituacao,
      percentualSemSituacao,
      porSituacao: porSituacaoComPercentual,
    },
    setores: {
      totalSetores: setoresStats.totalSetores,
      setoresAtivos: setoresStats.setoresAtivos,
      setoresDesabilitados: setoresStats.setoresDesabilitados,
      setoresComProtocolos: setoresStats.setoresComProtocolos,
      setoresDesabilitadosComProtocolos: setoresDesabilitadosResult,
    },
    estagnacao: {
      totalEstagnados365Dias: estagnacaoStats.totalEstagnados365Dias,
      totalEstagnados180Dias: estagnacaoStats.totalEstagnados180Dias,
      totalEstagnados90Dias: estagnacaoStats.totalEstagnados90Dias,
      percentualEstagnados,
    },
    dadosFaltantes,
    anomalias,
  };

  return NextResponse.json({
    data: estatisticas,
    success: true,
    timestamp: new Date().toISOString(),
  });
});

export const revalidate = 600; // 10 minutos
