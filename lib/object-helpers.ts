/**
 * Helpers para manipulação de objetos
 * Resolve inconsistências entre camelCase (API) e PascalCase (legado SQL Server)
 */

/**
 * Acessa propriedade de objeto de forma flexível (camelCase ou PascalCase)
 * Útil para dados vindos do SQL Server que podem estar em qualquer formato
 *
 * @param obj - Objeto a ser acessado
 * @param camelKey - Nome da propriedade em camelCase (ex: "codFinanceiro")
 * @param pascalKey - Nome da propriedade em PascalCase (ex: "CodFinanceiro")
 * @returns Valor da propriedade encontrada
 *
 * @example
 * const data = { CodFinanceiro: 123 }; // ou { codFinanceiro: 123 }
 * const codigo = getValue<number>(data, "codFinanceiro", "CodFinanceiro");
 * // retorna 123 em ambos os casos
 */
export function getValue<T>(obj: Record<string, unknown>, camelKey: string, pascalKey: string): T {
  return (obj[camelKey] ?? obj[pascalKey]) as T;
}

/**
 * Verifica se objeto possui propriedade em qualquer formato (camelCase ou PascalCase)
 *
 * @param obj - Objeto a ser verificado
 * @param camelKey - Nome da propriedade em camelCase
 * @param pascalKey - Nome da propriedade em PascalCase
 * @returns true se a propriedade existe em qualquer formato
 */
export function hasValue(
  obj: Record<string, unknown>,
  camelKey: string,
  pascalKey: string
): boolean {
  return camelKey in obj || pascalKey in obj;
}

/**
 * Normaliza objeto para camelCase
 * Converte todas as chaves PascalCase para camelCase
 *
 * @param obj - Objeto com chaves em qualquer formato
 * @returns Novo objeto com todas as chaves em camelCase
 */
export function normalizeKeys<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    result[camelKey] = value;
  }
  return result as T;
}
