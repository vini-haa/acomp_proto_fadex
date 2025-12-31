/**
 * Hook para gerenciar preferências do usuário
 * Utiliza localStorage para persistência
 */

import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";

export interface UserPreferences {
  // Dashboard
  defaultPeriod: "7d" | "30d" | "90d" | "12m";
  autoRefresh: boolean;
  refreshInterval: number; // em segundos

  // Tabelas
  defaultPageSize: number;
  defaultSortBy: string;
  defaultSortOrder: "asc" | "desc";

  // Gráficos
  chartAnimations: boolean;
  showLegends: boolean;

  // Exportação
  includeTimestamp: boolean;
  defaultExportFormat: "csv" | "excel" | "pdf";

  // Filtros salvos
  savedFilters: {
    protocolos?: {
      status?: string;
      assunto?: string;
    };
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  // Dashboard
  defaultPeriod: "30d",
  autoRefresh: true,
  refreshInterval: 300, // 5 minutos

  // Tabelas
  defaultPageSize: 20,
  defaultSortBy: "dtEntrada",
  defaultSortOrder: "desc",

  // Gráficos
  chartAnimations: true,
  showLegends: true,

  // Exportação
  includeTimestamp: true,
  defaultExportFormat: "excel",

  // Filtros
  savedFilters: {},
};

const STORAGE_KEY = "fadex_user_preferences";

/**
 * Hook para gerenciar preferências do usuário
 */
export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar preferências do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
      setIsLoaded(true);
    } catch (error) {
      logger.error("Erro ao carregar preferências:", error);
      setIsLoaded(true);
    }
  }, []);

  // Salvar preferências no localStorage sempre que mudarem
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        logger.error("Erro ao salvar preferências:", error);
      }
    }
  }, [preferences, isLoaded]);

  // Atualizar preferência específica
  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Atualizar múltiplas preferências
  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Resetar para padrões
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Salvar filtro
  const saveFilter = (type: keyof UserPreferences["savedFilters"], filter: any) => {
    setPreferences((prev) => ({
      ...prev,
      savedFilters: {
        ...prev.savedFilters,
        [type]: filter,
      },
    }));
  };

  // Limpar filtro salvo
  const clearFilter = (type: keyof UserPreferences["savedFilters"]) => {
    setPreferences((prev) => {
      const newFilters = { ...prev.savedFilters };
      delete newFilters[type];
      return {
        ...prev,
        savedFilters: newFilters,
      };
    });
  };

  return {
    preferences,
    isLoaded,
    updatePreference,
    updatePreferences,
    resetPreferences,
    saveFilter,
    clearFilter,
  };
}

/**
 * Hook específico para preferências de dashboard
 */
export function useDashboardPreferences() {
  const { preferences, updatePreference } = usePreferences();

  return {
    defaultPeriod: preferences.defaultPeriod,
    setDefaultPeriod: (period: UserPreferences["defaultPeriod"]) =>
      updatePreference("defaultPeriod", period),
    autoRefresh: preferences.autoRefresh,
    setAutoRefresh: (enabled: boolean) => updatePreference("autoRefresh", enabled),
    refreshInterval: preferences.refreshInterval,
    setRefreshInterval: (interval: number) => updatePreference("refreshInterval", interval),
  };
}

/**
 * Hook específico para preferências de tabela
 */
export function useTablePreferences() {
  const { preferences, updatePreferences } = usePreferences();

  return {
    defaultPageSize: preferences.defaultPageSize,
    defaultSortBy: preferences.defaultSortBy,
    defaultSortOrder: preferences.defaultSortOrder,
    setTablePreferences: (prefs: {
      pageSize?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }) => {
      const updates: Partial<UserPreferences> = {};
      if (prefs.pageSize) {
        updates.defaultPageSize = prefs.pageSize;
      }
      if (prefs.sortBy) {
        updates.defaultSortBy = prefs.sortBy;
      }
      if (prefs.sortOrder) {
        updates.defaultSortOrder = prefs.sortOrder;
      }
      updatePreferences(updates);
    },
  };
}

/**
 * Hook específico para preferências de exportação
 */
export function useExportPreferences() {
  const { preferences, updatePreference } = usePreferences();

  return {
    includeTimestamp: preferences.includeTimestamp,
    defaultFormat: preferences.defaultExportFormat,
    setIncludeTimestamp: (include: boolean) => updatePreference("includeTimestamp", include),
    setDefaultFormat: (format: UserPreferences["defaultExportFormat"]) =>
      updatePreference("defaultExportFormat", format),
  };
}
