import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * GET /api/protocolos/[id]/vinculos
 *
 * Retorna todos os vínculos de um protocolo:
 * - Relacionamentos Mãe/Filho (via scd_movimentacaoItem.CodProtRel)
 * - Lançamentos Financeiros vinculados (FINANCEIRO.CodProt)
 * - Bolsas associadas
 * - Pagamentos relacionados
 */

// Query para relacionamentos Mãe/Filho via scd_movimentacaoItem
const QUERY_RELACIONAMENTOS_MAE = `
SELECT
    'MAE' AS tipoRelacionamento,
    d.Codigo AS codProtocoloOrigem,
    d.Numero AS numeroProtocoloOrigem,
    dFilho.Codigo AS codProtocoloRelacionado,
    dFilho.Numero AS numeroProtocoloRelacionado,
    dFilho.Assunto AS assuntoRelacionado,
    smi.observacao AS observacaoVinculo,
    smi.Valor AS valorVinculo,
    smi.dataCad AS dataVinculo,
    'Este protocolo é MÃE (originou o protocolo relacionado)' AS descricao
FROM documento d
    INNER JOIN scd_movimentacaoItem smi ON smi.CodProt = d.Codigo
    INNER JOIN documento dFilho ON dFilho.Codigo = smi.CodProtRel
WHERE d.Codigo = @codProtocolo
  AND smi.CodProtRel IS NOT NULL
  AND (smi.deletado IS NULL OR smi.deletado = 0)
  AND (dFilho.deletado IS NULL OR dFilho.deletado = 0)
`;

const QUERY_RELACIONAMENTOS_FILHO = `
SELECT
    'FILHO' AS tipoRelacionamento,
    d.Codigo AS codProtocoloOrigem,
    d.Numero AS numeroProtocoloOrigem,
    dMae.Codigo AS codProtocoloRelacionado,
    dMae.Numero AS numeroProtocoloRelacionado,
    dMae.Assunto AS assuntoRelacionado,
    smi.observacao AS observacaoVinculo,
    smi.Valor AS valorVinculo,
    smi.dataCad AS dataVinculo,
    'Este protocolo é FILHO (foi originado do protocolo relacionado)' AS descricao
FROM documento d
    INNER JOIN scd_movimentacaoItem smi ON smi.CodProtRel = d.Codigo
    INNER JOIN documento dMae ON dMae.Codigo = smi.CodProt
WHERE d.Codigo = @codProtocolo
  AND (smi.deletado IS NULL OR smi.deletado = 0)
  AND (dMae.deletado IS NULL OR dMae.deletado = 0)
`;

// Query para lançamentos financeiros vinculados (inclui bolsas)
const QUERY_FINANCEIRO_VINCULADO = `
SELECT
    'FINANCEIRO' AS tipoRelacionamento,
    f.CODIGO AS codFinanceiro,
    f.CodProt AS codProtocolo,
    f.PROTOCOLO AS numeroProtocoloFinanceiro,
    f.TITULO AS titulo,
    f.VALORBRUTO AS valorBruto,
    f.VALORLIQUIDO AS valorLiquido,
    f.DTLANCAMENTO AS dataLancamento,
    f.DTDOCUMENTO AS dataDocumento,
    f.OBSERVACAO AS observacao,
    p.descricao AS beneficiario,
    p.cgc_cpf AS cpfCnpj,
    c.Titulo AS projeto,
    c.NumConv AS numConv,
    sh.NomeSubHist AS tipoLancamento,
    CASE
        WHEN f.CANCELADO = 1 THEN 'CANCELADO'
        WHEN f.LIBERADO = 1 THEN 'LIBERADO'
        ELSE 'PENDENTE'
    END AS status
FROM FINANCEIRO f
    LEFT JOIN PESSOAS p ON p.codigo = f.CODFORNEC
    LEFT JOIN CONVENIO c ON c.NumConv = f.NUMCONV
    LEFT JOIN subHist sh ON sh.codigo = f.CODSUBHIST
WHERE f.CodProt = @codProtocolo
  AND (f.DELETADO IS NULL OR f.DELETADO = 0)
ORDER BY f.DTLANCAMENTO DESC
`;

// Query para buscar protocolos que compartilham o mesmo número de protocolo financeiro
const QUERY_PROTOCOLOS_RELACIONADOS_FINANCEIRO = `
SELECT DISTINCT
    'PROTOCOLO_FINANCEIRO' AS tipoRelacionamento,
    f1.CodProt AS codProtocoloOrigem,
    d1.Numero AS numeroProtocoloOrigem,
    f2.CodProt AS codProtocoloRelacionado,
    d2.Numero AS numeroProtocoloRelacionado,
    d2.Assunto AS assuntoRelacionado,
    f1.PROTOCOLO AS numeroFinanceiroComum,
    f1.TITULO AS titulo,
    NULL AS valorVinculo,
    f1.DTLANCAMENTO AS dataVinculo,
    'Protocolos vinculados através do mesmo lançamento financeiro' AS descricao
FROM FINANCEIRO f1
    INNER JOIN FINANCEIRO f2 ON f1.PROTOCOLO = f2.PROTOCOLO
        AND f1.CodProt != f2.CodProt
        AND f1.PROTOCOLO IS NOT NULL
        AND f1.PROTOCOLO != ''
    INNER JOIN documento d1 ON d1.Codigo = f1.CodProt
    INNER JOIN documento d2 ON d2.Codigo = f2.CodProt
WHERE f1.CodProt = @codProtocolo
  AND (f1.DELETADO IS NULL OR f1.DELETADO = 0)
  AND (f2.DELETADO IS NULL OR f2.DELETADO = 0)
  AND (d1.deletado IS NULL OR d1.deletado = 0)
  AND (d2.deletado IS NULL OR d2.deletado = 0)
`;

