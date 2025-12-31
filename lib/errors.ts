import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Erro ao acessar o banco de dados") {
    super(message, 500, "DATABASE_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Recurso não encontrado") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  public details?: unknown;

  constructor(message: string = "Dados inválidos", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}

/**
 * Handler de erros para API Routes
 */
export function handleApiError(error: unknown) {
  logger.error("API Error:", error);

  if (error instanceof AppError) {
    const response: { error: string; code?: string; details?: unknown } = {
      error: error.message,
      code: error.code,
    };

    // Incluir detalhes de validação se disponíveis
    if (error instanceof ValidationError && error.details) {
      response.details = error.details;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Erro genérico
  return NextResponse.json(
    {
      error: "Erro interno do servidor",
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Wrapper para API Routes com tratamento de erros
 *
 * Aceita tanto Request quanto NextRequest para compatibilidade
 * com diferentes tipos de API routes do Next.js
 *
 * @example
 * // Rota simples (sem parâmetros dinâmicos)
 * export const GET = withErrorHandling(async (request: NextRequest) => { ... });
 *
 * // Rota com parâmetros dinâmicos
 * export const GET = withErrorHandling(async (request, { params }) => { ... });
 */
export function withErrorHandling<T extends (...args: never[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}
