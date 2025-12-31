import sql from "mssql";
import { PERFORMANCE_CONFIG, getPerformanceEmoji, formatQueryTime } from "@/lib/config/performance";
import { logger } from "@/lib/logger";

// Configuração do pool de conexões
const config: sql.config = {
  server: process.env.DB_SERVER || "localhost",
  port: parseInt(process.env.DB_PORT || "1433"),
  database: process.env.DB_DATABASE || "",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    enableArithAbort: true,
  },
  pool: {
    max: PERFORMANCE_CONFIG.database.poolMax,
    min: PERFORMANCE_CONFIG.database.poolMin,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: PERFORMANCE_CONFIG.database.connectionTimeout,
  requestTimeout: PERFORMANCE_CONFIG.database.requestTimeout,
};

// Pool global de conexões
let pool: sql.ConnectionPool | null = null;

/**
 * Obtém ou cria o pool de conexões com o SQL Server
 */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    try {
      pool = await new sql.ConnectionPool(config).connect();
      logger.success("Conexão com SQL Server estabelecida");

      // Handler para erros do pool
      pool.on("error", (err) => {
        logger.error("❌ Erro no pool de conexões SQL Server:", err);
        pool = null;
      });
    } catch (error) {
      logger.error("❌ Erro ao conectar ao SQL Server:", error);
      throw new Error("Falha na conexão com o banco de dados");
    }
  }

  return pool;
}

/**
 * Executa uma query no banco de dados COM logging de performance
 */
export async function executeQuery<T = Record<string, unknown>>(
  query: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const startTime = Date.now();

  try {
    const pool = await getPool();
    const request = pool.request();

    // Adiciona parâmetros se existirem
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.query(query);

    // Log de performance (apenas se habilitado)
    if (PERFORMANCE_CONFIG.features.performanceLogs) {
      const elapsed = Date.now() - startTime;
      const rowCount = result.recordset.length;
      const emoji = getPerformanceEmoji(elapsed);
      const timeStr = formatQueryTime(elapsed);

      // Extrai nome da query (primeiras palavras após SELECT/WITH)
      const queryPreview = query.trim().substring(0, 60).replace(/\s+/g, " ");
      logger.perf(`${emoji} Query (${rowCount} rows): ${timeStr} - ${queryPreview}...`);

      // Alerta se query muito lenta
      if (elapsed > PERFORMANCE_CONFIG.thresholds.critical) {
        logger.warn(`⚠️  Query CRÍTICA detectada: ${timeStr}`);
      } else if (elapsed > PERFORMANCE_CONFIG.thresholds.slow) {
        logger.warn(`⚠️  Query LENTA detectada: ${timeStr}`);
      }
    }

    return result.recordset as T[];
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error(`❌ Erro ao executar query (${elapsed}ms):`, error);
    throw error;
  }
}

/**
 * Fecha o pool de conexões (útil para testes ou shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      logger.success("Pool de conexões fechado");
    } catch (error) {
      logger.error("❌ Erro ao fechar pool:", error);
    }
  }
}

/**
 * Verifica se a conexão está funcionando
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await executeQuery<{ result: number }>("SELECT 1 as result");
    return result[0]?.result === 1;
  } catch (error) {
    logger.error("❌ Teste de conexão falhou:", error);
    return false;
  }
}

// Exporta o sql para uso de tipos específicos se necessário
export { sql };
