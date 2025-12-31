/**
 * Queries SQL para análise temporal
 *
 * Módulo de entrada que seleciona a query correta baseada no setor e período.
 */

import { TODOS_SETORES } from "@/lib/constants";
import { buildTemporalSetorQuery } from "./temporal-setor";
import { buildTemporalMacroQuery } from "./temporal-macro";

export { buildTemporalSetorQuery } from "./temporal-setor";
export { buildTemporalMacroQuery } from "./temporal-macro";

/**
 * Seleciona a query temporal correta baseada no setor e período
 *
 * @param setor - Código do setor (0 = visão macro/todos os setores)
 * @param periodo - Período de análise: '7d', '30d', '90d', 'ytd', '12m'
 * @returns Query SQL formatada
 */
export function buildTemporalQuery(setor: number, periodo: string): string {
  if (setor === TODOS_SETORES) {
    return buildTemporalMacroQuery(periodo);
  }
  return buildTemporalSetorQuery(setor, periodo);
}
