/**
 * Testes para filter-builder
 */

import {
  buildProtocoloFilterConditions,
  buildOrderByClause,
  getSafeSortField,
  ALLOWED_SORT_FIELDS,
} from "@/lib/queries/filter-builder";

describe("getSafeSortField", () => {
  it("deve retornar o campo se estiver na whitelist", () => {
    ALLOWED_SORT_FIELDS.forEach((field) => {
      expect(getSafeSortField(field)).toBe(field);
    });
  });

  it('deve retornar "dt_entrada" para undefined', () => {
    expect(getSafeSortField(undefined)).toBe("dt_entrada");
  });

  it('deve retornar "dt_entrada" para campo não permitido', () => {
    expect(getSafeSortField("sql_injection; DROP TABLE")).toBe("dt_entrada");
    expect(getSafeSortField("campoInvalido")).toBe("dt_entrada");
  });
});

describe("buildProtocoloFilterConditions", () => {
  it("deve retornar whereClause vazia sem filtros", () => {
    const result = buildProtocoloFilterConditions({});
    expect(result.whereClause).toBe("");
    expect(result.params).toEqual({});
  });

  it("deve gerar condição para status", () => {
    const result = buildProtocoloFilterConditions({
      status: "Em Andamento",
    });
    expect(result.whereClause).toContain("vp.status_protocolo = @status");
    expect(result.params.status).toBe("Em Andamento");
  });

  it("deve gerar condição para numeroDocumento com LIKE", () => {
    const result = buildProtocoloFilterConditions({
      numeroDocumento: "2650",
    });
    expect(result.whereClause).toContain("d.numero LIKE @numeroDocumento");
    expect(result.params.numeroDocumento).toBe("2650");
  });

  it("deve gerar condição para numconv", () => {
    const result = buildProtocoloFilterConditions({
      numconv: 123,
    });
    expect(result.whereClause).toContain("c.numconv = @numconv");
    expect(result.params.numconv).toBe(123);
  });

  it("deve gerar condição para faixaTempo", () => {
    const result = buildProtocoloFilterConditions({
      faixaTempo: "01. Até 5 dias",
    });
    expect(result.whereClause).toContain("vp.faixa_tempo = @faixaTempo");
    expect(result.params.faixaTempo).toBe("01. Até 5 dias");
  });

  it("deve gerar condição para dataInicio e dataFim", () => {
    const dataInicio = new Date("2024-01-01");
    const dataFim = new Date("2024-12-31");
    const result = buildProtocoloFilterConditions({
      dataInicio,
      dataFim,
    });
    expect(result.whereClause).toContain("vp.dt_entrada >= @dataInicio");
    expect(result.whereClause).toContain("vp.dt_entrada <= @dataFim");
    expect(result.params.dataInicio).toEqual(dataInicio);
    expect(result.params.dataFim).toEqual(dataFim);
  });

  it("deve combinar múltiplos filtros com AND", () => {
    const result = buildProtocoloFilterConditions({
      status: "Em Andamento",
      numconv: 123,
      faixaTempo: "01. Até 5 dias",
    });
    expect(result.whereClause).toContain("WHERE");
    expect(result.whereClause).toContain("AND");
    expect(Object.keys(result.params).length).toBe(3);
  });
});

describe("buildOrderByClause", () => {
  it("deve gerar ORDER BY com campo válido", () => {
    const result = buildOrderByClause({
      sortBy: "diasNoFinanceiro",
      sortOrder: "desc",
    });
    expect(result).toBe("ORDER BY diasNoFinanceiro DESC");
  });

  it('deve usar ASC quando sortOrder é "asc"', () => {
    const result = buildOrderByClause({
      sortBy: "dtEntrada",
      sortOrder: "asc",
    });
    expect(result).toBe("ORDER BY dtEntrada ASC");
  });

  it("deve usar campo padrão quando sortBy é inválido", () => {
    const result = buildOrderByClause({
      sortBy: "campoInvalido",
      sortOrder: "desc",
    });
    expect(result).toBe("ORDER BY dt_entrada DESC");
  });

  it("deve usar valores padrão quando não especificados", () => {
    const result = buildOrderByClause({});
    expect(result).toBe("ORDER BY dt_entrada DESC");
  });
});
