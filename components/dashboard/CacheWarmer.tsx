"use client";

import { useCachedProtocolos } from "@/hooks/useCachedProtocolos";

/**
 * Componente invisível que pré-carrega o cache de protocolos em background.
 * Isso garante que a navegação para a página de protocolos seja instantânea.
 */
export function CacheWarmer() {
  // Faz uma requisição mínima apenas para inicializar o cache do servidor
  useCachedProtocolos({ page: 1, pageSize: 1 });

  // Não renderiza nada visualmente
  return null;
}
