/**
 * Tipos relacionados a Protocolos
 */

// ============================================================================
// TIPOS DE STATUS
// ============================================================================

/**
 * Status possíveis de um protocolo
 *
 * Inclui status inferidos automaticamente pela função inferirSituacao()
 * para corrigir registros históricos com codSituacaoProt = NULL
 */
export type StatusProtocolo =
  | "Em Andamento"
  | "Finalizado"
  | "Histórico"
  | "Arquivado" // Inferido: setor destino é ARQUIVO
  | "Em Tramitação" // Status genérico de tramitação
  | "Em Análise" // Inferido: setor destino é Gerência de Projetos
  | "Encaminhado ao Jurídico" // Inferido: setor destino é Jurídico
  | "Recebido"; // Status padrão (fallback)

/**
 * Variantes visuais para badges de status
 */
export type StatusVisual = "danger" | "warning" | "info" | "success";

// ============================================================================
// INTERFACES PRINCIPAIS
// ============================================================================

export interface Protocolo {
  codprot: number;
  numeroDocumento: string;
  assunto: string | null;
  assuntoNormalizado?: string; // Categoria normalizada (rubrica)
  remetente: string | null;
  projeto: string | null;
  numconv: number | null;
  contaCorrente: string | null;
  setorOrigem: string | null;
  setorDestinoAtual: string | null;
  setorAtualCodigo?: number; // Código do setor atual
  setorOrigemCodigo?: number; // Código do setor de origem
  dtEntrada: Date;
  dtSaida?: Date | null;
  dtUltimaMovimentacao: Date;
  statusProtocolo: StatusProtocolo;
  diasNoFinanceiro?: number;
  diasTramitacao?: number;
  diasSemMovimentacao?: number; // Dias desde a última movimentação
  estagnado?: boolean | number; // Flag: protocolo parado há >365 dias
  qtdSetoresVisitados?: number;
  faixaTempo: string;
  periodoEntrada: string;
  anoEntrada: number;
  mesEntrada: number;
  diaSemanaNum?: number; // 1=Domingo, 2=Segunda... (DATEPART WEEKDAY do SQL Server)
  horaEntrada?: number; // 0-23
  statusVisual: StatusVisual;
  // Indicadores de relacionamento Mãe/Filho
  qtdFilhos?: number; // Quantidade de protocolos filhos (é protocolo mãe)
  ehFilhoDe?: number; // Quantidade de protocolos mãe (é protocolo filho)
  // NOVOS CAMPOS (2026-01-07): Usuário e interessado
  codUsuarioCadastro?: number; // Código do usuário que cadastrou
  usuarioCadastro?: string | null; // Nome do usuário que cadastrou o protocolo
  interessado?: string | null; // Pessoa interessada/beneficiário
  remetenteExterno?: string | null; // Remetente externo (mesmo que remetente)
  loginCadastro?: string | null; // Login do usuário que cadastrou
}

/**
 * Interface de KPIs - VERSÃO REFATORADA
 *
 * Baseado no RELATORIO_COMPARATIVO_QUERIES.md
 * Métricas focadas no status ATUAL do setor (RegAtual = 1)
 *
 * ATUALIZAÇÃO: Agora suporta filtro de período dinâmico
 * - totalEmAndamento, emDia, urgentes, criticos: Sempre atual (não filtrado)
 * - novosMesAtual: Aplica filtro de período
 * - mediaDias, min, max: Aplica filtro nos finalizados do período
 */
export interface KPIs {
  // Protocolos ATUALMENTE no setor (RegAtual = 1)
  // NOTA: Sempre atual, não faz sentido filtrar por período
  totalEmAndamento: number;

  // Novos protocolos que ENTRARAM no período selecionado
  // NOTA: Respeita o filtro de período (mes_atual, 30d, 90d, etc.)
  novosMesAtual: number;

  // Média de dias de permanência (protocolos finalizados no período)
  mediaDiasFinanceiro: number;

  // Menor tempo de permanência (protocolos finalizados no período)
  minDiasFinanceiro: number | null;

  // Maior tempo de permanência (protocolos finalizados no período)
  maxDiasFinanceiro: number | null;

  // Protocolos ATUALMENTE no setor há menos de 15 dias (em dia)
  // NOTA: Sempre atual, não faz sentido filtrar por período
  emDiaMenos15Dias: number;

  // Protocolos ATUALMENTE no setor entre 15-30 dias
  // NOTA: Sempre atual, não faz sentido filtrar por período
  urgentes15a30Dias: number;

  // Protocolos ATUALMENTE no setor há mais de 30 dias
  // NOTA: Sempre atual, não faz sentido filtrar por período
  criticosMais30Dias: number;

