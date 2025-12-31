/**
 * Utilitários para exportação de dados em CSV
 */

import Papa from "papaparse";

export interface ExportOptions {
  filename?: string;
  delimiter?: string;
  includeTimestamp?: boolean;
}

/**
 * Exporta dados para CSV e faz download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {}
): void {
  const { filename = "export", delimiter = ",", includeTimestamp = true } = options;

  // Converter para CSV
  const csv = Papa.unparse(data, {
    delimiter,
    header: true,
  });

  // Criar blob
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });

  // Gerar nome do arquivo
  const timestamp = includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : "";
  const fullFilename = `${filename}${timestamp}.csv`;

  // Fazer download
  downloadFile(blob, fullFilename);
}

interface ProtocoloExport {
  codprot: number;
  numeroDocumento: string;
  assunto?: string | null;
  projeto?: string | null;
  statusProtocolo: string;
  dtEntrada: Date | string;
  dtSaida?: Date | string | null;
  diasNoFinanceiro?: number;
  faixaTempo?: string;
  setorOrigem?: string | null;
  setorDestino?: string | null;
}

interface KPIsExport {
  totalEmAndamento: number;
  totalFinalizados: number;
  mediaDiasFinanceiro: number;
  criticosAcima30Dias: number;
  taxaFinalizacaoMensal: number;
  protocolosRecebidosUltimos7Dias: number;
  tempoMedioFinalizacao: number;
}

/**
 * Exporta protocolos para CSV
 */
export function exportProtocolosToCSV(protocolos: ProtocoloExport[]): void {
  const data = protocolos.map((p) => ({
    Código: p.codprot,
    "Número do Documento": p.numeroDocumento,
    Assunto: p.assunto || "",
    Projeto: p.projeto || "",
    Status: p.statusProtocolo,
    "Data de Entrada": p.dtEntrada,
    "Data de Saída": p.dtSaida || "",
    "Dias no Financeiro": p.diasNoFinanceiro,
    "Faixa de Tempo": p.faixaTempo,
    "Setor Origem": p.setorOrigem || "",
    "Setor Destino": p.setorDestino || "",
  }));

  exportToCSV(data, { filename: "protocolos" });
}

/**
 * Exporta KPIs para CSV
 */
export function exportKPIsToCSV(kpis: KPIsExport): void {
  const data = [
    { Indicador: "Total em Andamento", Valor: kpis.totalEmAndamento },
    {
      Indicador: "Total Finalizados (30 dias)",
      Valor: kpis.totalFinalizados,
    },
    {
      Indicador: "Média de Dias no Financeiro",
      Valor: kpis.mediaDiasFinanceiro.toFixed(1),
    },
    { Indicador: "Protocolos Críticos (>30 dias)", Valor: kpis.criticosAcima30Dias },
    {
      Indicador: "Taxa de Finalização Mensal",
      Valor: `${kpis.taxaFinalizacaoMensal.toFixed(1)}%`,
    },
    {
      Indicador: "Protocolos Recebidos (7 dias)",
      Valor: kpis.protocolosRecebidosUltimos7Dias,
    },
    {
      Indicador: "Tempo Médio de Finalização",
      Valor: kpis.tempoMedioFinalizacao.toFixed(1),
    },
  ];

  exportToCSV(data, { filename: "kpis" });
}

/**
 * Helper para download de arquivo
 */
function downloadFile(blob: Blob, filename: string): void {
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
