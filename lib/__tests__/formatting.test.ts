import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatCPFCNPJ,
  formatPercent,
  formatDays,
} from "../formatting";

describe("formatCurrency", () => {
  it("deve formatar valores positivos corretamente", () => {
    expect(formatCurrency(1234.56)).toBe("R$\u00A01.234,56");
  });

  it("deve formatar valores negativos como positivos (abs)", () => {
    expect(formatCurrency(-1234.56)).toBe("R$\u00A01.234,56");
  });

  it("deve formatar zero", () => {
    expect(formatCurrency(0)).toBe("R$\u00A00,00");
  });

  it("deve formatar valores grandes", () => {
    expect(formatCurrency(1000000)).toBe("R$\u00A01.000.000,00");
  });

  it("deve formatar centavos", () => {
    expect(formatCurrency(0.99)).toBe("R$\u00A00,99");
  });
});

describe("formatNumber", () => {
  it("deve formatar números inteiros com separadores de milhar", () => {
    expect(formatNumber(1234)).toBe("1.234");
  });

  it("deve formatar números grandes", () => {
    expect(formatNumber(1000000)).toBe("1.000.000");
  });

  it("deve formatar zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("deve formatar números decimais", () => {
    expect(formatNumber(1234.56)).toBe("1.234,56");
  });
});

describe("formatCPFCNPJ", () => {
  it("deve formatar CPF corretamente", () => {
    expect(formatCPFCNPJ("12345678901")).toBe("123.456.789-01");
  });

  it("deve formatar CNPJ corretamente", () => {
    expect(formatCPFCNPJ("12345678000199")).toBe("12.345.678/0001-99");
  });

  it("deve retornar traço para valor null", () => {
    expect(formatCPFCNPJ(null)).toBe("—");
  });

  it("deve retornar traço para string vazia", () => {
    expect(formatCPFCNPJ("")).toBe("—");
  });

  it("deve limpar caracteres não numéricos antes de formatar CPF", () => {
    expect(formatCPFCNPJ("123.456.789-01")).toBe("123.456.789-01");
  });

  it("deve limpar caracteres não numéricos antes de formatar CNPJ", () => {
    expect(formatCPFCNPJ("12.345.678/0001-99")).toBe("12.345.678/0001-99");
  });

  it("deve retornar valor original se não for CPF nem CNPJ", () => {
    expect(formatCPFCNPJ("123")).toBe("123");
  });
});

describe("formatPercent", () => {
  it("deve formatar porcentagem com 1 casa decimal por padrão", () => {
    expect(formatPercent(0.5)).toBe("50,0%");
  });

  it("deve formatar porcentagem com casas decimais customizadas", () => {
    expect(formatPercent(0.3333, 2)).toBe("33,33%");
  });

  it("deve formatar 100%", () => {
    expect(formatPercent(1)).toBe("100,0%");
  });

  it("deve formatar 0%", () => {
    expect(formatPercent(0)).toBe("0,0%");
  });

  it("deve formatar valores maiores que 100%", () => {
    expect(formatPercent(1.5)).toBe("150,0%");
  });
});

describe("formatDays", () => {
  it("deve usar singular para 1 dia", () => {
    expect(formatDays(1)).toBe("1 dia");
  });

  it("deve usar plural para 0 dias", () => {
    expect(formatDays(0)).toBe("0 dias");
  });

  it("deve usar plural para múltiplos dias", () => {
    expect(formatDays(15)).toBe("15 dias");
  });

  it("deve funcionar com números grandes", () => {
    expect(formatDays(365)).toBe("365 dias");
  });
});
