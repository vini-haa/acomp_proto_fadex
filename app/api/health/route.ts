import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { executeQuery } from "@/lib/db";

interface VersionInfo {
  version: string;
  buildDate: string;
  commit: string;
  branch: string;
  environment: string;
  nodeVersion: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version?: VersionInfo;
  checks: {
    database: {
      status: "up" | "down";
      latency?: number;
      error?: string;
    };
  };
  uptime: number;
}

const startTime = Date.now();

/**
 * GET /api/health
 * Endpoint de health check para monitoramento
 *
 * Retorna:
 * - status: healthy | degraded | unhealthy
 * - timestamp: data/hora atual
 * - version: informações de versão do build
 * - checks: status dos serviços dependentes
 * - uptime: tempo desde o início da aplicação
 */
export async function GET() {
  const response: HealthResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: "down",
      },
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  // Tentar ler informações de versão
  try {
    const versionPath = path.join(process.cwd(), "public", "version.json");
    if (fs.existsSync(versionPath)) {
      const versionContent = fs.readFileSync(versionPath, "utf-8");
      response.version = JSON.parse(versionContent);
    }
  } catch {
    // Ignorar erro de leitura de versão
  }

  // Verificar conexão com banco de dados
  try {
    const dbStart = Date.now();
    await executeQuery("SELECT 1 AS test");
    response.checks.database = {
      status: "up",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    response.checks.database = {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    response.status = "degraded";
  }

  // Determinar status geral
  if (response.checks.database.status === "down") {
    response.status = "unhealthy";
  }

  const statusCode =
    response.status === "healthy" ? 200 : response.status === "degraded" ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}