// Query resumo para contagem rápida
const QUERY_RESUMO_VINCULOS = `
SELECT
    -- Filhos (este protocolo é mãe)
    (SELECT COUNT(*) FROM scd_movimentacaoItem smi
     WHERE smi.CodProt = @codProtocolo AND smi.CodProtRel IS NOT NULL
     AND (smi.deletado IS NULL OR smi.deletado = 0)) AS qtdFilhos,

    -- Mães (este protocolo é filho)
    (SELECT COUNT(*) FROM scd_movimentacaoItem smi
     WHERE smi.CodProtRel = @codProtocolo
     AND (smi.deletado IS NULL OR smi.deletado = 0)) AS qtdMaes,

    -- Lançamentos financeiros
    (SELECT COUNT(*) FROM FINANCEIRO f
     WHERE f.CodProt = @codProtocolo
     AND (f.DELETADO IS NULL OR f.DELETADO = 0)) AS qtdFinanceiro,

    -- Valor total financeiro
    (SELECT ISNULL(SUM(ABS(f.VALORLIQUIDO)), 0) FROM FINANCEIRO f
     WHERE f.CodProt = @codProtocolo
     AND (f.DELETADO IS NULL OR f.DELETADO = 0)) AS valorTotalFinanceiro,

    -- Protocolos relacionados via financeiro
    (SELECT COUNT(DISTINCT f2.CodProt) FROM FINANCEIRO f1
     INNER JOIN FINANCEIRO f2 ON f1.PROTOCOLO = f2.PROTOCOLO AND f1.CodProt != f2.CodProt
     WHERE f1.CodProt = @codProtocolo
     AND f1.PROTOCOLO IS NOT NULL AND f1.PROTOCOLO != ''
     AND (f1.DELETADO IS NULL OR f1.DELETADO = 0)
     AND (f2.DELETADO IS NULL OR f2.DELETADO = 0)) AS qtdProtocolosRelacionadosFinanceiro
`;

interface VinculoRelacionamento {
  tipoRelacionamento: string;
  codProtocoloOrigem?: number;
  numeroProtocoloOrigem?: string;
  codProtocoloRelacionado?: number;
  numeroProtocoloRelacionado?: string;
  assuntoRelacionado?: string;
  observacaoVinculo?: string;
  valorVinculo?: number;
  dataVinculo?: Date;
  descricao?: string;
}

interface VinculoFinanceiro {
  tipoRelacionamento: string;
  codFinanceiro: number;
  codProtocolo: number;
  numeroProtocoloFinanceiro: string;
  titulo: string;
  valorBruto: number;
  valorLiquido: number;
  dataLancamento: Date;
  dataDocumento?: Date;
  observacao?: string;
  beneficiario?: string;
  cpfCnpj?: string;
  projeto?: string;
  numConv?: number;
  tipoLancamento?: string;
  status: string;
}

interface ResumoVinculos {
  qtdFilhos: number;
  qtdMaes: number;
  qtdFinanceiro: number;
  valorTotalFinanceiro: number;
  qtdProtocolosRelacionadosFinanceiro: number;
}

export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const startTime = Date.now();
    const { id } = await params;
    const protocoloId = parseInt(id, 10);

    if (isNaN(protocoloId) || protocoloId <= 0) {
      throw new ValidationError("ID de protocolo inválido");
    }

    // Executar todas as queries em paralelo
    const [relacionamentosMae, relacionamentosFilho, financeiro, protocolosFinanceiro, resumo] =
      await Promise.all([
        executeQuery<VinculoRelacionamento>(QUERY_RELACIONAMENTOS_MAE, {
          codProtocolo: protocoloId,
        }),
        executeQuery<VinculoRelacionamento>(QUERY_RELACIONAMENTOS_FILHO, {
          codProtocolo: protocoloId,
        }),
        executeQuery<VinculoFinanceiro>(QUERY_FINANCEIRO_VINCULADO, { codProtocolo: protocoloId }),
        executeQuery<VinculoRelacionamento>(QUERY_PROTOCOLOS_RELACIONADOS_FINANCEIRO, {
          codProtocolo: protocoloId,
        }),
        executeQuery<ResumoVinculos>(QUERY_RESUMO_VINCULOS, { codProtocolo: protocoloId }),
      ]);

    const resumoData = resumo[0] || {
      qtdFilhos: 0,
      qtdMaes: 0,
      qtdFinanceiro: 0,
      valorTotalFinanceiro: 0,
      qtdProtocolosRelacionadosFinanceiro: 0,
    };

    // Calcular totais
    const temVinculos =
      relacionamentosMae.length > 0 ||
      relacionamentosFilho.length > 0 ||
      financeiro.length > 0 ||
      protocolosFinanceiro.length > 0;

    const elapsed = Date.now() - startTime;
    logger.perf(`🔗 Vínculos protocolo ${protocoloId}: ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      codProtocolo: protocoloId,
      temVinculos,
      resumo: {
        ...resumoData,
        totalRelacionamentos: relacionamentosMae.length + relacionamentosFilho.length,
        totalFinanceiro: financeiro.length,
        totalProtocolosRelacionados: protocolosFinanceiro.length,
      },
      relacionamentos: {
        filhos: relacionamentosMae, // Protocolos que este originou
        maes: relacionamentosFilho, // Protocolos que originaram este
      },
      financeiro: {
        lancamentos: financeiro,
        protocolosRelacionados: protocolosFinanceiro,
      },
      tempoMs: elapsed,
    });
  }
);

export const revalidate = 60; // Cache de 1 minuto
