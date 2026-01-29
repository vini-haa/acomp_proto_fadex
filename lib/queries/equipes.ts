/**
 * Queries SQL para o módulo de Gestão de Equipes/Setores
 *
 * IMPORTANTE:
 * - Setores ativos começam com "-" no campo descr
 * - Setores "DESABILITADO" devem ser ignorados
 * - Volume alto: alguns setores têm 10.000+ protocolos
 *
 * OTIMIZAÇÃO:
 * - Filtrar apenas setores relevantes (com descr começando com "-")
 * - Usar pré-agregações em CTEs para evitar múltiplos scans
 * - Excluir setor 0 (sistema)
 */

import { EquipesFilters, UsuariosFilters } from "@/types/equipes";

/**
 * Query para listar equipes/setores ativos com métricas
 * OTIMIZADA: usa CTEs com pré-agregação para reduzir scans
 */
export function buildEquipesQuery(filters: EquipesFilters = {}): string {
  const { periodo = "30d" } = filters;

  // Calcular dias para o período
  const diasPeriodo = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;

  return `
    -- Pré-seleciona setores válidos (ativos e não desabilitados)
    WITH SetoresValidos AS (
      SELECT codigo AS codSetor, descr
      FROM setor
      WHERE (descr LIKE '-%' OR UPPER(descr) LIKE 'ARQUIVO%')
        AND descr NOT LIKE '%DESABILITADO%'
        AND deletado IS NULL
        AND codigo > 0
    ),
    -- Colaboradores ativos por setor (fizeram movimentações nos últimos 90 dias)
    ColaboradoresPorSetor AS (
      SELECT
        u.codSetor,
        COUNT(DISTINCT u.codigo) AS totalMembros
      FROM usuario u
      WHERE (u.bloqueado = 0 OR u.bloqueado IS NULL)
        AND (u.DELETADO = 0 OR u.DELETADO IS NULL)
        AND u.codSetor > 0
        AND EXISTS (
          SELECT 1 FROM scd_movimentacao m
          WHERE m.codUsuario = u.codigo
            AND (m.Deletado = 0 OR m.Deletado IS NULL)
            AND m.data >= DATEADD(day, -90, GETDATE())
        )
      GROUP BY u.codSetor
    ),
    -- Métricas pré-agregadas por setor (apenas movimentações recentes)
    MetricasSetor AS (
      SELECT
        m.codsetordestino AS codSetor,
        COUNT(DISTINCT CASE WHEN m.data >= DATEADD(day, -${diasPeriodo}, GETDATE()) THEN m.codigo END) AS movimentacoes30d,
        COUNT(DISTINCT CASE WHEN m.data >= DATEADD(day, -7, GETDATE()) THEN m.codigo END) AS movimentacoes7d,
        COUNT(DISTINCT CASE WHEN m.RegAtual = 1 THEN m.codprot END) AS protocolosEmPosse,
        COUNT(DISTINCT CASE WHEN m.RegAtual = 1 AND DATEDIFF(day, m.data, GETDATE()) > 7 THEN m.codprot END) AS protocolosParados,
        AVG(CASE WHEN m.dtRecebimento IS NOT NULL AND m.data >= DATEADD(day, -${diasPeriodo}, GETDATE())
            THEN DATEDIFF(hour, m.data, m.dtRecebimento) END) AS tempoMedioRespostaHoras
      FROM scd_movimentacao m
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND m.codsetordestino > 0
        AND (m.data >= DATEADD(day, -${diasPeriodo}, GETDATE()) OR m.RegAtual = 1)
      GROUP BY m.codsetordestino
    )
    SELECT
      sv.codSetor,
      LTRIM(REPLACE(sv.descr, '- ', '')) AS nomeSetor,
      sv.descr AS nomeSetorOriginal,
      ISNULL(c.totalMembros, 0) AS totalMembros,
      NULL AS membros,
      ISNULL(ms.movimentacoes30d, 0) AS movimentacoes30d,
      ISNULL(ms.movimentacoes7d, 0) AS movimentacoes7d,
      ISNULL(ms.protocolosEmPosse, 0) AS protocolosEmPosse,
      ISNULL(ms.protocolosParados, 0) AS protocolosParados,
      ms.tempoMedioRespostaHoras,
      -- Classificação de carga
      CASE
        WHEN ISNULL(ms.protocolosEmPosse, 0) > 10000 THEN 'CRÍTICA'
        WHEN ISNULL(ms.protocolosEmPosse, 0) > 5000 THEN 'MUITO ALTA'
        WHEN ISNULL(ms.protocolosEmPosse, 0) > 1000 THEN 'ALTA'
        WHEN ISNULL(ms.protocolosEmPosse, 0) > 100 THEN 'MODERADA'
        ELSE 'NORMAL'
      END AS cargaTrabalho,
      -- Status de gargalo
      CASE
        WHEN ISNULL(ms.protocolosEmPosse, 0) > 10000 THEN 'GARGALO CRÍTICO'
        WHEN ISNULL(ms.protocolosEmPosse, 0) > 5000 THEN 'GARGALO'
        WHEN ISNULL(ms.protocolosParados, 0) > 50 THEN 'ATENÇÃO'
        ELSE 'NORMAL'
      END AS statusGargalo
    FROM SetoresValidos sv
    LEFT JOIN ColaboradoresPorSetor c ON c.codSetor = sv.codSetor
    LEFT JOIN MetricasSetor ms ON ms.codSetor = sv.codSetor
    WHERE ISNULL(ms.protocolosEmPosse, 0) > 0
    ORDER BY ms.protocolosEmPosse DESC
  `;
}