  // Total de protocolos que entraram no período (contexto)
  totalNoPeriodo?: number;

  // Total de protocolos finalizados no período
  finalizadosNoPeriodo?: number;
}

export interface TimelineItem {
  idMovimentacao: number;
  codprot: number;
  dataMovimentacao: Date;
  dataFormatada: string;
  setorOrigem: string | null;
  setorDestino: string | null;
  numDocumento: string | null;
  ordemMovimentacao?: number;
  isAtual?: number | boolean;
  horasNoSetorAnterior?: number | null;
  horasNoSetorDestino?: number | null;
  diasNoSetorDestino?: number | null;
  // Campos legados (compatibilidade)
  tipoMovimentacao?: "Entrada no Financeiro" | "Saída do Financeiro" | "Movimentação Externa";
  horasDesdeAnterior?: number | null;
  // Novos campos de situação (com correção de NULLs)
  codSituacaoReal?: number;
  situacaoDescricao?: string;
  situacaoInferida?: boolean;
  // NOVOS CAMPOS (2026-01-07): Usuários de envio e recebimento
  codUsuarioEnvio?: number; // Código do usuário que enviou
  usuarioQueEnviou?: string | null; // Nome do usuário que enviou
  codUsuarioRecebeu?: number; // Código do usuário que recebeu
  usuarioQueRecebeu?: string | null; // Nome do usuário que recebeu
  dataRecebimento?: Date | null; // Data/hora do recebimento
  dataRecebimentoFormatada?: string | null; // Data formatada do recebimento
  minutosAteRecebimento?: number | null; // Tempo em minutos até o recebimento
}

// ============================================================================
// TIPOS DE MOVIMENTAÇÃO
// ============================================================================

/**
 * Interface para Movimentação de Protocolo
 *
 * Inclui campos calculados para corrigir o bug histórico de NULLs
 * na coluna codSituacaoProt.
 */
export interface Movimentacao {
  /** ID único da movimentação */
  idMovimentacao: number;

  /** Código do protocolo */
  codprot: number;

  /** Data/hora da movimentação */
  dataMovimentacao: Date;

  /** Data formatada para exibição (dd/MM/yyyy HH:mm) */
  dataFormatada: string;

  /** Código do setor de origem */
  codSetorOrigem: number;

  /** Código do setor de destino */
  codSetorDestino: number;

  /** Nome do setor de origem */
  setorOrigem: string | null;

  /** Nome do setor de destino */
  setorDestino: string | null;

  /** Número do documento */
  numDocumento: string | null;

  /** Flag indicando se é a movimentação atual (RegAtual = 1) */
  isAtual: boolean | number;

  /** Observação da movimentação */
  observacao?: string | null;

  /**
   * Código da situação REAL (corrigido)
   *
   * Este valor NUNCA é null - se o valor original era NULL,
   * foi calculado automaticamente baseado no setor de destino.
   */
  codSituacaoReal: number;

  /**
   * Descrição da situação
   *
   * Se foi calculada automaticamente, inclui sufixo "(Auto)"
   */
  situacaoDescricao: string;

  /**
   * Flag indicando se a situação foi inferida automaticamente
   *
   * true = valor original era NULL, foi calculado
   * false = valor veio preenchido do banco
   */
  situacaoInferida: boolean;

  /** Assunto do documento (opcional, em listagens) */
  assunto?: string | null;

  // NOVOS CAMPOS (2026-01-07): Usuários de envio e recebimento
  /** Código do usuário que enviou */
  codUsuarioEnvio?: number;
  /** Nome do usuário que enviou */
  usuarioQueEnviou?: string | null;
  /** Login do usuário que enviou */
  loginUsuarioEnvio?: string | null;
  /** Código do usuário que recebeu */
  codUsuarioRecebeu?: number;
  /** Nome do usuário que recebeu */
  usuarioQueRecebeu?: string | null;
  /** Login do usuário que recebeu */
  loginUsuarioRecebeu?: string | null;
  /** Data/hora do recebimento */
  dataRecebimento?: Date | null;
  /** Data formatada do recebimento (dd/MM/yyyy HH:mm) */
  dataRecebimentoFormatada?: string | null;
  /** Tempo em minutos até o recebimento */
  minutosAteRecebimento?: number | null;
}

/**
 * Contagem de movimentações por situação
 */
export interface ContagemPorSituacao {
  codSituacao: number;
  descricaoSituacao: string;
  total: number;
  totalInferidos: number;
}

/**
 * Estatísticas de qualidade dos dados
 */
