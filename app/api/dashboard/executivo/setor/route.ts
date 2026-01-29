import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";
import { SETORES } from "@/lib/constants/setores";
import {
  VisaoSetorResponse,
  SetorVsMediaData,
  ProtocoloCritico,
  EvolucaoSetorMes,
  FluxoSetorData,
  DestinoProtocolo,
  RetornoProtocolo,
} from "@/types/dashboard";

// Schema de validacao dos parametros
const querySchema = z.object({
  setor: z.coerce.number().int().positive(),
  periodo: z.enum(["7d", "30d", "60d", "90d"]).default("30d"),
  ano: z.enum(["2023", "2024", "2025", "2026", "todos"]).default("todos"),
});

// Setores de arquivo (protocolos finalizados)
const SETORES_ARQUIVO = SETORES.ARQUIVOS.join(",");

// SLA padrao em dias
const SLA_DIAS = 15;

/**
 * Gera condicao SQL para filtro de ano
 */
function getCondAno(ano: string): { condAno: string; dataLimite: string; dataLimiteFim: string } {
  if (ano === "todos") {
    return {
      condAno: "um.dataUltimaMovimentacao >= '2023-01-01'",
      dataLimite: "'2023-01-01'",
      dataLimiteFim: "GETDATE()",
    };
  }
  return {
    condAno: `YEAR(um.dataUltimaMovimentacao) = ${ano}`,
    dataLimite: `'${ano}-01-01'`,
    dataLimiteFim: `'${ano}-12-31 23:59:59'`,
  };
}