/**
 * Query para alertas de protocolos atrasados por setor
 */
export function buildAlertasQuery(): string {
  return `
    SELECT
      m.codsetordestino AS codSetor,
      LTRIM(REPLACE(COALESCE(s.descr, 'Setor ' + CAST(m.codsetordestino AS VARCHAR)), '- ', '')) AS nomeSetor,

      COUNT(DISTINCT CASE
        WHEN DATEDIFF(day, d.dataCad, GETDATE()) > 30 THEN d.codigo
      END) AS criticos,

      COUNT(DISTINCT CASE
        WHEN DATEDIFF(day, d.dataCad, GETDATE()) BETWEEN 16 AND 30 THEN d.codigo
      END) AS urgentes,

      COUNT(DISTINCT CASE
        WHEN DATEDIFF(day, d.dataCad, GETDATE()) BETWEEN 8 AND 15 THEN d.codigo
      END) AS atencao,

      COUNT(DISTINCT CASE
        WHEN DATEDIFF(day, d.dataCad, GETDATE()) > 7 THEN d.codigo
      END) AS totalAlertas

    FROM scd_movimentacao m
    LEFT JOIN setor s ON s.codigo = m.codsetordestino
    INNER JOIN documento d
      ON m.codprot = d.codigo
      AND d.deletado = 0
    WHERE m.RegAtual = 1
      AND (m.Deletado IS NULL OR m.Deletado = 0)
      AND m.codsetordestino IS NOT NULL
      AND m.codSituacaoProt != 1
      AND DATEDIFF(day, d.dataCad, GETDATE()) > 7
    GROUP BY m.codsetordestino, s.descr
    HAVING COUNT(DISTINCT CASE WHEN DATEDIFF(day, d.dataCad, GETDATE()) > 7 THEN d.codigo END) > 0
       AND COALESCE(s.descr, '') NOT LIKE '%DESABILITADO%'
    ORDER BY criticos DESC, urgentes DESC
  `;
}

/**
 * Query para identificação de gargalos
 * OTIMIZADA: filtra apenas setores válidos e usa pré-agregação
 */