export interface EstatisticasQualidade {
  totalMovimentacoes: number;
  totalSemSituacao: number;
  totalComSituacao: number;
  percentualSemSituacao: number;
}

/**
 * Input para criação de nova movimentação
 * (antes da transformação do Zod)
 */
export interface MovimentacaoInput {
  codDocumento: number;
  codSetorOrigem: number;
  codSetorDestino: number;
  observacao?: string;
  dataMovimentacao?: Date;
  codSituacaoProt?: number | null;
}

/**
 * Output após validação e transformação do Zod
 * (codSituacaoProt sempre preenchido)
 */
export interface MovimentacaoOutput extends MovimentacaoInput {
  codSituacaoProt: number; // Garantido não-null após transformação
}

// ============================================================================
// TIPOS ENRIQUECIDOS - Dados completos do protocolo
// ============================================================================

/**
 * Dados básicos completos do protocolo (Query 1)
 */
export interface ProtocoloDadosBasicos {
  codProtocolo: number;
  numeroProtocolo: string;
  numeroDocumento: string | null;
  numeroControle: string | null;
  dataDocumento: Date | null;
  dataCadastro: Date;
  horaCadastro: string | null;
  assunto: string | null;
  descricao: string | null;
  observacoes: string | null;
  notaFiscal: string | null;
  numeroOficio: string | null;
  remetente: string | null;
  despachante: string | null;
  interessado: string | null;
  destinatario: string | null;
  tipoDocumento: string | null;
  assuntoCategorizado: string | null;
  instituicao: string | null;
  unidade: string | null;
  departamento: string | null;
  numConv: number | null;
  tituloProjeto: string | null;
  codPessoa: number | null;
  nomePessoa: string | null;
  cpfCnpj: string | null;
  usuarioCadastro: string | null;
}

/**
 * Histórico de tramitação detalhado (Query 2)
 */
export interface HistoricoTramitacao {
  codMovimentacao: number;
  codProtocolo: number;
  numDocumento: string | null;
  dataMovimentacao: Date;
  horaMovimentacao: Date;
  dataRecebimento: Date | null;
  dataCadastroMov: Date;
  codSetorOrigem: number;
  setorOrigem: string | null;
  codUsuOrigem: number | null;
  usuarioOrigem: string | null;
  codSetorDestino: number;
  setorDestino: string | null;
  codDestinatario: number | null;
  usuarioDestinatario: string | null;
  codUsuario: number | null;
  usuarioMovimentou: string | null;
  despachante: string | null;
  codSituacaoProt: number | null;
  situacao: string | null;
  observacaoMovimentacao: string | null;
  outros: string | null;
  ehRegistroAtual: number;
  ehPrimeiroRegistro: number;
  diasNoSetor: number;
}

/**
 * Situação atual do protocolo (Query 3)
 */
export interface SituacaoAtual {
  codMovimentacaoAtual: number;
  setorAtual: string | null;
  usuarioResponsavel: string | null;
  situacaoAtual: string | null;
  dataUltimaMovimentacao: Date;
  dataRecebimento: Date | null;
  diasNoSetorAtual: number;
  observacaoAtual: string | null;
}

/**
 * Origem do protocolo (Query 4)
 */
export interface OrigemProtocolo {
  dataCriacao: Date;
  horaCriacao: Date;
  setorOrigem: string | null;
  usuarioCriador: string | null;
  observacaoInicial: string | null;
}

/**
 * Relacionamento mãe/filho de protocolo (Queries 5, 6)
 */
export interface RelacionamentoProtocolo {
  tipoProtocolo: "MAE" | "FILHO";
  protocoloMae?: string;
  protocoloFilho?: string;
  observacaoVinculo: string | null;
  valorVinculo: number | null;
  dataVinculo: Date | null;
}

/**
 * Árvore de relacionamentos (Query 7)
 */
export interface ArvoreProtocolo {
  codigo: number;
  numero: string;
  nivel: number;
  caminho: string;
  relacao: "CONSULTADO" | "FILHO";
}

/**
 * Lançamento financeiro vinculado (Query 8)
 */
export interface LancamentoFinanceiro {
  codFinanceiro: number;
  dataLancamento: Date;
  dataDocumento: Date | null;
  numeroProtocoloFinanc: string | null;
  notaFiscal: string | null;
  valorBruto: number;
  valorLiquido: number;
  descricao: string | null;
  observacao: string | null;
  fornecedor: string | null;
  cpfCnpj: string | null;
  projeto: string | null;
  rubrica: string | null;
  descricaoRubrica: string | null;
  tipoLancamento: string | null;
  status: "CANCELADO" | "LIBERADO" | "PENDENTE";
}

