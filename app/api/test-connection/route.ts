import { NextResponse } from "next/server";
import { getPool, testConnection } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/test-connection
 * Testa a conexão com o SQL Server e retorna detalhes
 */
export async function GET() {
  try {
    // Mostrar configuração (sem senha)
    const config = {
      server: process.env.DB_SERVER,
      port: process.env.DB_PORT,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      encrypt: process.env.DB_ENCRYPT,
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE,
    };

    logger.info("🔍 Tentando conectar com configuração:", config);

    // Tentar conectar (garantir que o pool está estabelecido)
    await getPool();

    // Testar conexão
    const isConnected = await testConnection();

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: "✅ Conexão com SQL Server estabelecida com sucesso!",
        config: {
          ...config,
          password: "***",
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "❌ Conexão estabelecida mas teste falhou",
          config: {
            ...config,
            password: "***",
          },
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    logger.error("❌ Erro ao conectar:", error);

    return NextResponse.json(
      {
        success: false,
        message: "❌ Erro ao conectar com o banco de dados",
        error: err.message || String(error),
        code: err.code,
        config: {
          server: process.env.DB_SERVER,
          port: process.env.DB_PORT,
          database: process.env.DB_DATABASE,
          user: process.env.DB_USER,
          password: "***",
          encrypt: process.env.DB_ENCRYPT,
          trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE,
        },
      },
      { status: 500 }
    );
  }
}