export function buildGargalosQuery(): string {
  return `
    -- Pré-seleciona setores válidos
    WITH SetoresValidos AS (
      SELECT codigo, descr
      FROM setor
      WHERE (descr LIKE '-%' OR UPPER(descr) LIKE 'ARQUIVO%')
        AND descr NOT LIKE '%DESABILITADO%'
        AND deletado IS NULL
        AND codigo > 0
    ),
    -- Métricas apenas para setores válidos
    SetorMetricas AS (
      SELECT
        sv.codigo,
        LTRIM(REPLACE(sv.descr, '- ', '')) AS nomeSetor,
        COUNT(DISTINCT CASE WHEN m.RegAtual = 1 THEN m.codprot END) AS cargaAtual,
        AVG(CASE WHEN m.dtRecebimento IS NOT NULL AND m.data >= DATEADD(day, -30, GETDATE())
            THEN DATEDIFF(hour, m.data, m.dtRecebimento) END) AS tempoMedioHoras,
        COUNT(DISTINCT CASE WHEN m.RegAtual = 1 AND DATEDIFF(day, m.data, GETDATE()) > 7
            THEN m.codprot END) AS protocolosParados
      FROM SetoresValidos sv
      INNER JOIN scd_movimentacao m ON m.codsetordestino = sv.codigo
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND (m.data >= DATEADD(day, -30, GETDATE()) OR m.RegAtual = 1)
      GROUP BY sv.codigo, sv.descr
    ),
    MediaGeral AS (
      SELECT
        AVG(CAST(cargaAtual AS FLOAT)) AS mediaCarga,
        AVG(tempoMedioHoras) AS mediaTempo
      FROM SetorMetricas
      WHERE cargaAtual > 0
    )
    SELECT
      sm.codigo AS codSetor,
      sm.nomeSetor,
      sm.cargaAtual,
      sm.tempoMedioHoras,
      sm.protocolosParados,
      mg.mediaCarga,
      mg.mediaTempo,
      CAST((sm.cargaAtual - mg.mediaCarga) * 100.0 / NULLIF(mg.mediaCarga, 0) AS DECIMAL(10,2)) AS percentualAcimaMedia,
      CASE
        WHEN sm.cargaAtual > 10000 THEN 'VOLUME CRÍTICO'
        WHEN sm.cargaAtual > mg.mediaCarga * 3 THEN 'VOLUME ALTO'
        WHEN sm.tempoMedioHoras > 48 THEN 'LENTIDÃO'
        WHEN sm.protocolosParados > 50 THEN 'ESTAGNAÇÃO'
        ELSE 'NORMAL'
      END AS tipoGargalo,
      CASE
        WHEN sm.cargaAtual > 10000 OR sm.protocolosParados > 100 THEN 3
        WHEN sm.cargaAtual > 5000 OR sm.tempoMedioHoras > 48 THEN 2
        WHEN sm.cargaAtual > 1000 OR sm.protocolosParados > 20 THEN 1
        ELSE 0
      END AS severidade
    FROM SetorMetricas sm
    CROSS JOIN MediaGeral mg
    WHERE sm.cargaAtual > 0
    ORDER BY severidade DESC, sm.cargaAtual DESC
  `;
}

/**
 * Query para performance individual de usuários
 * Baseada nos usuários que fizeram movimentações
 *
 * IMPORTANTE:
 * - Filtra codUsuario = 0 (sistema automático)
 * - Tempo Médio Tramitação: mede o tempo que o protocolo ficou no setor,
 *   atribuído ao colaborador que fez a movimentação de saída
 *
 * SEGURANÇA:
 * - codSetor usa parâmetro @codSetor (passado via executeQuery params)
 * - diasPeriodo é derivado de enum validado ("7d"|"30d"|"90d"), seguro para interpolação
 *
 * @returns {{ query: string, params: Record<string, unknown> }}
 */