/**
 * Requisição de compra vinculada (Query 9)
 */
export interface RequisicaoCompra {
  codRequisicao: number;
  numeroRequisicao: string;
  dataRequisicao: Date;
  observacao: string | null;
  projeto: string | null;
  solicitante: string | null;
  status: "LIBERADA" | "REJEITADA" | "PENDENTE" | "EM ANALISE";
  valorLimite: number | null;
}

/**
 * Observação em movimentação (Query 10)
 */
export interface ObservacaoMovimentacao {
  dataMovimentacao: Date;
  observacao: string;
  outrasAnotacoes: string | null;
  usuario: string | null;
  setor: string | null;
  situacao: string | null;
}

/**
 * Item de movimentação (Query 11)
 */
export interface ItemMovimentacao {
  codItem: number;
  titulo: string | null;
  observacao1: string | null;
  observacao2: string | null;
  dataItem: Date | null;
  valorItem: number | null;
  dataCadastro: Date;
  confirmado: boolean;
  dataConfirmacao: Date | null;
  usuarioCadastro: string | null;
}

/**
 * Registro de auditoria (Queries 12, 13)
 */
export interface RegistroAuditoria {
  codigo: number;
  alteracaoDescrita: string;
  dataAlteracao: Date;
  usuarioAlteracao: string | null;
  tabelaRef: string | null;
}

/**
 * Arquivo anexado (Query 14)
 */
export interface ArquivoAnexado {
  codAnexo: number;
  nomeArquivo: string;
  descricaoAnexo: string | null;
  dataAnexo: Date;
  tabelaOrigem: string;
}

/**
 * Tempo por setor (Query 15)
 */
export interface TempoSetor {
  setor: string;
  dataEntrada: Date;
  dataSaida: Date;
  diasNoSetor: number;
  status: "ATUAL" | "";
}

/**
 * Resumo de tempo por setor (Query 16)
 */
export interface ResumoTempoSetor {
  setor: string;
  vezesNoSetor: number;
  diasTotal: number;
  mediaDias: number;
}

/**
 * Idade do protocolo (Query 17)
 */
export interface IdadeProtocolo {
  protocolo: string;
  dataCriacao: Date;
  idadeEmDias: number;
  idadeEmMeses: number;
  ultimaMovimentacao: Date | null;
  diasSemMovimentacao: number | null;
}

/**
 * Dados completos do protocolo - Query Master (Query 18)
 */
export interface ProtocoloCompleto {
  // Dados básicos
  codigo: number;
  numero: string;
  numDoc: string | null;
  assunto: string | null;
  descricao: string | null;
  obs: string | null;
  dataDocumento: Date | null;
  dataCadastro: Date;
  remetente: string | null;
  despachante: string | null;
  interessado: string | null;
  tipoDocumento: string | null;
  instituicao: string | null;
  numConv: number | null;
  projeto: string | null;
  pessoa: string | null;
  cgcCpf: string | null;

  // Situação atual
  setorAtual: string | null;
  responsavelAtual: string | null;
  situacaoAtual: string | null;
  dataUltimaMovimentacao: Date | null;

  // Métricas
  totalMovimentacoes: number;
  totalItens: number;
  lancamentosFinanceiros: number;
  protocolosFilhos: number;
  ehFilhoDe: number;
  idadeEmDias: number;
}

/**
 * Resposta completa com todos os dados enriquecidos do protocolo
 */
export interface ProtocoloEnriquecido {
  dadosBasicos: ProtocoloDadosBasicos | null;
  situacaoAtual: SituacaoAtual | null;
  origem: OrigemProtocolo | null;
  historico: HistoricoTramitacao[];
  lancamentosFinanceiros: LancamentoFinanceiro[];
  requisicoes: RequisicaoCompra[];
  observacoes: ObservacaoMovimentacao[];
  relacionamentos: {
    filhos: RelacionamentoProtocolo[];
    maes: RelacionamentoProtocolo[];
    arvore: ArvoreProtocolo[];
  };
  tempoTramitacao: {
    porSetor: TempoSetor[];
    resumo: ResumoTempoSetor[];
  };
  idade: IdadeProtocolo | null;
  anexos: ArquivoAnexado[];
  auditoria: {
    documento: RegistroAuditoria[];
    movimentacoes: RegistroAuditoria[];
  };
  itensMovimentacao: ItemMovimentacao[];
  metricas: {
    totalMovimentacoes: number;
    totalLancamentosFinanceiros: number;
    valorTotalFinanceiro: number;
    totalRequisicoes: number;
    totalAnexos: number;
    diasTramitacao: number;
  };
}
