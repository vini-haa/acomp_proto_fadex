/**
 * Ponto de entrada para utilitários da aplicação
 *
 * Uso:
 * import { formatCurrency, getValue, cn } from "@/lib";
 */

// Funções de formatação
export { formatCurrency, formatCPFCNPJ, formatNumber } from "./formatting";

// Helpers para objetos
export { getValue } from "./object-helpers";

// Utilitários gerais
export { cn } from "./utils";

// Classes de erro
export { AppError, NotFoundError, ValidationError, DatabaseError } from "./errors";

// Logger
export { logger } from "./logger";
