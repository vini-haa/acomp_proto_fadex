/**
 * Queries SQL para o módulo de Gestão de Equipes/Setores
 *
 * IMPORTANTE:
 * - Setores ativos começam com "-" no campo descr
 * - Setores "DESABILITADO" devem ser ignorados
 * - Volume alto: alguns setores têm 10.000+ protocolos
 */

import { EquipesFilters, UsuariosFilters } from "@/types/equipes";

/**
 * Query para listar equipes/setores ativos com métricas
 * Usa dados reais das movimentações para identificar setores ativos
 */
export function buildEquipesQuery(filters: EquipesFilters = {}): string {
  const { periodo = "30d" } = filters;

  // Calcular dias para o período
  const diasPeriodo = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;

  return `
    WITH SetoresAtivos AS (
      -- Identifica setores com movimentações
      SELECT DISTINCT codsetordestino AS codSetor
      FROM scd_movimentacao
      WHERE (Deletado IS NULL OR Deletado = 0) AND codsetordestino IS NOT NULL
    )
    SELECT
      sa.codSetor,
      LTRIM(REPLACE(COALESCE(s.descr, 'Setor ' + CAST(sa.codSetor AS VARCHAR)), '- ', '')) AS nomeSetor,
      COALESCE(s.descr, 'Setor ' + CAST(sa.codSetor AS VARCHAR)) AS nomeSetorOriginal,

      -- Total de usuários no setor (se tabela usuario existir e tiver dados)
      0 AS totalMembros,
      NULL AS membros,

      -- Movimentações no período
      COUNT(DISTINCT CASE
        WHEN m.data >= DATEADD(day, -${diasPeriodo}, GETDATE()) THEN m.codigo
      END) AS movimentacoes30d,

      COUNT(DISTINCT CASE
        WHEN m.data >= DATEADD(day, -7, GETDATE()) THEN m.codigo
      END) AS movimentacoes7d,

      -- Protocolos atualmente no setor
      COUNT(DISTINCT CASE
        WHEN m.RegAtual = 1 THEN m.codprot
      END) AS protocolosEmPosse,

      -- Protocolos parados (>7 dias sem movimentação)
      COUNT(DISTINCT CASE
        WHEN m.RegAtual = 1
        AND DATEDIFF(day, m.data, GETDATE()) > 7
        THEN m.codprot
      END) AS protocolosParados,

      -- Tempo médio de resposta
      AVG(CASE
        WHEN m.dtRecebimento IS NOT NULL
        AND m.data >= DATEADD(day, -${diasPeriodo}, GETDATE())
        THEN DATEDIFF(hour, m.data, m.dtRecebimento)
      END) AS tempoMedioRespostaHoras,

      -- Classificação de carga
      CASE
        WHEN COUNT(DISTINCT CASE WHEN m.RegAtual = 1 THEN m.codprot END) > 10000 THEN 'CRÍTICA'
        WHEN COUNT(DISTINCT CASE WHEN m.RegAtual = 1 THEN m.codprot END) > 5000 THEN 'MUITO ALTA'
        WHEN COUNT(DISTINCT CASE WHEN m.RegAtual = 1 THEN m.codprot END) > 1000 THEN 'ALTA'
        WHEN COUNT(DISTINCT CASE WHEN m.RegAtual = 1 THEN m.codprot END) > 100 THEN 'MODERADA'
        ELSE 'NORMAL'
      END AS cargaTrabalho,

      -- Status de gargalo
      CASE
        WHEN COUNT(DISTINCT CASE WHEN m.RegAtual = 1 THEN m.codprot END) > 10000 THEN 'GARGALO CRÍTICO'
        WHEN COUNT(DISTINCT CASE WHEN m.RegAtual = 1 THEN m.codprot END) > 5000 THEN 'GARGALO'
        WHEN COUNT(DISTINCT CASE
            WHEN m.RegAtual = 1
            AND DATEDIFF(day, m.data, GETDATE()) > 7
            THEN m.codprot
        END) > 50 THEN 'ATENÇÃO'
        ELSE 'NORMAL'
      END AS statusGargalo

    FROM SetoresAtivos sa
    LEFT JOIN setor s ON s.codigo = sa.codSetor
    LEFT JOIN scd_movimentacao m
      ON m.codsetordestino = sa.codSetor
      AND (m.Deletado IS NULL OR m.Deletado = 0)
    WHERE COALESCE(s.descr, '') NOT LIKE '%DESABILITADO%'
    GROUP BY sa.codSetor, s.descr
    HAVING COUNT(DISTINCT CASE WHEN m.RegAtual = 1 THEN m.codprot END) > 0
    ORDER BY protocolosEmPosse DESC
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
 */
export function buildGargalosQuery(): string {
  return `
    WITH SetorMetricas AS (
      SELECT
        m.codsetordestino AS codigo,
        LTRIM(REPLACE(COALESCE(s.descr, 'Setor ' + CAST(m.codsetordestino AS VARCHAR)), '- ', '')) AS nomeSetor,
        COUNT(DISTINCT CASE WHEN m.RegAtual = 1 THEN m.codprot END) AS cargaAtual,
        AVG(CASE
          WHEN m.dtRecebimento IS NOT NULL
          THEN DATEDIFF(hour, m.data, m.dtRecebimento)
        END) AS tempoMedioHoras,
        COUNT(DISTINCT CASE
          WHEN m.RegAtual = 1
          AND DATEDIFF(day, m.data, GETDATE()) > 7
          THEN m.codprot
        END) AS protocolosParados
      FROM scd_movimentacao m
      LEFT JOIN setor s ON s.codigo = m.codsetordestino
      WHERE m.Deletado IS NULL AND m.codsetordestino IS NOT NULL
        AND COALESCE(s.descr, '') NOT LIKE '%DESABILITADO%'
      GROUP BY m.codsetordestino, s.descr
    ),
    MediaGeral AS (
      SELECT
        AVG(CAST(cargaAtual AS FLOAT)) AS mediaCarga,
        AVG(tempoMedioHoras) AS mediaTempo
      FROM SetorMetricas
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
 * IMPORTANTE: Filtra codUsuario = 0 (sistema automático)
 */
export function buildUsuariosQuery(filters: UsuariosFilters = {}): string {
  const { codSetor, periodo = "30d" } = filters;

  const diasPeriodo = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;

  const whereSetor = codSetor ? `AND m.codsetordestino = ${codSetor}` : "";

  return `
    WITH UsuariosAtivos AS (
      -- Identifica usuários que fizeram movimentações no período
      -- Exclui codUsuario = 0 (sistema automático / portal do coordenador)
      SELECT DISTINCT codUsuario AS codigo
      FROM scd_movimentacao
      WHERE (Deletado IS NULL OR Deletado = 0)
        AND codUsuario IS NOT NULL
        AND codUsuario != 0
        AND data >= DATEADD(day, -${diasPeriodo}, GETDATE())
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

      AVG(CASE
        WHEN m.CodUsuRec = ua.codigo
        AND m.dtRecebimento IS NOT NULL
        AND m.data >= DATEADD(day, -${diasPeriodo}, GETDATE())
        THEN DATEDIFF(hour, m.data, m.dtRecebimento)
      END) AS tempoMedioRespostaHoras,

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
}
