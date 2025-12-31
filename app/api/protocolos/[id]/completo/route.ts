import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import {
  QUERY_DADOS_BASICOS,
  QUERY_SITUACAO_ATUAL,
  QUERY_ORIGEM,
  QUERY_HISTORICO_TRAMITACAO,
  QUERY_FINANCEIRO,
  QUERY_REQUISICOES,
  QUERY_OBSERVACOES,
  QUERY_PROTOCOLO_MAE,
  QUERY_PROTOCOLO_FILHO,
  QUERY_ARVORE,
  QUERY_TEMPO_SETOR,
  QUERY_RESUMO_TEMPO,
  QUERY_IDADE,
  QUERY_ANEXOS,
  QUERY_AUDITORIA_DOC,
  QUERY_AUDITORIA_MOV,
  QUERY_ITENS,
} from "@/lib/queries/protocolo-enriquecido";
import { withErrorHandling, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  ProtocoloEnriquecido,
  ProtocoloDadosBasicos,
  SituacaoAtual,
  OrigemProtocolo,
  HistoricoTramitacao,
  LancamentoFinanceiro,
  RequisicaoCompra,
  ObservacaoMovimentacao,
  RelacionamentoProtocolo,
  ArvoreProtocolo,
  TempoSetor,
  ResumoTempoSetor,
  IdadeProtocolo,
  ArquivoAnexado,
  RegistroAuditoria,
  ItemMovimentacao,
} from "@/types/protocolo";

/**
 * GET /api/protocolos/[id]/completo
 *
 * Retorna todos os dados enriquecidos de um protocolo:
 * - Dados básicos
 * - Situação atual
 * - Origem (quem criou)
 * - Histórico completo de tramitação
 * - Lançamentos financeiros vinculados
 * - Requisições de compra
 * - Observações
 * - Relacionamentos (mãe/filho)
 * - Tempo de tramitação por setor
 * - Idade do protocolo
 * - Anexos
 * - Auditoria
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const startTime = Date.now();
    const { id } = await params;
    const protocoloId = parseInt(id, 10);

    if (isNaN(protocoloId) || protocoloId <= 0) {
      throw new ValidationError("ID de protocolo inválido");
    }

    // Executar todas as queries em paralelo para melhor performance
    const [
      dadosBasicos,
      situacaoAtual,
      origem,
      historico,
      financeiro,
      requisicoes,
      observacoes,
      filhos,
      maes,
      arvore,
      tempoSetor,
      resumoTempo,
      idade,
      anexos,
      auditoriaDoc,
      auditoriaMov,
      itens,
    ] = await Promise.all([
      executeQuery<ProtocoloDadosBasicos>(QUERY_DADOS_BASICOS, { codProtocolo: protocoloId }),
      executeQuery<SituacaoAtual>(QUERY_SITUACAO_ATUAL, { codProtocolo: protocoloId }),
      executeQuery<OrigemProtocolo>(QUERY_ORIGEM, { codProtocolo: protocoloId }),
      executeQuery<HistoricoTramitacao>(QUERY_HISTORICO_TRAMITACAO, { codProtocolo: protocoloId }),
      executeQuery<LancamentoFinanceiro>(QUERY_FINANCEIRO, { codProtocolo: protocoloId }),
      executeQuery<RequisicaoCompra>(QUERY_REQUISICOES, { codProtocolo: protocoloId }),
      executeQuery<ObservacaoMovimentacao>(QUERY_OBSERVACOES, { codProtocolo: protocoloId }),
      executeQuery<RelacionamentoProtocolo>(QUERY_PROTOCOLO_MAE, { codProtocolo: protocoloId }),
      executeQuery<RelacionamentoProtocolo>(QUERY_PROTOCOLO_FILHO, { codProtocolo: protocoloId }),
      executeQuery<ArvoreProtocolo>(QUERY_ARVORE, { codProtocolo: protocoloId }),
      executeQuery<TempoSetor>(QUERY_TEMPO_SETOR, { codProtocolo: protocoloId }),
      executeQuery<ResumoTempoSetor>(QUERY_RESUMO_TEMPO, { codProtocolo: protocoloId }),
      executeQuery<IdadeProtocolo>(QUERY_IDADE, { codProtocolo: protocoloId }),
      executeQuery<ArquivoAnexado>(QUERY_ANEXOS, { codProtocolo: protocoloId }),
      executeQuery<RegistroAuditoria>(QUERY_AUDITORIA_DOC, { codProtocolo: protocoloId }),
      executeQuery<RegistroAuditoria>(QUERY_AUDITORIA_MOV, { codProtocolo: protocoloId }),
      executeQuery<ItemMovimentacao>(QUERY_ITENS, { codProtocolo: protocoloId }),
    ]);

    // Calcular métricas
    const valorTotalFinanceiro = financeiro.reduce((acc, f) => {
      const valor = Math.abs(f.valorLiquido || 0);
      return acc + valor;
    }, 0);

    const idadeData = idade[0] || null;

    // Montar resposta estruturada
    const response: ProtocoloEnriquecido = {
      dadosBasicos: dadosBasicos[0] || null,
      situacaoAtual: situacaoAtual[0] || null,
      origem: origem[0] || null,
      historico: historico,
      lancamentosFinanceiros: financeiro,
      requisicoes: requisicoes,
      observacoes: observacoes,
      relacionamentos: {
        filhos: filhos,
        maes: maes,
        arvore: arvore,
      },
      tempoTramitacao: {
        porSetor: tempoSetor,
        resumo: resumoTempo,
      },
      idade: idadeData,
      anexos: anexos,
      auditoria: {
        documento: auditoriaDoc,
        movimentacoes: auditoriaMov,
      },
      itensMovimentacao: itens,
      metricas: {
        totalMovimentacoes: historico.length,
        totalLancamentosFinanceiros: financeiro.length,
        valorTotalFinanceiro,
        totalRequisicoes: requisicoes.length,
        totalAnexos: anexos.length,
        diasTramitacao: idadeData?.idadeEmDias || 0,
      },
    };

    const elapsed = Date.now() - startTime;
    logger.perf(`📦 Protocolo completo ${protocoloId}: ${elapsed}ms`);

    return NextResponse.json({
      data: response,
      success: true,
      tempoMs: elapsed,
    });
  }
);

export const revalidate = 60; // Cache de 1 minuto
