/**
 * Categorias de Assunto (Rubricas Normalizadas)
 *
 * Reduz ~7.022 assuntos diferentes para 21 categorias padronizadas
 * baseadas em rubricas orçamentárias e tipos de documentos.
 */

/**
 * Categorias normalizadas de assunto/rubrica
 */
export const ASSUNTOS_NORMALIZADOS = [
  "33.90.14 - DIÁRIAS",
  "33.90.18 - BOLSA",
  "33.90.20 - BOLSAS PESQUISADOR",
  "33.90.30 - MATERIAL DE CONSUMO",
  "33.90.33 - PASSAGENS E LOCOMOÇÃO",
  "33.90.36 - SERVIÇOS PF",
  "33.90.39 - SERVIÇOS PJ",
  "33.90.49 - AUXÍLIO TRANSPORTE",
  "44.90.52 - MATERIAL PERMANENTE",
  "SUPRIMENTO DE FUNDOS",
  "PRESTAÇÃO DE CONTAS",
  "REMANEJAMENTO",
  "LOTE DE PAGAMENTOS",
  "RENDIMENTO",
  "RELATÓRIO DE VIAGEM",
  "OFÍCIO",
  "ABERTURA DE CONTA",
  "ENCERRAMENTO DE CONTA",
  "OUTROS",
  "(Sem Assunto)",
] as const;

export type AssuntoNormalizado = (typeof ASSUNTOS_NORMALIZADOS)[number];

/**
 * Normaliza um assunto bruto para uma categoria padronizada
 *
 * @param assunto - Assunto original do documento
 * @returns Categoria normalizada
 *
 * @example
 * normalizarAssunto("BOLSA - PROJETO XYZ") // "33.90.18 - BOLSA"
 * normalizarAssunto("33.90.14 - DIARIAS") // "33.90.14 - DIÁRIAS"
 * normalizarAssunto(null) // "(Sem Assunto)"
 */
export function normalizarAssunto(assunto: string | null | undefined): AssuntoNormalizado {
  if (!assunto || assunto.trim() === "") {
    return "(Sem Assunto)";
  }

  const upper = assunto.toUpperCase().trim();

  // Já está no formato de rubrica orçamentária
  if (upper.startsWith("33.") || upper.startsWith("44.")) {
    // Mapear para categoria padronizada
    if (upper.includes("33.90.14")) {
      return "33.90.14 - DIÁRIAS";
    }
    if (upper.includes("33.90.18")) {
      return "33.90.18 - BOLSA";
    }
    if (upper.includes("33.90.20")) {
      return "33.90.20 - BOLSAS PESQUISADOR";
    }
    if (upper.includes("33.90.30")) {
      return "33.90.30 - MATERIAL DE CONSUMO";
    }
    if (upper.includes("33.90.33")) {
      return "33.90.33 - PASSAGENS E LOCOMOÇÃO";
    }
    if (upper.includes("33.90.36")) {
      return "33.90.36 - SERVIÇOS PF";
    }
    if (upper.includes("33.90.39")) {
      return "33.90.39 - SERVIÇOS PJ";
    }
    if (upper.includes("33.90.49")) {
      return "33.90.49 - AUXÍLIO TRANSPORTE";
    }
    if (upper.includes("44.90.52")) {
      return "44.90.52 - MATERIAL PERMANENTE";
    }
    return "OUTROS";
  }

  // BOLSAS PESQUISADOR (verificar ANTES de BOLSA genérica)
  if (upper.includes("PESQUISADOR")) {
    return "33.90.20 - BOLSAS PESQUISADOR";
  }

  // BOLSA (genérica)
  if (upper.includes("BOLSA") || upper.includes("BOLSISTA")) {
    return "33.90.18 - BOLSA";
  }

  // DIÁRIAS
  if (upper.includes("DIARIA") || upper.includes("DIÁRIA")) {
    return "33.90.14 - DIÁRIAS";
  }

  // PASSAGENS E LOCOMOÇÃO
  if (upper.includes("PASSAGEM") || upper.includes("DESLOCAMENTO")) {
    return "33.90.33 - PASSAGENS E LOCOMOÇÃO";
  }

  // AUXÍLIO TRANSPORTE
  if (upper.includes("AUXILIO TRANSPORTE") || upper.includes("AUXÍLIO TRANSPORTE")) {
    return "33.90.49 - AUXÍLIO TRANSPORTE";
  }

  // MATERIAL PERMANENTE (verificar ANTES de COMPRAS)
  if (upper.includes("PERMANENTE") || upper.includes("EQUIPAMENTO")) {
    return "44.90.52 - MATERIAL PERMANENTE";
  }

  // MATERIAL DE CONSUMO / COMPRAS
  if (upper.includes("CONSUMO") || upper.includes("COMPRA")) {
    return "33.90.30 - MATERIAL DE CONSUMO";
  }

  // PESSOA FÍSICA (PF)
  if (
    upper.includes(" PF") ||
    upper.includes("PF ") ||
    upper.includes("-PF") ||
    upper.includes("PF-") ||
    upper.includes("PESSOA FISICA") ||
    upper.includes("PESSOA FÍSICA")
  ) {
    return "33.90.36 - SERVIÇOS PF";
  }

  // PESSOA JURÍDICA (PJ)
  if (
    upper.includes(" PJ") ||
    upper.includes("PJ ") ||
    upper.includes("-PJ") ||
    upper.includes("PJ-") ||
    upper.includes("PESSOA JURIDICA") ||
    upper.includes("PESSOA JURÍDICA")
  ) {
    return "33.90.39 - SERVIÇOS PJ";
  }

  // SUPRIMENTO DE FUNDOS
  if (upper.includes("SUPRIMENTO") && upper.includes("FUNDO")) {
    return "SUPRIMENTO DE FUNDOS";
  }

  // PRESTAÇÃO DE CONTAS
  if (upper.includes("PRESTA") && upper.includes("CONTA")) {
    return "PRESTAÇÃO DE CONTAS";
  }

  // REMANEJAMENTO
  if (upper.includes("REMANEJAMENTO")) {
    return "REMANEJAMENTO";
  }

  // LOTE DE PAGAMENTOS
  if (upper.includes("LOTE") && upper.includes("PAGAMENTO")) {
    return "LOTE DE PAGAMENTOS";
  }

  // RENDIMENTO
  if (upper.includes("RENDIMENTO")) {
    return "RENDIMENTO";
  }

  // RELATÓRIO DE VIAGEM
  if (upper.includes("RELAT") && upper.includes("VIAG")) {
    return "RELATÓRIO DE VIAGEM";
  }

  // OFÍCIO
  if (upper.includes("OFICIO") || upper.includes("OFÍCIO")) {
    return "OFÍCIO";
  }

  // ABERTURA/ENCERRAMENTO DE CONTA
  if (upper.includes("ABERTURA") && upper.includes("CONTA")) {
    return "ABERTURA DE CONTA";
  }
  if (upper.includes("ENCERRAMENTO") && upper.includes("CONTA")) {
    return "ENCERRAMENTO DE CONTA";
  }

  // Outros não classificados
  return "OUTROS";
}
