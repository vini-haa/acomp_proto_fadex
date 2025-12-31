/**
 * Utilitários para exportação de dados em Excel
 * Usando ExcelJS (substituindo xlsx vulnerável)
 */

import ExcelJS from "exceljs";

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  includeTimestamp?: boolean;
}

/**
 * Helper para fazer download do arquivo no navegador
 */
async function downloadExcelFile(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta dados para Excel e faz download
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExcelExportOptions = {}
): Promise<void> {
  const { filename = "export", sheetName = "Dados", includeTimestamp = true } = options;

  // Criar workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Portal FADEX";
  workbook.created = new Date();

  // Criar worksheet
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length === 0) {
    // Gerar nome do arquivo
    const timestamp = includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : "";
    const fullFilename = `${filename}${timestamp}.xlsx`;
    await downloadExcelFile(workbook, fullFilename);
    return;
  }

  // Definir colunas baseado nas chaves do primeiro objeto
  const keys = Object.keys(data[0]);
  worksheet.columns = keys.map((key) => {
    // Calcular largura da coluna
    const maxWidth = 50;
    const maxLength = Math.max(key.length, ...data.map((row) => String(row[key] || "").length));
    return {
      header: key,
      key: key,
      width: Math.min(maxLength + 2, maxWidth),
    };
  });

  // Adicionar dados
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Estilizar cabeçalho
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Gerar nome do arquivo
  const timestamp = includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : "";
  const fullFilename = `${filename}${timestamp}.xlsx`;

  // Fazer download
  await downloadExcelFile(workbook, fullFilename);
}

/**
 * Exporta múltiplas planilhas para um único arquivo Excel
 */
export async function exportMultiSheetExcel(
  sheets: Array<{
    name: string;
    data: Record<string, unknown>[];
  }>,
  filename: string = "export"
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Portal FADEX";
  workbook.created = new Date();

  sheets.forEach(({ name, data }) => {
    const worksheet = workbook.addWorksheet(name);

    if (data.length === 0) {
      return;
    }

    // Definir colunas
    const keys = Object.keys(data[0]);
    const maxWidth = 50;
    worksheet.columns = keys.map((key) => {
      const maxLength = Math.max(key.length, ...data.map((row) => String(row[key] || "").length));
      return {
        header: key,
        key: key,
        width: Math.min(maxLength + 2, maxWidth),
      };
    });

    // Adicionar dados
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Estilizar cabeçalho
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  await downloadExcelFile(workbook, `${filename}_${timestamp}.xlsx`);
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

/**
 * Exporta protocolos para Excel
 */
export async function exportProtocolosToExcel(protocolos: ProtocoloExport[]): Promise<void> {
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

  await exportToExcel(data, {
    filename: "protocolos",
    sheetName: "Protocolos",
  });
}