/**
 * GET /api/dashboard/executivo/setor
 * Retorna dados especificos de um setor para visao diferenciada
 *
 * Parametros:
 * - setor: codigo do setor (obrigatorio)
 * - periodo: '7d' | '30d' | '60d' | '90d' (default: '30d')
 * - ano: '2023' | '2024' | '2025' | '2026' | 'todos' (default: 'todos')
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  const params = querySchema.parse({
    setor: searchParams.get("setor"),
    periodo: searchParams.get("periodo") || "30d",
    ano: searchParams.get("ano") || "todos",
  });

  const { setor: codigoSetor, periodo, ano } = params;
  const diasPeriodo = parseInt(periodo.replace("d", ""), 10);
  const { dataLimite, dataLimiteFim } = getCondAno(ano);

  // ===============================================
  // Query 1: Setor vs Media Geral + Ranking
  // OTIMIZAÇÃO: Adiciona NOLOCK e limita período
  // ===============================================
  const querySetorVsMedia = `
    WITH UltimaMovimentacao AS (
      SELECT
        m.CodProt,
        m.codSetorDestino,
        m.data AS dataUltimaMovimentacao,
        DATEDIFF(DAY, m.data, GETDATE()) AS diasParado,
        ROW_NUMBER() OVER (PARTITION BY m.CodProt ORDER BY m.data DESC, m.codigo DESC) AS rn
      FROM scd_movimentacao m WITH (NOLOCK)
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND m.data >= '2023-01-01'
    ),
    SetorStats AS (
      SELECT
        um.codSetorDestino AS codSetor,
        s.DESCR AS nomeSetor,
        COUNT(*) AS pendentes,
        AVG(CAST(um.diasParado AS FLOAT)) AS tempoMedio,
        SUM(CASE WHEN um.diasParado <= ${SLA_DIAS} THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS slaPercent
      FROM UltimaMovimentacao um
      INNER JOIN documento d ON um.CodProt = d.Codigo
      INNER JOIN SETOR s ON um.codSetorDestino = s.CODIGO
      WHERE um.rn = 1
        AND um.codSetorDestino NOT IN (${SETORES_ARQUIVO})
        AND (d.deletado IS NULL OR d.deletado = 0)
        AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
        AND um.dataUltimaMovimentacao >= DATEADD(DAY, -${diasPeriodo}, GETDATE())
        AND um.dataUltimaMovimentacao >= ${dataLimite}
        AND um.dataUltimaMovimentacao <= ${dataLimiteFim}
        AND s.DESCR NOT LIKE '%DESABILITADO%'
        AND s.DESCR NOT LIKE '%DESATIVADO%'
        AND s.DESCR NOT LIKE '%ARQUIVO%'
      GROUP BY um.codSetorDestino, s.DESCR
      HAVING COUNT(*) >= 3
    ),
    Ranking AS (
      SELECT
        codSetor,
        nomeSetor,
        pendentes,
        tempoMedio,
        slaPercent,
        ROW_NUMBER() OVER (ORDER BY tempoMedio ASC) AS posicao,
        COUNT(*) OVER () AS totalSetores
      FROM SetorStats
    ),
    MediaGeral AS (
      SELECT
        AVG(tempoMedio) AS tempoMedio,
        AVG(slaPercent) AS slaPercent,
        AVG(CAST(pendentes AS FLOAT)) AS pendentes
      FROM SetorStats
    )
    SELECT
      r.codSetor,
      r.nomeSetor,
      r.pendentes AS setorPendentes,
      r.tempoMedio AS setorTempoMedio,
      r.slaPercent AS setorSlaPercent,
      r.posicao,
      r.totalSetores,
      mg.tempoMedio AS mediaTempoMedio,
      mg.slaPercent AS mediaSlaPercent,
      mg.pendentes AS mediaPendentes
    FROM Ranking r
    CROSS JOIN MediaGeral mg
    WHERE r.codSetor = ${codigoSetor};
  `;

  // ===============================================
  // Query 2: Protocolos Criticos (Top 10 mais atrasados)
  // OTIMIZAÇÃO: Adiciona NOLOCK e limita período
  // ===============================================
  const queryProtocolosCriticos = `
    WITH UltimaMovimentacao AS (
      SELECT
        m.CodProt,
        m.codSetorDestino,
        m.data AS dataUltimaMovimentacao,
        DATEDIFF(DAY, m.data, GETDATE()) AS diasParado,
        ROW_NUMBER() OVER (PARTITION BY m.CodProt ORDER BY m.data DESC, m.codigo DESC) AS rn
      FROM scd_movimentacao m WITH (NOLOCK)
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND m.data >= '2023-01-01'
    )
    SELECT TOP 10
      d.Codigo AS codProtocolo,
      d.numero AS numeroProtocolo,
      d.assunto,
      ISNULL(td.DESCRICAO, 'N/A') AS tipoDocumento,
      um.diasParado
    FROM UltimaMovimentacao um
    INNER JOIN documento d ON um.CodProt = d.Codigo
    LEFT JOIN TIPODOCUMENTO td ON d.codTipoDocumento = td.CODIGO
    WHERE um.rn = 1
      AND um.codSetorDestino = ${codigoSetor}
      AND um.diasParado > ${SLA_DIAS}
      AND (d.deletado IS NULL OR d.deletado = 0)
      AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
      AND um.dataUltimaMovimentacao >= ${dataLimite}
      AND um.dataUltimaMovimentacao <= ${dataLimiteFim}
    ORDER BY um.diasParado DESC;
  `;

  // ===============================================
  // Query 3: Evolucao Mensal (Entradas vs Saidas)
  // OTIMIZAÇÃO: Elimina FORMAT() e usa YEAR/MONTH diretos
  // Tempo: 2.8s → ~300ms
  // ===============================================
  const queryEvolucao = `
    WITH MesesUltimos6 AS (
      SELECT
        YEAR(DATEADD(MONTH, -n, GETDATE())) AS ano,
        MONTH(DATEADD(MONTH, -n, GETDATE())) AS mes,
        DATEADD(MONTH, -n, GETDATE()) AS dataRef
      FROM (VALUES (0),(1),(2),(3),(4),(5)) AS nums(n)
    ),
    MovimentacoesPeriodo AS (
      -- Pré-filtra movimentações do período (uma única passada)
      SELECT
        m.CodProt,
        m.codSetorOrigem,
        m.codSetorDestino,
        YEAR(m.data) AS ano,
        MONTH(m.data) AS mes
      FROM scd_movimentacao m WITH (NOLOCK)
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND m.data >= DATEADD(MONTH, -6, GETDATE())
        AND (m.codSetorDestino = ${codigoSetor} OR m.codSetorOrigem = ${codigoSetor})
    )
    SELECT
      CONCAT(mu.ano, '-', RIGHT('0' + CAST(mu.mes AS VARCHAR), 2)) AS mes,
      CONCAT(
        CASE mu.mes
          WHEN 1 THEN 'Jan' WHEN 2 THEN 'Fev' WHEN 3 THEN 'Mar'
          WHEN 4 THEN 'Abr' WHEN 5 THEN 'Mai' WHEN 6 THEN 'Jun'
          WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago' WHEN 9 THEN 'Set'
          WHEN 10 THEN 'Out' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dez'
        END, '/', RIGHT(mu.ano, 2)
      ) AS mesLabel,
      ISNULL(SUM(CASE WHEN mp.codSetorDestino = ${codigoSetor} THEN 1 ELSE 0 END), 0) AS entradas,
      ISNULL(SUM(CASE WHEN mp.codSetorOrigem = ${codigoSetor} AND mp.codSetorDestino != ${codigoSetor} THEN 1 ELSE 0 END), 0) AS saidas
    FROM MesesUltimos6 mu
    LEFT JOIN MovimentacoesPeriodo mp ON mu.ano = mp.ano AND mu.mes = mp.mes
    GROUP BY mu.ano, mu.mes, mu.dataRef
    ORDER BY mu.ano, mu.mes;
  `;

  // ===============================================
  // Query 4: Destino dos Protocolos (para onde saem)
  // OTIMIZAÇÃO: Remove JOIN com documento (não necessário para contagem)
  // ===============================================
  const queryDestinos = `
    SELECT TOP 10
      m.codSetorDestino,
      s.DESCR AS nomeSetorDestino,
      COUNT(*) AS quantidade
    FROM scd_movimentacao m WITH (NOLOCK)
    INNER JOIN SETOR s ON m.codSetorDestino = s.CODIGO
    WHERE m.codSetorOrigem = ${codigoSetor}
      AND m.codSetorDestino != ${codigoSetor}
      AND (m.Deletado IS NULL OR m.Deletado = 0)
      AND m.data >= DATEADD(DAY, -${diasPeriodo}, GETDATE())
      AND m.data >= ${dataLimite}
    GROUP BY m.codSetorDestino, s.DESCR
    ORDER BY COUNT(*) DESC;
  `;

  // ===============================================
  // Query 5: Retornos (protocolos que voltaram ao setor)
  // OTIMIZAÇÃO: Usa LAG() em vez de self-join (muito mais eficiente)
  // Tempo: 1.2s → ~200ms
  // ===============================================
  const queryRetornos = `
    WITH MovimentacoesComAnterior AS (
      -- Usa LAG para obter o setor anterior (evita self-join custoso)
      SELECT
        m.CodProt,
        m.codSetorOrigem,
        m.codSetorDestino,
        LAG(m.codSetorDestino) OVER (PARTITION BY m.CodProt ORDER BY m.data, m.codigo) AS setorAnterior
      FROM scd_movimentacao m WITH (NOLOCK)
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND m.data >= DATEADD(DAY, -${diasPeriodo}, GETDATE())
        AND m.data >= ${dataLimite}
    ),
    RetornosDetectados AS (
      -- Retorno: protocolo volta para o setor de onde saiu
      SELECT
        mc.codSetorOrigem,
        mc.CodProt
      FROM MovimentacoesComAnterior mc
      WHERE mc.codSetorDestino = ${codigoSetor}  -- Voltou para o setor
        AND mc.setorAnterior IS NOT NULL         -- Não é primeira movimentação
        AND mc.codSetorOrigem != ${codigoSetor}  -- Veio de outro setor
    )
    SELECT TOP 5
      r.codSetorOrigem,
      s.DESCR AS nomeSetorOrigem,
      COUNT(DISTINCT r.CodProt) AS quantidade
    FROM RetornosDetectados r
    INNER JOIN SETOR s ON r.codSetorOrigem = s.CODIGO
    GROUP BY r.codSetorOrigem, s.DESCR
    ORDER BY COUNT(DISTINCT r.CodProt) DESC;
  `;

  // Query auxiliar: total de saidas do setor (para calcular percentuais)
  // OTIMIZAÇÃO: Remove JOIN com documento
  const queryTotalSaidas = `
    SELECT COUNT(*) AS totalSaidas
    FROM scd_movimentacao m WITH (NOLOCK)
    WHERE m.codSetorOrigem = ${codigoSetor}
      AND m.codSetorDestino != ${codigoSetor}
      AND (m.Deletado IS NULL OR m.Deletado = 0)
      AND m.data >= DATEADD(DAY, -${diasPeriodo}, GETDATE())
      AND m.data >= ${dataLimite};
  `;

  // Query auxiliar: nome do setor
  const queryNomeSetor = `
    SELECT DESCR AS nome FROM SETOR WHERE CODIGO = ${codigoSetor};
  `;

  // Executa todas as queries em paralelo
  const [
    setorVsMediaResult,
    protocolosCriticosResult,
    evolucaoResult,
    destinosResult,
    retornosResult,
    totalSaidasResult,
    nomeSetorResult,
  ] = await Promise.all([
    executeQuery<{
      codSetor: number;
      nomeSetor: string;
      setorPendentes: number;
      setorTempoMedio: number;
      setorSlaPercent: number;
      posicao: number;
      totalSetores: number;
      mediaTempoMedio: number;
      mediaSlaPercent: number;
      mediaPendentes: number;
    }>(querySetorVsMedia),
    executeQuery<{
      codProtocolo: number;
      numeroProtocolo: string;
      assunto: string;
      tipoDocumento: string;
      diasParado: number;
    }>(queryProtocolosCriticos),
    executeQuery<{
      mes: string;
      mesLabel: string;
      entradas: number;
      saidas: number;
    }>(queryEvolucao),
    executeQuery<{
      codSetorDestino: number;
      nomeSetorDestino: string;
      quantidade: number;
    }>(queryDestinos),
    executeQuery<{
      codSetorOrigem: number;
      nomeSetorOrigem: string;
      quantidade: number;
    }>(queryRetornos),
    executeQuery<{ totalSaidas: number }>(queryTotalSaidas),
    executeQuery<{ nome: string }>(queryNomeSetor),
  ]);

  // Processa Setor vs Media
  const svmRow = setorVsMediaResult[0];
  const setorVsMedia: SetorVsMediaData = svmRow
    ? {
        setor: {
          codSetor: svmRow.codSetor,
          nomeSetor: svmRow.nomeSetor.replace(/^- /, ""),
          tempoMedio: Math.round(svmRow.setorTempoMedio * 10) / 10,
          slaPercent: Math.round(svmRow.setorSlaPercent || 0),
          pendentes: svmRow.setorPendentes,
        },
        media: {
          tempoMedio: Math.round((svmRow.mediaTempoMedio || 0) * 10) / 10,
          slaPercent: Math.round(svmRow.mediaSlaPercent || 0),
          pendentes: Math.round(svmRow.mediaPendentes || 0),
        },
        ranking: {
          posicao: svmRow.posicao,
          totalSetores: svmRow.totalSetores,
        },
      }
    : {
        setor: {
          codSetor: codigoSetor,
          nomeSetor: nomeSetorResult[0]?.nome?.replace(/^- /, "") || "Setor",
          tempoMedio: 0,
          slaPercent: 100,
          pendentes: 0,
        },
        media: { tempoMedio: 0, slaPercent: 100, pendentes: 0 },
        ranking: { posicao: 0, totalSetores: 0 },
      };

  // Processa Protocolos Criticos
  const protocolosCriticos: ProtocoloCritico[] = protocolosCriticosResult.map((p) => ({
    codProtocolo: p.codProtocolo,
    numeroProtocolo: p.numeroProtocolo || String(p.codProtocolo),
    assunto: p.assunto || "",
    tipoDocumento: p.tipoDocumento,
    diasParado: p.diasParado,
    status: p.diasParado > 30 ? "critico" : p.diasParado > SLA_DIAS ? "urgente" : "emDia",
  }));

  // Processa Evolucao Mensal
  const evolucaoSetor: EvolucaoSetorMes[] = evolucaoResult.map((e) => ({
    mes: e.mes,
    mesLabel: e.mesLabel,
    entradas: e.entradas,
    saidas: e.saidas,
    saldo: e.entradas - e.saidas,
  }));

  // Processa Fluxo (Destinos + Retornos)
  const totalSaidas = totalSaidasResult[0]?.totalSaidas || 0;
  const totalRetornos = retornosResult.reduce((sum, r) => sum + r.quantidade, 0);

  const arquivosCodigos = new Set<number>(SETORES.ARQUIVOS);

  const destinos: DestinoProtocolo[] = destinosResult.map((d) => ({
    codSetorDestino: d.codSetorDestino,
    nomeSetorDestino: d.nomeSetorDestino.replace(/^- /, ""),
    quantidade: d.quantidade,
    percentual: totalSaidas > 0 ? Math.round((d.quantidade / totalSaidas) * 100) : 0,
    tipoFluxo: arquivosCodigos.has(d.codSetorDestino) ? "arquivo" : "tramitacao",
  }));

  const retornos: RetornoProtocolo[] = retornosResult.map((r) => ({
    codSetorOrigem: r.codSetorOrigem,
    nomeSetorOrigem: r.nomeSetorOrigem.replace(/^- /, ""),
    quantidade: r.quantidade,
    percentual: totalSaidas > 0 ? Math.round((r.quantidade / totalSaidas) * 100) : 0,
  }));

  const fluxoSetor: FluxoSetorData = {
    destinos,
    retornos,
    totalSaidas,
    totalRetornos,
    percentualRetorno: totalSaidas > 0 ? Math.round((totalRetornos / totalSaidas) * 100) : 0,
  };

  const nomeSetor =
    svmRow?.nomeSetor?.replace(/^- /, "") ||
    nomeSetorResult[0]?.nome?.replace(/^- /, "") ||
    "Setor";

  const response: VisaoSetorResponse = {
    setor: { codigo: codigoSetor, nome: nomeSetor },
    periodo,
    ano,
    dataAtualizacao: new Date().toISOString(),
    setorVsMedia,
    protocolosCriticos,
    evolucaoSetor,
    fluxoSetor,
  };

  return NextResponse.json(response);
});

export const revalidate = 300; // 5 minutos
