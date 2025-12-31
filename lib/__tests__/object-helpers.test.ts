import { describe, it, expect } from "vitest";
import { getValue, hasValue, normalizeKeys } from "../object-helpers";

describe("getValue", () => {
  it("deve retornar valor quando chave camelCase existe", () => {
    const obj = { codFinanceiro: 123 };
    const result = getValue<number>(obj, "codFinanceiro", "CodFinanceiro");
    expect(result).toBe(123);
  });

  it("deve retornar valor quando chave PascalCase existe", () => {
    const obj = { CodFinanceiro: 456 };
    const result = getValue<number>(obj, "codFinanceiro", "CodFinanceiro");
    expect(result).toBe(456);
  });

  it("deve priorizar camelCase quando ambas existem", () => {
    const obj = { codFinanceiro: 100, CodFinanceiro: 200 };
    const result = getValue<number>(obj, "codFinanceiro", "CodFinanceiro");
    expect(result).toBe(100);
  });

  it("deve retornar undefined quando nenhuma chave existe", () => {
    const obj = { outroValor: 999 };
    const result = getValue<number>(obj, "codFinanceiro", "CodFinanceiro");
    expect(result).toBeUndefined();
  });

  it("deve funcionar com strings", () => {
    const obj = { NomeProjeto: "Teste" };
    const result = getValue<string>(obj, "nomeProjeto", "NomeProjeto");
    expect(result).toBe("Teste");
  });

  it("deve fazer fallback para PascalCase quando camelCase é null (nullish coalescing)", () => {
    // Nota: A implementação usa ?? (nullish coalescing), então null faz fallback
    const obj = { valor: null, Valor: "fallback" };
    const result = getValue<string>(obj, "valor", "Valor");
    expect(result).toBe("fallback");
  });

  it("deve retornar undefined quando camelCase é null e PascalCase não existe", () => {
    const obj = { valor: null };
    const result = getValue<null>(obj, "valor", "Valor");
    expect(result).toBeUndefined();
  });

  it("deve retornar valor falsy (0, false, empty string)", () => {
    expect(getValue<number>({ count: 0 }, "count", "Count")).toBe(0);
    expect(getValue<boolean>({ active: false }, "active", "Active")).toBe(false);
    expect(getValue<string>({ name: "" }, "name", "Name")).toBe("");
  });
});

describe("hasValue", () => {
  it("deve retornar true quando chave camelCase existe", () => {
    const obj = { codFinanceiro: 123 };
    expect(hasValue(obj, "codFinanceiro", "CodFinanceiro")).toBe(true);
  });

  it("deve retornar true quando chave PascalCase existe", () => {
    const obj = { CodFinanceiro: 456 };
    expect(hasValue(obj, "codFinanceiro", "CodFinanceiro")).toBe(true);
  });

  it("deve retornar true quando ambas existem", () => {
    const obj = { codFinanceiro: 100, CodFinanceiro: 200 };
    expect(hasValue(obj, "codFinanceiro", "CodFinanceiro")).toBe(true);
  });

  it("deve retornar false quando nenhuma chave existe", () => {
    const obj = { outroValor: 999 };
    expect(hasValue(obj, "codFinanceiro", "CodFinanceiro")).toBe(false);
  });

  it("deve retornar true mesmo para valores undefined", () => {
    const obj = { codFinanceiro: undefined };
    expect(hasValue(obj, "codFinanceiro", "CodFinanceiro")).toBe(true);
  });
});

describe("normalizeKeys", () => {
  it("deve converter PascalCase para camelCase", () => {
    const obj = { NomeProjeto: "Teste", CodFinanceiro: 123 };
    const result = normalizeKeys(obj);
    expect(result).toEqual({ nomeProjeto: "Teste", codFinanceiro: 123 });
  });

  it("deve manter chaves já em camelCase", () => {
    const obj = { nomeProjeto: "Teste", codFinanceiro: 123 };
    const result = normalizeKeys(obj);
    expect(result).toEqual({ nomeProjeto: "Teste", codFinanceiro: 123 });
  });

  it("deve funcionar com objeto vazio", () => {
    const result = normalizeKeys({});
    expect(result).toEqual({});
  });

  it("deve preservar valores de diferentes tipos", () => {
    const obj = {
      StringValue: "texto",
      NumberValue: 42,
      BoolValue: true,
      NullValue: null,
      ArrayValue: [1, 2, 3],
    };
    const result = normalizeKeys(obj);
    expect(result).toEqual({
      stringValue: "texto",
      numberValue: 42,
      boolValue: true,
      nullValue: null,
      arrayValue: [1, 2, 3],
    });
  });

  it("deve converter chaves de uma letra", () => {
    const obj = { A: 1, B: 2 };
    const result = normalizeKeys(obj);
    expect(result).toEqual({ a: 1, b: 2 });
  });
});
