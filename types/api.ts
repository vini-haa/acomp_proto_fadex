/**
 * Tipos relacionados a API Request/Response
 */

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: any;
}

export interface ApiSuccessResponse<T> extends ApiResponse<T> {
  success: true;
}

export interface ApiErrorResponse extends ApiResponse<null> {
  success: false;
  error: string;
}

// Query params types
export interface KPIsQueryParams {
  periodo?: "mes_atual" | "30d" | "90d" | "6m" | "1y" | "all";
}

export interface ProtocolosQueryParams {
  status?: string;
  assunto?: string;
  numconv?: string;
  dataInicio?: string;
  dataFim?: string;
  faixaTempo?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface AnalyticsQueryParams {
  dataInicio?: string;
  dataFim?: string;
  agrupamento?: string;
}
