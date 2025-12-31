import { describe, it, expect } from "vitest";
import {
  ProtocoloFiltersSchema,
  ProtocoloIdSchema,
  KPIsFiltersSchema,
  AnalyticsFiltersSchema,
  validateParams,
} from "../validation/protocolo";

describe("ProtocoloFiltersSchema", () => {
  it("deve usar valores padrão quando não fornecidos", () => {
    const result = ProtocoloFiltersSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.situacao).toBe("Em Andamento");
    expect(result.sortOrder).toBe("desc");
  });

  it("deve aceitar parâmetros válidos", () => {
    const input = {
      page: "2",
      pageSize: "50",
      numero: "123",
      situacao: "Arquivado",
    };
    const result = ProtocoloFiltersSchema.parse(input);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
    expect(result.numero).toBe("123");
    expect(result.situacao).toBe("Arquivado");
  });

  it("deve rejeitar pageSize maior que 100", () => {
    expect(() => ProtocoloFiltersSchema.parse({ pageSize: "150" })).toThrow();
  });

  it("deve rejeitar pageSize menor que 10", () => {
    expect(() => ProtocoloFiltersSchema.parse({ pageSize: "5" })).toThrow();
  });

  it("deve rejeitar page negativa", () => {
    expect(() => ProtocoloFiltersSchema.parse({ page: "-1" })).toThrow();
  });

  it("deve aceitar situação válida", () => {
    const situacoes = ["Em Andamento", "Arquivado", "Todos"];
    situacoes.forEach((situacao) => {
      const result = ProtocoloFiltersSchema.parse({ situacao });
      expect(result.situacao).toBe(situacao);
    });
  });

  it("deve rejeitar situação inválida", () => {
    expect(() => ProtocoloFiltersSchema.parse({ situacao: "Invalida" })).toThrow();
  });
});

describe("ProtocoloIdSchema", () => {
  it("deve aceitar ID numérico válido", () => {
    const result = ProtocoloIdSchema.parse({ id: "123" });
    expect(result.id).toBe(123);
  });

  it("deve rejeitar ID zero", () => {
    expect(() => ProtocoloIdSchema.parse({ id: "0" })).toThrow();
  });

  it("deve rejeitar ID negativo", () => {
    expect(() => ProtocoloIdSchema.parse({ id: "-1" })).toThrow();
  });

  it("deve rejeitar ID não numérico", () => {
    expect(() => ProtocoloIdSchema.parse({ id: "abc" })).toThrow();
  });
});

describe("KPIsFiltersSchema", () => {
  it("deve usar valores padrão quando não fornecidos", () => {
    const result = KPIsFiltersSchema.parse({});
    expect(result.periodo).toBe("all");
    expect(result.setor).toBe(48);
  });

  it("deve aceitar períodos válidos", () => {
    const periodos = ["mes_atual", "30d", "90d", "6m", "1y", "ytd", "all"];
    periodos.forEach((periodo) => {
      const result = KPIsFiltersSchema.parse({ periodo });
      expect(result.periodo).toBe(periodo);
    });
  });

  it("deve rejeitar período inválido", () => {
    expect(() => KPIsFiltersSchema.parse({ periodo: "invalid" })).toThrow();
  });

  it("deve aceitar setor numérico", () => {
    const result = KPIsFiltersSchema.parse({ setor: "100" });
    expect(result.setor).toBe(100);
  });
});

describe("AnalyticsFiltersSchema", () => {
  it("deve usar valores padrão quando não fornecidos", () => {
    const result = AnalyticsFiltersSchema.parse({});
    expect(result.limit).toBe(15);
  });

  it("deve aceitar limit entre 5 e 50", () => {
    const result = AnalyticsFiltersSchema.parse({ limit: "30" });
    expect(result.limit).toBe(30);
  });

  it("deve rejeitar limit menor que 5", () => {
    expect(() => AnalyticsFiltersSchema.parse({ limit: "3" })).toThrow();
  });

  it("deve rejeitar limit maior que 50", () => {
    expect(() => AnalyticsFiltersSchema.parse({ limit: "100" })).toThrow();
  });
});

describe("validateParams", () => {
  it("deve retornar success: true para parâmetros válidos", () => {
    const result = validateParams(KPIsFiltersSchema, { periodo: "30d" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.periodo).toBe("30d");
    }
  });

  it("deve retornar success: false para parâmetros inválidos", () => {
    const result = validateParams(KPIsFiltersSchema, { periodo: "invalid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Parâmetros inválidos");
      expect(result.details).toBeDefined();
    }
  });

  it("deve incluir detalhes do erro Zod", () => {
    const result = validateParams(ProtocoloIdSchema, { id: "abc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Array.isArray(result.details)).toBe(true);
      expect(result.details.length).toBeGreaterThan(0);
    }
  });
});
