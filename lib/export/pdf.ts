/**
 * Utilitários para exportação de dados em PDF
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface PDFExportOptions {
  filename?: string;
  title?: string;
  includeTimestamp?: boolean;
  orientation?: "portrait" | "landscape";
}

interface ProtocoloExport {
  codprot: number;
  numeroDocumento: string;
  assunto?: string | null;
  statusProtocolo: string;
  dtEntrada: Date | string;
  diasNoFinanceiro?: number;
  faixaTempo?: string;
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
 * Exporta protocolos para PDF
 */
export function exportProtocolosToPDF(
  protocolos: ProtocoloExport[],
  options: PDFExportOptions = {}
): void {
  const {
    filename = "protocolos",
    title = "Relatório de Protocolos",
    includeTimestamp = true,
    orientation = "landscape",
  } = options;

  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });

  // Cabeçalho
  addHeader(doc, title);

  // Tabela de protocolos
  const tableData = protocolos.map((p) => [
    p.codprot,
    p.numeroDocumento,
    p.assunto || "-",
    p.statusProtocolo,
    format(new Date(p.dtEntrada), "dd/MM/yyyy", { locale: ptBR }),
    p.diasNoFinanceiro ?? 0,
    p.faixaTempo ?? "-",
  ]);

  autoTable(doc, {
    head: [["Código", "Documento", "Assunto", "Status", "Data Entrada", "Dias", "Faixa"]],
    body: tableData,
    startY: 30,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 30 },
  });

  // Rodapé
  addFooter(doc);

  // Download
  const timestamp = includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : "";
  doc.save(`${filename}${timestamp}.pdf`);
}

/**
 * Exporta relatório de KPIs para PDF
 */
export function exportKPIsToPDF(kpis: KPIsExport, options: PDFExportOptions = {}): void {
  const {
    filename = "kpis",
    title = "Relatório de Indicadores (KPIs)",
    includeTimestamp = true,
  } = options;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Cabeçalho
  addHeader(doc, title);

  // Tabela de KPIs
  const tableData = [
    ["Total em Andamento", kpis.totalEmAndamento.toLocaleString("pt-BR")],
    ["Total Finalizados (30 dias)", kpis.totalFinalizados.toLocaleString("pt-BR")],
    ["Média de Dias no Financeiro", kpis.mediaDiasFinanceiro.toFixed(1)],
    ["Protocolos Críticos (>30 dias)", kpis.criticosAcima30Dias.toLocaleString("pt-BR")],
    ["Taxa de Finalização Mensal", `${kpis.taxaFinalizacaoMensal.toFixed(1)}%`],
    ["Protocolos Recebidos (7 dias)", kpis.protocolosRecebidosUltimos7Dias.toLocaleString("pt-BR")],
    ["Tempo Médio de Finalização", `${kpis.tempoMedioFinalizacao.toFixed(1)} dias`],
  ];

  autoTable(doc, {
    head: [["Indicador", "Valor"]],
    body: tableData,
    startY: 30,
    styles: { fontSize: 11, cellPadding: 5 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 12 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: "right" },
    },
    margin: { top: 30 },
  });

  // Rodapé
  addFooter(doc);

  // Download
  const timestamp = includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : "";
  doc.save(`${filename}${timestamp}.pdf`);
}

/**
 * Adiciona cabeçalho ao PDF
 */
function addHeader(doc: jsPDF, title: string): void {
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 22);
  doc.setDrawColor(200);
  doc.line(14, 24, doc.internal.pageSize.width - 14, 24);
}

/**
 * Adiciona rodapé ao PDF
 */
function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.height;

  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    `Dashboard de Protocolos FADEX - Página ${doc.getCurrentPageInfo().pageNumber} de ${pageCount}`,
    14,
    pageHeight - 10
  );
  doc.text(
    `© ${new Date().getFullYear()} FADEX`,
    doc.internal.pageSize.width - 14,
    pageHeight - 10,
    { align: "right" }
  );
}