export function buildUsuariosQuery(filters: UsuariosFilters = {}): {
  query: string;
  params: Record<string, unknown>;
} {
  const { codSetor, periodo = "30d" } = filters;

  const diasPeriodo = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;

  // Filtrar por setor DO USUÁRIO, não por setor de destino da movimentação
  const whereSetor = codSetor ? "AND u.codSetor = @codSetor" : "";

  const params: Record<string, unknown> = {};
  if (codSetor) {
    params.codSetor = codSetor;
  }

  const query = `
    WITH UsuariosAtivos AS (
      -- Identifica usuários que fizeram movimentações no período
      -- Exclui codUsuario = 0 (sistema automático / portal do coordenador)
      SELECT DISTINCT codUsuario AS codigo
      FROM scd_movimentacao
      WHERE (Deletado IS NULL OR Deletado = 0)
        AND codUsuario IS NOT NULL
        AND codUsuario != 0
        AND data >= DATEADD(day, -${diasPeriodo}, GETDATE())
    ),
    -- Movimentações onde protocolos SAÍRAM de um setor (enviados por um colaborador)
    SaidasSetor AS (
      SELECT
        m.codprot,
        m.codSetorOrigem AS codSetor,
        m.data AS dataSaida,
        m.codUsuario,
        m.codigo AS codMovSaida
      FROM scd_movimentacao m
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND m.codSetorOrigem IS NOT NULL
        AND m.codUsuario IS NOT NULL
        AND m.codUsuario != 0
        AND m.data >= DATEADD(day, -${diasPeriodo}, GETDATE())
    ),
    -- Para cada saída, encontra a última entrada correspondente no mesmo setor
    EntradasParaSaidas AS (
      SELECT
        s.codprot,
        s.codSetor,
        s.dataSaida,
        s.codUsuario,
        s.codMovSaida,
        (
          SELECT TOP 1 e.data
          FROM scd_movimentacao e
          WHERE e.codprot = s.codprot
            AND e.codSetorDestino = s.codSetor
            AND e.data < s.dataSaida
            AND (e.Deletado IS NULL OR e.Deletado = 0)
          ORDER BY e.data DESC
        ) AS dataEntrada
      FROM SaidasSetor s
    ),
    -- Calcula o tempo de tramitação por protocolo e usuário
    TemposPorProtocolo AS (
      SELECT
        eps.codUsuario,
        eps.codprot,
        DATEDIFF(hour, eps.dataEntrada, eps.dataSaida) AS tempoHoras
      FROM EntradasParaSaidas eps
      WHERE eps.dataEntrada IS NOT NULL
        AND DATEDIFF(hour, eps.dataEntrada, eps.dataSaida) >= 0
    )
    SELECT
      ua.codigo AS codUsuario,
      COALESCE(u.Nome, 'Usuário ' + CAST(ua.codigo AS VARCHAR)) AS nomeUsuario,
      COALESCE(u.Login, '') AS login,
      COALESCE(u.codSetor, 0) AS codSetor,
      LTRIM(REPLACE(COALESCE(s.descr, 'Não definido'), '- ', '')) AS nomeSetor,

      COUNT(DISTINCT CASE
        WHEN m.codUsuario = ua.codigo
        AND m.data >= DATEADD(day, -${diasPeriodo}, GETDATE())
        THEN m.codigo
      END) AS movimentacoesEnviadas30d,

      COUNT(DISTINCT CASE
        WHEN m.CodUsuRec = ua.codigo
        AND m.dtRecebimento >= DATEADD(day, -${diasPeriodo}, GETDATE())
        THEN m.codigo
      END) AS movimentacoesRecebidas30d,

      COUNT(DISTINCT CASE
        WHEN m.codUsuario = ua.codigo
        AND m.codSituacaoProt = 1
        AND m.data >= DATEADD(day, -${diasPeriodo}, GETDATE())
        THEN m.codprot
      END) AS protocolosFinalizados30d,

      -- Tempo médio de tramitação: tempo que o protocolo ficou no setor
      -- atribuído ao colaborador que fez a movimentação de saída
      (SELECT AVG(CAST(tp.tempoHoras AS FLOAT))
       FROM TemposPorProtocolo tp
       WHERE tp.codUsuario = ua.codigo) AS tempoMedioTramitacaoHoras,

      CAST(
        COUNT(DISTINCT CASE
          WHEN m.codUsuario = ua.codigo
          AND m.data >= DATEADD(day, -${diasPeriodo}, GETDATE())
          THEN m.codigo
        END) AS FLOAT
      ) / ${diasPeriodo}.0 AS mediaMovimentacoesPorDia

    FROM UsuariosAtivos ua
    LEFT JOIN usuario u ON u.codigo = ua.codigo
    LEFT JOIN setor s ON s.codigo = u.codSetor
    LEFT JOIN scd_movimentacao m
      ON (m.codUsuario = ua.codigo OR m.CodUsuRec = ua.codigo)
      AND (m.Deletado IS NULL OR m.Deletado = 0)
    WHERE 1=1 ${whereSetor}
    GROUP BY ua.codigo, u.Nome, u.Login, u.codSetor, s.descr
    HAVING COUNT(DISTINCT CASE
      WHEN m.codUsuario = ua.codigo
      AND m.data >= DATEADD(day, -${diasPeriodo}, GETDATE())
      THEN m.codigo
    END) > 0
    ORDER BY movimentacoesEnviadas30d DESC
  `;

  return { query, params };
}
